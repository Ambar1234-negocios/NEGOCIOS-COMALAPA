BEGIN;
DO $$
DECLARE actor uuid; dueño uuid; r jsonb; v integer; pid text:=gen_random_uuid()::text;
 n text:='QA transaccional '||gen_random_uuid(); datos jsonb; previo jsonb; actual jsonb; otros text;
BEGIN
 SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) INTO otros FROM public.piloto_menus_completos WHERE slug<>'shopping-morales';
 SELECT usuario_id INTO actor FROM public.piloto_administradores LIMIT 1;
 SELECT u.id INTO dueño FROM public.dueno_accesos_v53 a JOIN auth.users u ON lower(u.email)=a.correo WHERE a.negocio='shopping-morales' AND a.activo AND u.email_confirmed_at IS NOT NULL LIMIT 1;
 IF actor IS NULL OR dueño IS NULL THEN RAISE EXCEPTION 'Falta administrador o dueña vinculada'; END IF;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 SELECT revision INTO v FROM public.piloto_menus_completos WHERE slug='shopping-morales';
 r:=public.catalogo_seccion_administrar('shopping-morales',v,'crear',n);v:=(r->>'revision')::int;
 r:=public.catalogo_seccion_administrar('shopping-morales',v,'renombrar',n,n||' nueva');v:=(r->>'revision')::int;n:=n||' nueva';
 r:=public.catalogo_seccion_administrar('shopping-morales',v,'ordenar',n,null,0);v:=(r->>'revision')::int;
 r:=public.catalogo_seccion_administrar('shopping-morales',v,'ocultar',n);v:=(r->>'revision')::int;
 r:=public.catalogo_seccion_administrar('shopping-morales',v,'mostrar',n);v:=(r->>'revision')::int;
 datos:=jsonb_build_object('nombre','Prenda solo prueba','precio',null,'seccion',n,'ingredientes','','disponible',true,'fichaAvanzada',jsonb_build_object('activa',true,'fotos','[]'::jsonb,'secciones','[]'::jsonb));
 r:=public.catalogo_visual_modelo_guardar('shopping-morales',v,pid,datos);v:=(r->>'revision')::int;
 SELECT p INTO previo FROM public.piloto_menus_completos m,jsonb_array_elements(m.original->'productos') p WHERE m.slug='shopping-morales' AND p->>'id'=pid;
 -- Owner can pause and reactivate without changing any other fields.
 PERFORM set_config('request.jwt.claim.sub',dueño::text,true);
 r:=public.catalogo_producto_visibilidad('shopping-morales',v,pid,false);v:=(r->>'revision')::int;
 SELECT p INTO actual FROM public.piloto_menus_completos m,jsonb_array_elements(m.original->'productos') p WHERE m.slug='shopping-morales' AND p->>'id'=pid;
 IF actual-'disponible' IS DISTINCT FROM previo-'disponible' OR actual->>'disponible'<>'false' THEN RAISE EXCEPTION 'Pausa perdió datos'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.sitio_publicacion()->'perfiles') p WHERE p->>'slug'='shopping-morales' AND p->'seccionesCatalogo' ? n) THEN RAISE EXCEPTION 'Desapareció sección pública al pausar'; END IF;
 r:=public.catalogo_producto_visibilidad('shopping-morales',v,pid,true);v:=(r->>'revision')::int;
 r:=public.menu_producto_retirar('shopping-morales',v,pid,false);
 SELECT revision INTO v FROM public.piloto_menus_completos WHERE slug='shopping-morales';
 IF NOT EXISTS(SELECT 1 FROM public.piloto_menus_completos WHERE slug='shopping-morales' AND original->'seccionesCatalogo' ? n) THEN RAISE EXCEPTION 'Desapareció sección al eliminar última prenda'; END IF;
 r:=public.catalogo_seccion_administrar('shopping-morales',v,'eliminar',n);v:=(r->>'revision')::int;
 IF EXISTS(SELECT 1 FROM public.piloto_menus_completos WHERE slug='shopping-morales' AND original->'seccionesCatalogo' ? n) THEN RAISE EXCEPTION 'No eliminó categoría explícitamente'; END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN PERFORM public.catalogo_producto_visibilidad('shopping-morales',v,pid,true);RAISE EXCEPTION 'Aceptó ajeno'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.catalogo_seccion_administrar('shopping-morales',v,'crear','Ajeno');RAISE EXCEPTION 'Aceptó ajeno'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF has_function_privilege('anon','public.catalogo_producto_visibilidad(text,integer,text,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Acceso anónimo'; END IF;
 IF otros IS DISTINCT FROM (SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) FROM public.piloto_menus_completos WHERE slug<>'shopping-morales') THEN RAISE EXCEPTION 'Cambió otro negocio'; END IF;
END $$;
ROLLBACK;
