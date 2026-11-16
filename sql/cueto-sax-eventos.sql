-- Cambio exclusivo de servicios; no modifica datos de contacto ni identidad.
DO $patch$
DECLARE m public.piloto_menus_completos; tarjetas jsonb := '[{"tipo":"evento","evento":"bodas","nombre":"Bodas","foto":"","descripcion":""},{"tipo":"evento","evento":"bautizos","nombre":"Bautizos","foto":"","descripcion":""},{"tipo":"evento","evento":"xv","nombre":"XV años","foto":"","descripcion":""},{"tipo":"evento","evento":"serenatas","nombre":"Serenatas","foto":"","descripcion":""},{"tipo":"evento","evento":"cumpleanos","nombre":"Cumpleaños","foto":"","descripcion":""},{"tipo":"evento","evento":"especiales","nombre":"Eventos especiales","foto":"","descripcion":""},{"tipo":"evento","evento":"otro","nombre":"Otro tipo de evento","foto":"","descripcion":""}]'::jsonb; despues jsonb;
BEGIN
 SELECT * INTO STRICT m FROM public.piloto_menus_completos WHERE slug='cueto-sax' FOR UPDATE;
 IF m.original->'servicios' @> '[{"tipo":"evento"}]'::jsonb THEN RETURN; END IF;
 IF m.revision<>4 OR m.original->>'whatsapp'<>'9636357763' THEN RAISE EXCEPTION 'El perfil cambió; revisar antes de aplicar'; END IF;
 despues:=jsonb_set(m.original,'{servicios}',tarjetas);
 PERFORM public.sitio_validar(tarjetas);
 UPDATE public.piloto_menus_completos SET original=despues,borrador=jsonb_set(borrador,'{servicios}',tarjetas),revision=revision+1,actualizado_en=now() WHERE slug=m.slug;
 INSERT INTO public.sitio_historial(id,tipo,registro,anterior,nuevo) VALUES(gen_random_uuid(),'negocios',m.slug,m.original-'productos',despues-'productos');
 IF (m.original-'servicios') IS DISTINCT FROM (despues-'servicios') THEN RAISE EXCEPTION 'Cambio fuera del alcance'; END IF;
END $patch$;
