CREATE OR REPLACE FUNCTION public.catalogo_visual_modelo_guardar(negocio text, version integer, producto text, datos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE m public.piloto_menus_completos; previo jsonb; nuevo jsonb; indice integer;
BEGIN
 IF auth.uid() IS NULL OR NOT coalesce(public.dueno_permitido_v53(negocio),false) THEN RAISE EXCEPTION 'Sin acceso a este negocio.' USING errcode='42501'; END IF;
 SELECT * INTO m FROM public.piloto_menus_completos WHERE slug=negocio FOR UPDATE;
 IF NOT FOUND OR m.original->>'tipoCatalogo' IS DISTINCT FROM 'visual' THEN RAISE EXCEPTION 'No es un catalogo visual.'; END IF;
 IF version IS DISTINCT FROM m.revision THEN RAISE EXCEPTION 'El catalogo cambio. Actualiza antes de guardar.'; END IF;
 IF producto IS NULL OR producto !~ '^[a-f0-9-]{36}$' OR datos IS NULL OR jsonb_typeof(datos)<>'object' OR octet_length(datos::text)>40000
 OR EXISTS(SELECT 1 FROM jsonb_object_keys(datos) k WHERE k NOT IN ('nombre','precio','seccion','ingredientes','disponible','fichaAvanzada','enTendencias')) THEN RAISE EXCEPTION 'Modelo invalido.'; END IF;
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
 IF datos ? 'enTendencias' AND (jsonb_typeof(datos->'enTendencias') IS DISTINCT FROM 'boolean' OR (datos->'enTendencias' = 'true'::jsonb AND NOT coalesce((m.original->>'tipoCatalogo' IN ('visual','tecnico','digital') AND m.original->>'catalogoServicios' IS DISTINCT FROM 'true' AND coalesce(m.original->>'categoria','') NOT IN ('comida','cat-comida-y-restaurantes')), false))) THEN RAISE EXCEPTION 'Tendencias requiere un catalogo de productos elegible.'; END IF;
 IF datos ? 'enTendencias' THEN
  nuevo := jsonb_set(nuevo, '{enTendencias}', datos->'enTendencias');
 ELSIF previo ? 'enTendencias' THEN
  nuevo := jsonb_set(nuevo, '{enTendencias}', previo->'enTendencias');
 END IF;
 IF previo IS NULL THEN
 UPDATE public.piloto_menus_completos SET original=jsonb_set(original,'{productos}',original->'productos'||jsonb_build_array(nuevo)),borrador=jsonb_set(borrador,'{productos}',borrador->'productos'||jsonb_build_array(nuevo)),revision=revision+1,actualizado_en=now() WHERE slug=negocio RETURNING * INTO m;
 ELSE
 UPDATE public.piloto_menus_completos SET original=jsonb_set(original,ARRAY['productos',indice::text],nuevo),borrador=jsonb_set(borrador,ARRAY['productos',indice::text],nuevo),revision=revision+1,actualizado_en=now() WHERE slug=negocio RETURNING * INTO m;
 END IF;
 INSERT INTO public.menu_productos_publicados(negocio,producto,contenido,publicado_en,publicado_por,revision) VALUES(negocio,producto,nuevo,now(),auth.uid(),m.revision)
 ON CONFLICT ON CONSTRAINT menu_productos_publicados_pkey DO UPDATE SET contenido=excluded.contenido,publicado_en=excluded.publicado_en,publicado_por=excluded.publicado_por,revision=excluded.revision;
 INSERT INTO public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) VALUES(negocio,producto,coalesce(previo,'{}'::jsonb),nuevo,auth.uid());
 RETURN jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);
END $function$;

