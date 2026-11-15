
-- Visual catalogs reuse the existing owner authorization, image validator and publication history.
CREATE OR REPLACE FUNCTION public.catalogo_visual_modelo_guardar(negocio text, version integer, producto text, datos jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE m public.piloto_menus_completos; previo jsonb; nuevo jsonb; indice integer;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.dueno_permitido_v53(negocio),false) THEN RAISE EXCEPTION 'Sin acceso a este negocio.' USING errcode='42501'; END IF;
 SELECT * INTO m FROM public.piloto_menus_completos WHERE slug=negocio FOR UPDATE;
 IF NOT FOUND OR m.original->>'tipoCatalogo' IS DISTINCT FROM 'visual' THEN RAISE EXCEPTION 'No es un catalogo visual.'; END IF;
 IF version IS DISTINCT FROM m.revision THEN RAISE EXCEPTION 'El catalogo cambio. Actualiza antes de guardar.'; END IF;
 IF producto IS NULL OR producto !~ '^[a-f0-9-]{36}$' OR datos IS NULL OR jsonb_typeof(datos)<>'object' OR octet_length(datos::text)>40000
 OR EXISTS(SELECT 1 FROM jsonb_object_keys(datos) k WHERE k NOT IN ('nombre','precio','seccion','ingredientes','disponible','fichaAvanzada')) THEN RAISE EXCEPTION 'Modelo invalido.'; END IF;
 IF jsonb_typeof(datos->'nombre') IS DISTINCT FROM 'string' OR char_length(trim(datos->>'nombre')) NOT BETWEEN 1 AND 120
 OR char_length(coalesce(datos->>'seccion',''))>80 OR char_length(coalesce(datos->>'ingredientes',''))>4000
 OR jsonb_typeof(datos->'disponible') IS DISTINCT FROM 'boolean'
 OR (datos->>'precio' IS NOT NULL AND (jsonb_typeof(datos->'precio')<>'number' OR (datos->>'precio')::numeric NOT BETWEEN 0 AND 100000 OR round((datos->>'precio')::numeric,2)<>(datos->>'precio')::numeric))
 THEN RAISE EXCEPTION 'Revisa nombre, descripcion, seccion y precio opcional.'; END IF;
 SELECT (ordinality-1)::integer,value INTO indice,previo FROM jsonb_array_elements(m.original->'productos') WITH ORDINALITY WHERE value->>'id'=producto;
 IF previo->>'eliminado'='true' THEN RAISE EXCEPTION 'Restaura el modelo antes de editarlo.'; END IF;
 IF previo IS NULL AND jsonb_array_length(m.original->'productos')>=500 THEN RAISE EXCEPTION 'Limite de 500 modelos.'; END IF;
 IF jsonb_typeof(datos->'fichaAvanzada') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Agrega la configuracion de fotos.'; END IF;
 PERFORM public.menu_validar_ficha_avanzada(datos->'fichaAvanzada',coalesce(previo,'{}'::jsonb));
 nuevo:=jsonb_build_object('id',producto,'nombre',trim(datos->>'nombre'),'precio',datos->'precio','seccion',trim(coalesce(datos->>'seccion','')),'ingredientes',coalesce(datos->>'ingredientes',''),'disponible',datos->'disponible','enCarrusel',false,'extras','[]'::jsonb,'gruposOpciones','[]'::jsonb,'foto',coalesce(datos#>>'{fichaAvanzada,fotos,0}',''),'fichaAvanzada',datos->'fichaAvanzada');
 IF previo IS NULL THEN
 UPDATE public.piloto_menus_completos SET original=jsonb_set(original,'{productos}',original->'productos'||jsonb_build_array(nuevo)),borrador=jsonb_set(borrador,'{productos}',borrador->'productos'||jsonb_build_array(nuevo)),revision=revision+1,actualizado_en=now() WHERE slug=negocio RETURNING * INTO m;
 ELSE
 UPDATE public.piloto_menus_completos SET original=jsonb_set(original,ARRAY['productos',indice::text],nuevo),borrador=jsonb_set(borrador,ARRAY['productos',indice::text],nuevo),revision=revision+1,actualizado_en=now() WHERE slug=negocio RETURNING * INTO m;
 END IF;
 INSERT INTO public.menu_productos_publicados(negocio,producto,contenido,publicado_en,publicado_por,revision) VALUES(negocio,producto,nuevo,now(),auth.uid(),m.revision)
 ON CONFLICT ON CONSTRAINT menu_productos_publicados_pkey DO UPDATE SET contenido=excluded.contenido,publicado_en=excluded.publicado_en,publicado_por=excluded.publicado_por,revision=excluded.revision;
 INSERT INTO public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) VALUES(negocio,producto,coalesce(previo,'{}'::jsonb),nuevo,auth.uid());
 RETURN jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);
END $$;
REVOKE ALL ON FUNCTION public.catalogo_visual_modelo_guardar(text,integer,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.catalogo_visual_modelo_guardar(text,integer,text,jsonb) TO authenticated;
