-- Alta puntual de los paquetes en el menú editable y en el catálogo público.
do $$
declare
  negocio_slug constant text := 'restaurante-shangai';
  categoria constant text := 'Paquetes para compartir';
  -- Identifica la carga de datos del sistema en el historial, sin atribuirla a un usuario.
  actor_sistema constant uuid := '00000000-0000-0000-0000-000000000000';
  menu public.piloto_menus_completos%rowtype;
  producto_nuevo jsonb;
  nuevos jsonb := '[]'::jsonb;
begin
  select * into strict menu
  from public.piloto_menus_completos
  where slug = negocio_slug
  for update;

  for producto_nuevo in
    select jsonb_build_object(
      'id', id, 'nombre', nombre, 'precio', precio, 'seccion', categoria,
      'ingredientes', porciones, 'disponible', true, 'foto', '',
      'enCarrusel', false, 'extras', '[]'::jsonb, 'gruposOpciones', '[]'::jsonb
    )
    from (values
      (1, 'f79c2b0a-456b-440b-845a-e545c1f536e1', 'Mexicana', 1200, 'Aprox. 8 personas'),
      (2, 'f79c2b0a-456b-440b-845a-e545c1f536e2', 'Mariscos', 1500, 'Aprox. 8 personas'),
      (3, 'f79c2b0a-456b-440b-845a-e545c1f536e3', 'Mixta Shangai', 1300, 'Aprox. 8 a 10 personas'),
      (4, 'f79c2b0a-456b-440b-845a-e545c1f536e4', 'Mixta', 1000, '8 personas'),
      (5, 'f79c2b0a-456b-440b-845a-e545c1f536e5', 'Alitas 48 pzas', 1000, ''),
      (6, 'f79c2b0a-456b-440b-845a-e545c1f536e6', 'Alitas 24 pzas', 500, '')
    ) as paquetes(orden, id, nombre, precio, porciones)
    order by orden
  loop
    if exists (
      select 1 from public.menu_publicacion_historial
      where negocio = negocio_slug and producto = producto_nuevo->>'id'
    ) then
      continue;
    end if;

    perform public.menu_validar_elecciones(producto_nuevo);
    nuevos := nuevos || jsonb_build_array(producto_nuevo);
  end loop;

  if jsonb_array_length(nuevos) = 0 then
    return;
  end if;

  update public.piloto_menus_completos
  set original = jsonb_set(original, '{productos}', (original->'productos') || nuevos),
      borrador = jsonb_set(borrador, '{productos}', (borrador->'productos') || nuevos),
      revision = revision + 1,
      actualizado_en = now()
  where slug = negocio_slug
  returning * into menu;

  insert into public.menu_productos_publicados
    (negocio, producto, contenido, publicado_en, publicado_por, revision)
  select negocio_slug, p->>'id', p, now(), actor_sistema, menu.revision
  from jsonb_array_elements(nuevos) p;

  insert into public.menu_publicacion_historial (negocio, producto, anterior, nuevo, actor)
  select negocio_slug, p->>'id', '{}'::jsonb, p, actor_sistema
  from jsonb_array_elements(nuevos) p;
end
$$;
