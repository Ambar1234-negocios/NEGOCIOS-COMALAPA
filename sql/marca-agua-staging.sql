begin;

create table public.piloto_marca_agua_negocios (
  slug text primary key references public.piloto_menus_completos(slug)
    on update cascade on delete cascade,
  usar_negocio boolean not null default false,
  usar_exhibicion boolean not null default false,
  imagen text check (imagen ~ '^[a-z0-9]+(-[a-z0-9]+)*/[0-9a-f-]{36}[.]webp$'),
  posicion text not null default 'derecha' check (posicion in ('derecha', 'izquierda', 'centro')),
  intensidad text not null default 'media' check (intensidad in ('suave', 'media', 'fuerte')),
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  check (not usar_negocio or imagen is not null)
);

create table public.piloto_marca_agua_global (
  id boolean primary key default true check (id),
  imagen text not null check (imagen ~ '^exhibicion/[0-9a-f-]{36}[.]webp$')
);

alter table public.piloto_marca_agua_negocios enable row level security;
alter table public.piloto_marca_agua_global enable row level security;
revoke all on public.piloto_marca_agua_negocios, public.piloto_marca_agua_global from anon, authenticated;
grant select on public.piloto_marca_agua_negocios, public.piloto_marca_agua_global to anon, authenticated;
grant insert, update on public.piloto_marca_agua_negocios, public.piloto_marca_agua_global to authenticated;

create policy marca_agua_leer_negocios on public.piloto_marca_agua_negocios
  for select to anon, authenticated using (usar_negocio or usar_exhibicion);
create policy marca_agua_leer_global on public.piloto_marca_agua_global
  for select to anon, authenticated using (true);
create policy marca_agua_admin_negocios on public.piloto_marca_agua_negocios
  for all to authenticated using ((select public.piloto_es_admin()))
  with check ((select public.piloto_es_admin()));
create policy marca_agua_admin_global on public.piloto_marca_agua_global
  for all to authenticated using ((select public.piloto_es_admin()))
  with check ((select public.piloto_es_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marcas-agua', 'marcas-agua', true, 1048576, array['image/webp']);

create policy marca_agua_subir on storage.objects
  for insert to authenticated with check (
    bucket_id = 'marcas-agua'
    and name ~ '^([a-z0-9]+(-[a-z0-9]+)*|exhibicion)/[0-9a-f-]{36}[.]webp$'
    and (select public.piloto_es_admin())
  );

commit;
