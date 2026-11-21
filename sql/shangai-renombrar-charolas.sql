-- Renombra la sección de productos de Shangai y distingue las charolas de las alitas.
do $$
declare
  negocio_slug constant text := 'restaurante-shangai';
  menu public.piloto_menus_completos%rowtype;
  original_actualizado jsonb;
  borrador_actualizado jsonb;
begin
  select * into strict menu
  from public.piloto_menus_completos
  where slug = negocio_slug
  for update;

  with documentos(tipo, datos) as (
    values ('original', menu.original), ('borrador', menu.borrador)
  ), actualizados as (
    select tipo, jsonb_set(datos, '{productos}', (
      select jsonb_agg(
        case when p->>'seccion' = 'Paquetes para compartir' then
          p || jsonb_build_object('seccion', 'Charolas', 'nombre',
            case when p->>'nombre' in ('Mexicana', 'Mariscos', 'Mixta Shangai', 'Mixta')
              then 'Charola ' || (p->>'nombre')
              else p->>'nombre'
            end)
        else p end
        order by orden
      )
      from jsonb_array_elements(datos->'productos') with ordinality as productos(p, orden)
    )) as datos
    from documentos
  )
  select (select datos from actualizados where tipo = 'original'),
         (select datos from actualizados where tipo = 'borrador')
  into original_actualizado, borrador_actualizado;

  if original_actualizado = menu.original and borrador_actualizado = menu.borrador then
    return;
  end if;

  update public.piloto_menus_completos
  set original = original_actualizado, borrador = borrador_actualizado,
      revision = revision + 1, actualizado_en = now()
  where slug = negocio_slug
  returning * into menu;

  with anteriores as materialized (
    select publicado.producto, publicado.contenido as anterior,
           publicado.contenido || jsonb_build_object(
             'seccion', p->>'seccion', 'nombre', p->>'nombre'
           ) as nuevo
    from public.menu_productos_publicados publicado
    join jsonb_array_elements(menu.original->'productos') p on p->>'id' = publicado.producto
    where publicado.negocio = negocio_slug
      and publicado.contenido->>'seccion' = 'Paquetes para compartir'
      and p->>'seccion' = 'Charolas'
  ), publicados as (
    update public.menu_productos_publicados publicado
    set contenido = a.nuevo, revision = menu.revision, publicado_en = now(),
        publicado_por = '00000000-0000-0000-0000-000000000000'
    from anteriores a
    where publicado.negocio = negocio_slug and publicado.producto = a.producto
    returning publicado.producto, a.anterior, a.nuevo
  )
  insert into public.menu_publicacion_historial (negocio, producto, anterior, nuevo, actor)
  select negocio_slug, producto, anterior, nuevo, '00000000-0000-0000-0000-000000000000'
  from publicados;
end
$$;
