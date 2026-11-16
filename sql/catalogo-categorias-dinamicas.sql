-- Reutiliza seccionesCatalogo y productos[].seccion; no crea otra tabla de catálogo.
CREATE OR REPLACE FUNCTION public.catalogo_seccion_administrar(
 negocio text, version integer, accion text, seccion text,
 nombre text DEFAULT NULL, posicion integer DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.piloto_menus_completos; categorias jsonb; ocultas jsonb; titulo text;
 antes jsonb; doc jsonb; k text; lista jsonb; origen text; resultado text;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.dueno_accesos_v53 a JOIN auth.users u ON lower(u.email)=a.correo
  WHERE u.id=auth.uid() AND a.negocio=catalogo_seccion_administrar.negocio AND a.activo
   AND u.email_confirmed_at IS NOT NULL AND (u.banned_until IS NULL OR u.banned_until<now())
 ) THEN
  RAISE EXCEPTION 'Sin acceso a este negocio.' USING errcode='42501';
 END IF;
 SELECT * INTO m FROM public.piloto_menus_completos WHERE slug=negocio FOR UPDATE;
 IF NOT FOUND OR m.original->>'categoriasDinamicas' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Categorías dinámicas no habilitadas.'; END IF;
 IF version IS DISTINCT FROM m.revision THEN RAISE EXCEPTION 'El catálogo cambió. Actualiza antes de continuar.'; END IF;
 categorias:=coalesce(m.original->'seccionesCatalogo','[]');
 ocultas:=coalesce(m.original->'seccionesOcultas','[]');
 origen:=regexp_replace(btrim(seccion),'[[:space:]]+',' ','g');
 titulo:=regexp_replace(btrim(CASE WHEN accion='crear' THEN seccion ELSE nombre END),'[[:space:]]+',' ','g');
 IF accion IN ('crear','renombrar') THEN
  IF titulo IS NULL OR char_length(titulo) NOT BETWEEN 1 AND 80 OR titulo ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Escribe un nombre de 1 a 80 caracteres.'; END IF;
  SELECT value INTO resultado FROM jsonb_array_elements_text(categorias) WHERE lower(value)=lower(titulo) LIMIT 1;
  IF accion='crear' AND resultado IS NOT NULL THEN RETURN jsonb_build_object('seccion',resultado,'creada',false,'revision',m.revision); END IF;
  IF accion='renombrar' AND resultado IS NOT NULL AND resultado<>origen THEN RAISE EXCEPTION 'Ya existe esa categoría.'; END IF;
 END IF;
 IF accion<>'crear' AND NOT categorias ? origen THEN RAISE EXCEPTION 'Categoría inexistente.'; END IF;
 antes:=m.original;
 IF accion='crear' THEN
  IF jsonb_array_length(categorias)>=50 THEN RAISE EXCEPTION 'Máximo 50 categorías.'; END IF;
  categorias:=categorias||jsonb_build_array(titulo);
 ELSIF accion='renombrar' THEN
  SELECT coalesce(jsonb_agg(CASE WHEN value=origen THEN titulo ELSE value END ORDER BY ordinality),'[]') INTO categorias FROM jsonb_array_elements_text(categorias) WITH ORDINALITY;
  SELECT coalesce(jsonb_agg(CASE WHEN value=origen THEN titulo ELSE value END),'[]') INTO ocultas FROM jsonb_array_elements_text(ocultas);
  FOREACH k IN ARRAY ARRAY['original','borrador'] LOOP
   doc:=CASE WHEN k='original' THEN m.original ELSE m.borrador END;
   SELECT coalesce(jsonb_agg(CASE WHEN coalesce(nullif(btrim(value->>'seccion'),''),'Otros productos')=origen THEN value||jsonb_build_object('seccion',titulo) ELSE value END ORDER BY ordinality),'[]') INTO lista FROM jsonb_array_elements(doc->'productos') WITH ORDINALITY;
   IF k='original' THEN m.original:=jsonb_set(doc,'{productos}',lista); ELSE m.borrador:=jsonb_set(doc,'{productos}',lista); END IF;
  END LOOP;
  UPDATE public.menu_productos_publicados p SET contenido=p.contenido||jsonb_build_object('seccion',titulo),revision=m.revision+1,publicado_en=now(),publicado_por=auth.uid() WHERE p.negocio=catalogo_seccion_administrar.negocio AND coalesce(nullif(btrim(p.contenido->>'seccion'),''),'Otros productos')=origen;
 ELSIF accion='ordenar' THEN
  IF posicion IS NULL OR posicion<0 OR posicion>=jsonb_array_length(categorias) THEN RAISE EXCEPTION 'Posición inválida.'; END IF;
  SELECT coalesce(jsonb_agg(value ORDER BY ordinality),'[]') INTO categorias FROM jsonb_array_elements_text(categorias) WITH ORDINALITY WHERE value<>origen;
  SELECT jsonb_agg(value ORDER BY orden) INTO categorias FROM (
   SELECT value,CASE WHEN ordinality<=posicion THEN ordinality-1 ELSE ordinality END AS orden FROM jsonb_array_elements_text(categorias) WITH ORDINALITY
   UNION ALL SELECT origen,posicion
  ) x;
 ELSIF accion='ocultar' THEN
  IF NOT ocultas ? origen THEN ocultas:=ocultas||jsonb_build_array(origen); END IF;
 ELSIF accion='mostrar' THEN ocultas:=ocultas-origen;
 ELSIF accion='eliminar' THEN
  IF EXISTS(SELECT 1 FROM jsonb_array_elements((m.original->'productos')||(m.borrador->'productos')) p WHERE coalesce(nullif(btrim(p->>'seccion'),''),'Otros productos')=origen)
   OR EXISTS(SELECT 1 FROM public.menu_productos_publicados p WHERE p.negocio=catalogo_seccion_administrar.negocio AND coalesce(nullif(btrim(p.contenido->>'seccion'),''),'Otros productos')=origen) THEN RAISE EXCEPTION 'La categoría tiene productos. Reasígnalos antes de eliminarla.'; END IF;
  categorias:=categorias-origen;ocultas:=ocultas-origen;
 ELSE RAISE EXCEPTION 'Acción inválida.';
 END IF;
 m.original:=m.original||jsonb_build_object('seccionesCatalogo',categorias,'seccionesOcultas',ocultas);
 m.borrador:=m.borrador||jsonb_build_object('seccionesCatalogo',categorias,'seccionesOcultas',ocultas);
 UPDATE public.piloto_menus_completos SET original=m.original,borrador=m.borrador,revision=m.revision+1,actualizado_en=now() WHERE slug=negocio;
 INSERT INTO public.sitio_historial(tipo,registro,anterior,nuevo,actor) VALUES('negocios',negocio,antes,m.original,auth.uid());
 RETURN jsonb_build_object('seccion',coalesce(titulo,origen),'creada',accion='crear','revision',m.revision+1);
