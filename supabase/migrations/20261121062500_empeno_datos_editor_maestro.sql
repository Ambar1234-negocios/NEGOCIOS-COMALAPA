
alter table public.empeno_perfiles
  add column categoria text not null default 'comercios' check (categoria ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  add column verificado boolean not null default false;
grant update (categoria, verificado) on public.empeno_perfiles to authenticated;
drop trigger empeno_estado_administracion on public.empeno_perfiles;
create trigger empeno_estado_administracion
before update of activo, verificado on public.empeno_perfiles
for each row execute function empeno_privado.reservar_estado_a_administracion();
create or replace function empeno_privado.reservar_estado_a_administracion()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.piloto_es_admin() then
    raise exception 'Solo administración puede cambiar la visibilidad o la verificación del negocio.' using errcode = '42501';
  end if;
  return new;
end;
$$;