CREATE OR REPLACE FUNCTION public.menu_producto_crear(negocio text, version integer, producto uuid, datos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.piloto_menus_completos;nuevo jsonb;previo jsonb;foto text;ruta text;begin
 if not public.dueno_permitido_v53(negocio) then raise exception 'Solo administracion agrega productos.' using errcode='42501';end if;
 if producto is null or datos is null or jsonb_typeof(datos)<>'object' or octet_length(datos::text)>50000 or exists(select 1 from jsonb_object_keys(datos) k where k not in ('nombre','precio','ingredientes','disponible','foto','seccion','enCarrusel','gruposOpciones','extras','publicidad','fichaAvanzada','enTendencias')) then raise exception 'Datos invalidos.';end if;
 if char_length(trim(coalesce(datos->>'nombre',''))) not between 1 and 120 or char_length(coalesce(datos->>'ingredientes',''))>4000 or char_length(coalesce(datos->>'seccion',''))>80 or jsonb_typeof(datos->'precio') is distinct from 'number' or (datos->>'precio')::numeric not between 0 and 100000 or round((datos->>'precio')::numeric,2)<>(datos->>'precio')::numeric or jsonb_typeof(datos->'disponible') is distinct from 'boolean' then raise exception 'Revisa nombre, precio, descripcion y seccion.';end if;
 foto:=coalesce(datos->>'foto','');
 if foto<>'' then
 if foto not like 'https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/%' then raise exception 'Selecciona una foto desde el panel.';end if;
 ruta:=substr(foto,length('https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/')+1);
 if split_part(ruta,'/',1)<>auth.uid()::text or ruta !~ '^[a-f0-9-]+/[a-f0-9-]+\.webp$' or not exists(select 1 from storage.objects where bucket_id='menu-publico' and name=ruta and metadata->>'mimetype'='image/webp') then raise exception 'La foto no esta cargada o no pertenece a esta cuenta.';end if;
 end if;
 nuevo:=jsonb_build_object('id',producto::text,'nombre',trim(datos->>'nombre'),'precio',datos->'precio','ingredientes',coalesce(datos->>'ingredientes',''),'foto',foto,'seccion',trim(coalesce(datos->>'seccion','')),'disponible',datos->'disponible','enCarrusel',false,'gruposOpciones',coalesce(datos->'gruposOpciones','[]'::jsonb),'extras',coalesce(datos->'extras','[]'::jsonb));
 perform public.menu_validar_ficha_avanzada(datos->'fichaAvanzada');
 if datos ? 'fichaAvanzada' then nuevo:=jsonb_set(nuevo,'{fichaAvanzada}',datos->'fichaAvanzada');end if;
 perform public.menu_validar_elecciones(nuevo);
 select * into m from public.piloto_menus_completos where slug=negocio for update;
 if not found then raise exception 'Negocio inexistente.';end if;
 if not coalesce(public.piloto_es_admin(),false) then datos:=jsonb_set(datos,'{publicidad}',coalesce(datos->'publicidad','{}')||jsonb_build_object('enCarrusel',false));end if;
 nuevo:=public.menu_aplicar_publicidad(nuevo,datos->'publicidad',m.plan);
 select value into previo from jsonb_array_elements(m.original->'productos') where value->>'id'=producto::text;
 if previo is not null then
 IF datos ? 'enTendencias' AND (jsonb_typeof(datos->'enTendencias') IS DISTINCT FROM 'boolean' OR (datos->'enTendencias' = 'true'::jsonb AND NOT coalesce((m.original->>'tipoCatalogo' IN ('visual','tecnico','digital') AND m.original->>'catalogoServicios' IS DISTINCT FROM 'true' AND coalesce(m.original->>'categoria','') NOT IN ('comida','cat-comida-y-restaurantes')), false))) THEN RAISE EXCEPTION 'Tendencias requiere un catalogo de productos elegible.'; END IF;
 IF datos ? 'enTendencias' THEN
  nuevo := jsonb_set(nuevo, '{enTendencias}', datos->'enTendencias');
 END IF;
 if previo=nuevo then return jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);end if;
 raise exception 'Este producto ya existe. Actualiza el menu.';
 end if;
 if version is null or version<>m.revision then raise exception 'El menu cambio. Actualiza antes de crear.';end if;
 if jsonb_array_length(m.original->'productos')>=500 then raise exception 'Este menu alcanzo 500 productos.';end if;
 update public.piloto_menus_completos set original=jsonb_set(original,'{productos}',coalesce(original->'productos','[]'::jsonb)||jsonb_build_array(nuevo)),borrador=jsonb_set(borrador,'{productos}',coalesce(borrador->'productos','[]'::jsonb)||jsonb_build_array(nuevo)),revision=revision+1,actualizado_en=now() where slug=negocio returning * into m;
 insert into public.menu_productos_publicados values(negocio,producto::text,nuevo,now(),auth.uid(),m.revision);
 insert into public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) values(negocio,producto::text,'{}'::jsonb,nuevo,auth.uid());
 return jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);
end$function$;

