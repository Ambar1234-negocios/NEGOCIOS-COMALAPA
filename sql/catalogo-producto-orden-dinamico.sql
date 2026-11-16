create or replace function public.catalogo_producto_ordenar(negocio text, version integer, producto text, posicion integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.piloto_menus_completos; antes jsonb; lista jsonb; draft jsonb; p jsonb; idx int;
begin
 if auth.uid() is null or not coalesce(public.dueno_permitido_v53(negocio),false) then raise exception 'Sin acceso.' using errcode='42501'; end if;
 if posicion is null or posicion not between 0 and 10000 then raise exception 'Orden inválido.'; end if;
 select * into m from public.piloto_menus_completos where slug=negocio for update;
 if not found or m.original->>'categoriasDinamicas' is distinct from 'true' or version is distinct from m.revision then raise exception 'Actualiza el catálogo antes de ordenar.'; end if;
 select value into antes from jsonb_array_elements(m.original->'productos') where value->>'id'=producto and coalesce(value->>'eliminado','false')<>'true';
 if antes is null then raise exception 'Producto inexistente.'; end if;
 select jsonb_agg(case when value->>'id'=producto then value||jsonb_build_object('ordenCatalogo',posicion) else value end order by ordinality) into lista from jsonb_array_elements(m.original->'productos') with ordinality;
 select jsonb_agg(case when value->>'id'=producto then value||jsonb_build_object('ordenCatalogo',posicion) else value end order by ordinality) into draft from jsonb_array_elements(m.borrador->'productos') with ordinality;
 update public.piloto_menus_completos set original=jsonb_set(original,'{productos}',lista),borrador=jsonb_set(borrador,'{productos}',draft),revision=revision+1,actualizado_en=now() where slug=negocio;
 update public.menu_productos_publicados set contenido=contenido||jsonb_build_object('ordenCatalogo',posicion),revision=m.revision+1,publicado_en=now(),publicado_por=auth.uid() where menu_productos_publicados.negocio=catalogo_producto_ordenar.negocio and menu_productos_publicados.producto=catalogo_producto_ordenar.producto;
 insert into public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) values(negocio,producto,antes,antes||jsonb_build_object('ordenCatalogo',posicion),auth.uid());
 return jsonb_build_object('revision',m.revision+1);
end $$;
revoke all on function public.catalogo_producto_ordenar(text,integer,text,integer) from public,anon;
grant execute on function public.catalogo_producto_ordenar(text,integer,text,integer) to authenticated;
