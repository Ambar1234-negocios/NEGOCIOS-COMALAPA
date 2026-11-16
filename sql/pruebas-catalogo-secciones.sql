BEGIN;
DO $$
DECLARE actor uuid; v integer; r jsonb; titulo text:='QA sección '||gen_random_uuid()::text; antes jsonb; despues jsonb; otros text;
BEGIN
 IF has_function_privilege('anon','public.catalogo_visual_seccion_crear(text,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'Anon puede crear secciones';END IF;
 SELECT usuario_id INTO actor FROM public.piloto_administradores LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'Falta cuenta de prueba autorizada';END IF;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 SELECT revision,original->'productos' INTO v,antes FROM public.piloto_menus_completos WHERE slug='shopping-morales';
 SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) INTO otros FROM public.piloto_menus_completos WHERE slug<>'shopping-morales';
 r:=public.catalogo_visual_seccion_crear('shopping-morales',v,'  '||titulo||'  ');
 IF r->>'creada' IS DISTINCT FROM 'true' OR r->>'seccion' IS DISTINCT FROM titulo THEN RAISE EXCEPTION 'No creó la sección';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.piloto_menus_completos WHERE slug='shopping-morales' AND original->'seccionesCatalogo' @> jsonb_build_array(titulo) AND borrador->'seccionesCatalogo' @> jsonb_build_array(titulo)) THEN RAISE EXCEPTION 'No persistió';END IF;
 SELECT original->'productos' INTO despues FROM public.piloto_menus_completos WHERE slug='shopping-morales';IF despues IS DISTINCT FROM antes THEN RAISE EXCEPTION 'Cambió prendas';END IF;
 v:=(r->>'revision')::integer;
 r:=public.catalogo_visual_seccion_crear('shopping-morales',v,upper(titulo));IF r->>'creada' IS DISTINCT FROM 'false' OR (r->>'revision')::integer<>v THEN RAISE EXCEPTION 'Duplicó sección';END IF;
 r:=public.catalogo_visual_seccion_crear('shopping-morales',v,'vestidos');IF r->>'seccion'<>'Vestidos' OR r->>'creada'<>'false' THEN RAISE EXCEPTION 'Duplicó sección base';END IF;
 BEGIN PERFORM public.catalogo_visual_seccion_crear('shopping-morales',v-1,'Otra sección QA');RAISE EXCEPTION 'Aceptó revisión antigua';EXCEPTION WHEN raise_exception THEN IF SQLERRM='Aceptó revisión antigua' THEN RAISE;END IF;END;
 BEGIN PERFORM public.catalogo_visual_seccion_crear('shopping-morales',v,'  ');RAISE EXCEPTION 'Aceptó nombre vacío';EXCEPTION WHEN raise_exception THEN IF SQLERRM='Aceptó nombre vacío' THEN RAISE;END IF;END;
 IF (SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) FROM public.piloto_menus_completos WHERE slug<>'shopping-morales') IS DISTINCT FROM otros THEN RAISE EXCEPTION 'Cambió otros negocios';END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN PERFORM public.catalogo_visual_seccion_crear('shopping-morales',v,'Sin permiso QA');RAISE EXCEPTION 'Aceptó usuario sin acceso';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
ROLLBACK;
SELECT 'ok: creación, persistencia vacía, duplicados, revisión, permisos y prendas intactas; pruebas revertidas' AS resultado;
