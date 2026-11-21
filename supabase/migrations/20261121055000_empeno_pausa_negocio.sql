
alter table public.empeno_perfiles add column activo boolean not null default true;
grant update (activo) on public.empeno_perfiles to authenticated;

create function empeno_privado.reservar_estado_a_administracion()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.piloto_es_admin() then
    raise exception 'Solo administración puede pausar o reactivar el negocio.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function empeno_privado.reservar_estado_a_administracion() from public, anon, authenticated;
create trigger empeno_estado_administracion
before update of activo on public.empeno_perfiles
for each row execute function empeno_privado.reservar_estado_a_administracion();

alter policy empeno_perfil_publico on public.empeno_perfiles using (activo);
create policy empeno_perfil_dueno on public.empeno_perfiles for select to authenticated
  using (empeno_privado.permitido(slug));
alter policy empeno_categoria_publica on public.empeno_categorias
  using (visible and exists (
    select 1 from public.empeno_perfiles p where p.slug = empeno_categorias.negocio and p.activo
  ));
alter policy empeno_articulo_publico on public.empeno_articulos
  using (not pausado and estado <> 'Vendido'
    and exists (
      select 1 from public.empeno_perfiles p where p.slug = empeno_articulos.negocio and p.activo
    )
    and exists (
      select 1 from public.empeno_categorias c
      where c.negocio = empeno_articulos.negocio and c.id = empeno_articulos.categoria and c.visible
    ));