END $$;
REVOKE ALL ON FUNCTION public.catalogo_seccion_administrar(text,integer,text,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.catalogo_seccion_administrar(text,integer,text,text,text,integer) TO authenticated;

-- Aplica también a las RPC de productos existentes: nunca cruza el vínculo del dueño.
CREATE OR REPLACE FUNCTION public.catalogo_dinamico_validar() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE doc jsonb; k text; categorias jsonb; s text;
BEGIN
 IF NEW.original->>'categoriasDinamicas' IS DISTINCT FROM 'true' THEN RETURN NEW; END IF;
 IF auth.uid() IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.dueno_accesos_v53 a JOIN auth.users u ON lower(u.email)=a.correo
  WHERE u.id=auth.uid() AND a.negocio=NEW.slug AND a.activo AND u.email_confirmed_at IS NOT NULL
   AND (u.banned_until IS NULL OR u.banned_until<now())
 ) THEN RAISE EXCEPTION 'Solo el dueño vinculado puede editar este catálogo.' USING errcode='42501'; END IF;
 categorias:=coalesce(NEW.original->'seccionesCatalogo','[]');
 -- Mantiene categorías introducidas desde el selector al guardar productos.
 FOR s IN SELECT DISTINCT coalesce(nullif(btrim(p->>'seccion'),''),'Otros productos') FROM jsonb_array_elements((NEW.original->'productos')||(NEW.borrador->'productos')) p LOOP
  IF NOT categorias ? s THEN categorias:=categorias||jsonb_build_array(s); END IF;
 END LOOP;
 NEW.original:=jsonb_set(NEW.original,'{seccionesCatalogo}',categorias);
 NEW.borrador:=jsonb_set(NEW.borrador,'{seccionesCatalogo}',categorias);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.catalogo_dinamico_validar() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER catalogo_dinamico_validar BEFORE UPDATE ON public.piloto_menus_completos
FOR EACH ROW EXECUTE FUNCTION public.catalogo_dinamico_validar();

-- Solo habilita Sayer y conserva todos los productos, fotos, fichas y precios.
DO $$
DECLARE m public.piloto_menus_completos; categorias jsonb; antes jsonb;
BEGIN
 SELECT * INTO m FROM public.piloto_menus_completos WHERE slug='el-titan-de-las-pinturas' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Falta Sayer'; END IF;
 antes:=m.original;
 SELECT jsonb_agg(s ORDER BY orden) INTO categorias FROM (
  SELECT s,min(orden) orden FROM (
   SELECT value s,ordinality orden FROM jsonb_array_elements_text(coalesce(m.original->'seccionesCatalogo','[]')) WITH ORDINALITY
   UNION ALL SELECT coalesce(nullif(btrim(value->>'seccion'),''),'Otros productos'),1000+ordinality FROM jsonb_array_elements((m.original->'productos')||(m.borrador->'productos')) WITH ORDINALITY
   UNION ALL SELECT value,100000+ordinality FROM jsonb_array_elements_text('["Pintura automotriz","Pintura para casa","Herramientas","Madera y metal","Impermeabilizantes","Detallado automotriz"]') WITH ORDINALITY
  ) x GROUP BY s
 ) x;
 UPDATE public.piloto_menus_completos SET original=original||jsonb_build_object('categoriasDinamicas',true,'tipoCatalogo','tecnico','seccionesCatalogo',categorias,'seccionesOcultas',coalesce(original->'seccionesOcultas','[]')),borrador=borrador||jsonb_build_object('categoriasDinamicas',true,'tipoCatalogo','tecnico','seccionesCatalogo',categorias,'seccionesOcultas',coalesce(borrador->'seccionesOcultas','[]')),revision=revision+1,actualizado_en=now() WHERE slug=m.slug;
 INSERT INTO public.sitio_historial(tipo,registro,anterior,nuevo,actor) SELECT 'negocios',slug,antes,original,auth.uid() FROM public.piloto_menus_completos WHERE slug=m.slug;
END $$;
