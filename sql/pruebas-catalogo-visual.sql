
BEGIN;
DO $$
DECLARE actor uuid; r jsonb; v integer; pid text:=gen_random_uuid()::text; datos jsonb; antes text; despues text;
BEGIN
 SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) INTO antes FROM public.piloto_menus_completos WHERE slug<>'shopping-morales';
 SELECT usuario_id INTO actor FROM public.piloto_administradores LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 SELECT revision INTO v FROM public.piloto_menus_completos WHERE slug='shopping-morales';
 datos:='{"nombre":"MODELO SOLO PRUEBA TRANSACCIONAL","precio":null,"seccion":"Vestidos","ingredientes":"","disponible":true,"fichaAvanzada":{"activa":true,"fotos":[],"secciones":[]}}'::jsonb;
 r:=public.catalogo_visual_modelo_guardar('shopping-morales',v,pid,datos);
 IF NOT EXISTS(SELECT 1 FROM public.menu_productos_publicados WHERE negocio='shopping-morales' AND producto=pid AND contenido->>'precio' IS NULL) THEN RAISE EXCEPTION 'No guardo sin precio';END IF;
 BEGIN PERFORM public.catalogo_visual_modelo_guardar('shopping-morales',v,pid,datos); RAISE EXCEPTION 'Acepto revision obsoleta';EXCEPTION WHEN raise_exception THEN IF SQLERRM='Acepto revision obsoleta' THEN RAISE;END IF;END;
 r:=public.catalogo_visual_modelo_guardar('shopping-morales',(r->>'revision')::integer,pid,jsonb_set(datos,'{disponible}','false'));
 IF EXISTS(SELECT 1 FROM public.menu_productos_publicados WHERE negocio='shopping-morales' AND producto=pid AND contenido->>'disponible'='true') THEN RAISE EXCEPTION 'No oculto';END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN PERFORM public.catalogo_visual_modelo_guardar('shopping-morales',(r->>'revision')::integer,pid,datos); RAISE EXCEPTION 'Acepto usuario sin acceso';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) INTO despues FROM public.piloto_menus_completos WHERE slug<>'shopping-morales';
 IF antes IS DISTINCT FROM despues THEN RAISE EXCEPTION 'Cambio otro negocio';END IF;
END $$;
ROLLBACK;
SELECT slug,revision,jsonb_array_length(original->'productos') productos FROM public.piloto_menus_completos WHERE slug='shopping-morales';

