CREATE OR REPLACE FUNCTION public.catalogo_producto_visibilidad(negocio text, version integer, producto text, visible boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE m public.piloto_menus_completos; previo jsonb; nuevo jsonb; lista jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.dueno_permitido_v53(negocio),false) THEN
  RAISE EXCEPTION 'Sin acceso a este negocio.' USING errcode='42501';
 END IF;
 SELECT * INTO m FROM public.piloto_menus_completos WHERE slug=negocio FOR UPDATE;
 IF NOT FOUND OR jsonb_typeof(m.original->'productos') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Este negocio no tiene un catálogo.'; END IF;
 IF version IS DISTINCT FROM m.revision THEN RAISE EXCEPTION 'El catálogo cambió. Actualiza antes de continuar.'; END IF;
 IF visible IS NULL THEN RAISE EXCEPTION 'Indica la visibilidad.'; END IF;
 SELECT value INTO previo FROM jsonb_array_elements(m.original->'productos') WHERE value->>'id'=producto;
 IF previo IS NULL OR previo->>'eliminado'='true' THEN RAISE EXCEPTION 'Producto inexistente o eliminado.'; END IF;
 IF previo->>'soloInformativo'='true' AND m.original->>'tipoCatalogo' IS DISTINCT FROM 'visual' AND m.original->>'categoriasDinamicas' IS DISTINCT FROM 'true' THEN
  RAISE EXCEPTION 'Esta ficha es informativa.';
 END IF;
 nuevo:=previo||jsonb_build_object('disponible',visible);
 SELECT jsonb_agg(CASE WHEN value->>'id'=producto THEN nuevo ELSE value END ORDER BY ordinality)
 INTO lista FROM jsonb_array_elements(m.original->'productos') WITH ORDINALITY;
 m.original:=jsonb_set(m.original,'{productos}',lista);
 SELECT jsonb_agg(CASE WHEN value->>'id'=producto THEN value||jsonb_build_object('disponible',visible) ELSE value END ORDER BY ordinality)
 INTO lista FROM jsonb_array_elements(m.borrador->'productos') WITH ORDINALITY;
 m.borrador:=jsonb_set(m.borrador,'{productos}',lista);
 UPDATE public.piloto_menus_completos SET original=m.original,borrador=m.borrador,revision=m.revision+1,actualizado_en=now() WHERE slug=negocio;
 INSERT INTO public.menu_productos_publicados(negocio,producto,contenido,publicado_en,publicado_por,revision)
 VALUES(negocio,producto,nuevo,now(),auth.uid(),m.revision+1)
 ON CONFLICT ON CONSTRAINT menu_productos_publicados_pkey DO UPDATE SET contenido=jsonb_set(public.menu_productos_publicados.contenido,'{disponible}',to_jsonb(visible)),publicado_en=excluded.publicado_en,publicado_por=excluded.publicado_por,revision=excluded.revision;
 INSERT INTO public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) VALUES(negocio,producto,previo,nuevo,auth.uid());
 RETURN jsonb_build_object('producto',producto,'revision',m.revision+1,'visible',visible);
END $function$;
REVOKE ALL ON FUNCTION public.catalogo_producto_visibilidad(text,integer,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.catalogo_producto_visibilidad(text,integer,text,boolean) TO authenticated;