CREATE OR REPLACE FUNCTION public.menu_producto_publicar(negocio text, version integer, producto text, cambios jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.piloto_menus_completos;indice int;previo jsonb;nuevo jsonb;nuevo_borrador jsonb;foto text;ruta text;gi int;oi int;g jsonb;o jsonb;promo_previa jsonb;
begin
 if not public.dueno_permitido_v53(negocio) then raise exception 'Solo administraciÃƒÂ³n publica el menÃƒÂº.' using errcode='42501';end if;
 if cambios is null or jsonb_typeof(cambios)<>'object' or octet_length(cambios::text)>40000 then raise exception 'Cambios invÃƒÂ¡lidos.';end if;
 select * into m from public.piloto_menus_completos where slug=negocio for update;
 if not found then raise exception 'Negocio inexistente.';end if;
 select (ordinality-1)::int,value into indice,previo from jsonb_array_elements(m.original->'productos') with ordinality where value->>'id'=producto;
 if previo is null then raise exception 'Producto inexistente.';end if;
 if previo->>'eliminado'='true' then raise exception 'Restaura el producto antes de editarlo.';end if;
 foto:=coalesce(cambios->>'foto',previo->>'foto','');
 if foto<>coalesce(previo->>'foto','') and foto<>'' then
 if foto not like 'https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/%' then raise exception 'Selecciona una foto desde el panel.';end if;
 ruta:=substr(foto,length('https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/')+1);
 if split_part(ruta,'/',1)<>auth.uid()::text or ruta !~ '^[a-f0-9-]+/[a-f0-9-]+\.webp$' or not exists(select 1 from storage.objects where bucket_id='menu-publico' and name=ruta and metadata->>'mimetype'='image/webp') then raise exception 'La imagen no estÃƒÂ¡ cargada o no pertenece a esta cuenta.';end if;
 end if;
 if cambios ? 'seccion' and (jsonb_typeof(cambios->'seccion')<>'string' or char_length(cambios->>'seccion')>80) then raise exception 'Revisa la seccion.';end if;
 if not coalesce(public.piloto_es_admin(),false) then cambios:=jsonb_set(cambios,'{publicidad}',coalesce(cambios->'publicidad','{}')||jsonb_build_object('enCarrusel',coalesce(previo->'enCarrusel','false')));end if;
 perform public.menu_validar_ficha_avanzada(cambios->'fichaAvanzada',previo);
 perform public.piloto_menu_producto_guardar(negocio,version,producto,cambios-array['foto','seccion','publicidad','fichaAvanzada','enTendencias']);
 select * into m from public.piloto_menus_completos where slug=negocio;
 select value into nuevo from jsonb_array_elements(m.borrador->'productos') where value->>'id'=producto;
 -- Existing promotions stay published as they were; old trial drafts are never released incidentally.
 if cambios ? 'seccion' then nuevo:=jsonb_set(nuevo,'{seccion}',to_jsonb(trim(cambios->>'seccion')));end if;
 nuevo:=jsonb_set(nuevo,'{foto}',to_jsonb(foto));
 if cambios ? 'fichaAvanzada' then nuevo:=jsonb_set(nuevo,'{fichaAvanzada}',cambios->'fichaAvanzada');elsif previo ? 'fichaAvanzada' then nuevo:=jsonb_set(nuevo,'{fichaAvanzada}',previo->'fichaAvanzada');end if;
 IF cambios ? 'enTendencias' AND (jsonb_typeof(cambios->'enTendencias') IS DISTINCT FROM 'boolean' OR (cambios->'enTendencias' = 'true'::jsonb AND NOT coalesce((m.original->>'tipoCatalogo' IN ('visual','tecnico','digital') AND m.original->>'catalogoServicios' IS DISTINCT FROM 'true' AND coalesce(m.original->>'categoria','') NOT IN ('comida','cat-comida-y-restaurantes')), false))) THEN RAISE EXCEPTION 'Tendencias requiere un catalogo de productos elegible.'; END IF;
 IF cambios ? 'enTendencias' THEN
  nuevo := jsonb_set(nuevo, '{enTendencias}', cambios->'enTendencias');
 ELSIF previo ? 'enTendencias' THEN
  nuevo := jsonb_set(nuevo, '{enTendencias}', previo->'enTendencias');
 END IF;
 nuevo_borrador:=nuevo;
 if previo ? 'promocion' then nuevo:=jsonb_set(nuevo,'{promocion}',previo->'promocion');else nuevo:=nuevo-'promocion';end if;
 for gi,g in select (ordinality-1)::int,value from jsonb_array_elements(nuevo->'gruposOpciones') with ordinality loop
 for oi,o in select (ordinality-1)::int,value from jsonb_array_elements(g->'opciones') with ordinality loop
 select b->'promocion' into promo_previa from jsonb_array_elements(previo->'gruposOpciones') a cross join lateral jsonb_array_elements(a->'opciones') b where a->>'id'=g->>'id' and b->>'id'=o->>'id';
 if promo_previa is not null then o:=jsonb_set(o,'{promocion}',promo_previa);else o:=o-'promocion';end if;
 nuevo:=jsonb_set(nuevo,array['gruposOpciones',gi::text,'opciones',oi::text],o);
 end loop;
 end loop;
 nuevo:=public.menu_aplicar_publicidad(nuevo,cambios->'publicidad',m.plan);
 nuevo_borrador:=jsonb_set(nuevo_borrador,'{enCarrusel}',coalesce(nuevo->'enCarrusel','false'::jsonb));
 if cambios#>'{publicidad,promocion}' is not null then nuevo_borrador:=nuevo;end if;
 update public.piloto_menus_completos set original=jsonb_set(original,array['productos',indice::text],nuevo),
 borrador=jsonb_set(borrador,array['productos',indice::text],nuevo_borrador) where slug=negocio;
 insert into public.menu_productos_publicados values(negocio,producto,nuevo,now(),auth.uid(),m.revision)
 on conflict on constraint menu_productos_publicados_pkey do update set contenido=excluded.contenido,publicado_en=excluded.publicado_en,publicado_por=excluded.publicado_por,revision=excluded.revision;
 insert into public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) values(negocio,producto,previo,nuevo,auth.uid());
 return jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);
end$function$;
