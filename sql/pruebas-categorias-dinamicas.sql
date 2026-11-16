BEGIN;
DO $$
DECLARE actor uuid; v integer; r jsonb; p text; antes jsonb; otros text; n text:='QA Accesorios '||gen_random_uuid();
BEGIN
 SELECT u.id INTO actor FROM auth.users u JOIN public.dueno_accesos_v53 a ON a.correo=lower(u.email) WHERE a.negocio='el-titan-de-las-pinturas' AND a.activo LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'Falta dueño vinculado'; END IF;
 SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) INTO otros FROM public.piloto_menus_completos WHERE slug<>'el-titan-de-las-pinturas';
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 SELECT revision,original->'productos',original->'productos'->0->>'id' INTO v,antes,p FROM public.piloto_menus_completos WHERE slug='el-titan-de-las-pinturas';
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'crear',n);
 v:=(r->>'revision')::int;
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'ordenar',n,NULL,0);v:=(r->>'revision')::int;
 IF NOT EXISTS(SELECT 1 FROM public.piloto_menus_completos WHERE slug='el-titan-de-las-pinturas' AND original->'seccionesCatalogo'->>0=n) THEN RAISE EXCEPTION 'No ordenó'; END IF;
 r:=public.menu_producto_publicar('el-titan-de-las-pinturas',v,p,jsonb_build_object('seccion',n));
 SELECT revision INTO v FROM public.piloto_menus_completos WHERE slug='el-titan-de-las-pinturas';
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'renombrar',n,n||' renombrada');v:=(r->>'revision')::int;n:=n||' renombrada';
 IF NOT EXISTS(SELECT 1 FROM public.menu_productos_publicados WHERE negocio='el-titan-de-las-pinturas' AND producto=p AND contenido->>'seccion'=n) THEN RAISE EXCEPTION 'No actualizó publicación'; END IF;
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'ocultar',n);v:=(r->>'revision')::int;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.sitio_publicacion()->'perfiles') x WHERE x->>'slug'='el-titan-de-las-pinturas' AND x->'seccionesOcultas' ? n) THEN RAISE EXCEPTION 'No publicó visibilidad'; END IF;
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'mostrar',n);v:=(r->>'revision')::int;
 BEGIN
  PERFORM public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'eliminar',n);
  RAISE EXCEPTION 'Eliminó categoría ocupada';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Eliminó categoría ocupada' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v-1,'ocultar',n);
  RAISE EXCEPTION 'Aceptó revisión antigua';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Aceptó revisión antigua' THEN RAISE; END IF; END;
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'crear',n||' vacía');v:=(r->>'revision')::int;
 r:=public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'eliminar',n||' vacía');v:=(r->>'revision')::int;
 IF has_function_privilege('anon','public.catalogo_seccion_administrar(text,integer,text,text,text,integer)','EXECUTE') THEN RAISE EXCEPTION 'Anon tiene acceso'; END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN
  PERFORM public.catalogo_seccion_administrar('el-titan-de-las-pinturas',v,'crear','Sin permiso');
  RAISE EXCEPTION 'Aceptó usuario ajeno';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.menu_producto_publicar('el-titan-de-las-pinturas',v,p,jsonb_build_object('seccion','Sin permiso'));
  RAISE EXCEPTION 'Aceptó producto ajeno';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT md5(string_agg(original::text||borrador::text,slug ORDER BY slug)) FROM public.piloto_menus_completos WHERE slug<>'el-titan-de-las-pinturas') IS DISTINCT FROM otros THEN RAISE EXCEPTION 'Cambió otro negocio'; END IF;
END $$;
ROLLBACK;
SELECT 'OK: crear, asignar producto, renombrar, ordenar, ocultar/mostrar, publicación, eliminación segura, revisión y permisos; todo revertido' AS resultado;
