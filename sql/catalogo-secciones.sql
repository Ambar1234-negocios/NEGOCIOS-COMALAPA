-- Secciones vacías persistentes para catálogos visuales; usa los permisos del editor.
CREATE OR REPLACE FUNCTION public.catalogo_visual_seccion_crear(negocio text, version integer, nombre text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE m public.piloto_menus_completos; titulo text; existente text; secciones jsonb; antes jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.dueno_permitido_v53(negocio),false) THEN
  RAISE EXCEPTION 'Sin acceso a este negocio.' USING errcode='42501';
 END IF;
 titulo:=regexp_replace(btrim(nombre),'[[:space:]]+',' ','g');
 IF titulo IS NULL OR char_length(titulo) NOT BETWEEN 1 AND 80 OR nombre ~ '[[:cntrl:]]' THEN
  RAISE EXCEPTION 'Escribe un nombre de sección de 1 a 80 caracteres.';
 END IF;
 SELECT * INTO m FROM public.piloto_menus_completos WHERE slug=negocio FOR UPDATE;
 IF NOT FOUND OR m.original->>'tipoCatalogo' IS DISTINCT FROM 'visual' THEN RAISE EXCEPTION 'No es un catálogo visual.'; END IF;
 IF version IS DISTINCT FROM m.revision THEN RAISE EXCEPTION 'El catálogo cambió. Actualiza antes de crear la sección.'; END IF;
 secciones:=coalesce(nullif(m.original->'seccionesCatalogo','null'::jsonb),'[]'::jsonb);
 IF jsonb_typeof(secciones) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Revisa la configuración de secciones.'; END IF;
 SELECT s INTO existente FROM (
  SELECT unnest(ARRAY['Vestidos','Blusas','Pantalones','Shorts','Conjuntos','Bolsas','Accesorios','Joyería']) AS s
  UNION ALL SELECT jsonb_array_elements_text(secciones)
  UNION ALL SELECT p->>'seccion' FROM jsonb_array_elements(coalesce(m.borrador->'productos','[]'::jsonb)) p WHERE coalesce((p->>'eliminado')::boolean,false)=false
 ) x WHERE lower(btrim(s))=lower(titulo) LIMIT 1;
 IF existente IS NOT NULL THEN RETURN jsonb_build_object('seccion',existente,'revision',m.revision,'creada',false); END IF;
 IF jsonb_array_length(secciones)>=50 THEN RAISE EXCEPTION 'Puedes crear hasta 50 secciones adicionales.'; END IF;
 antes:=m.original-'productos';
 secciones:=secciones||jsonb_build_array(titulo);
 UPDATE public.piloto_menus_completos SET original=jsonb_set(original,'{seccionesCatalogo}',secciones),borrador=jsonb_set(borrador,'{seccionesCatalogo}',secciones),revision=revision+1,actualizado_en=now() WHERE slug=negocio RETURNING * INTO m;
 INSERT INTO public.sitio_historial(tipo,registro,anterior,nuevo,actor) VALUES('negocios',negocio,antes,m.original-'productos',auth.uid());
 RETURN jsonb_build_object('seccion',titulo,'revision',m.revision,'creada',true);
END $$;
REVOKE ALL ON FUNCTION public.catalogo_visual_seccion_crear(text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.catalogo_visual_seccion_crear(text,integer,text) TO authenticated;
