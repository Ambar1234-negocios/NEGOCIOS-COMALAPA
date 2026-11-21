
create schema if not exists empeno_privado;
revoke all on schema empeno_privado from public, anon, authenticated;
grant usage on schema empeno_privado to authenticated;
create table empeno_privado.dueno_accesos (
  correo text not null check (correo = lower(btrim(correo)) and length(correo) between 3 and 254),
  negocio text not null references public.empeno_perfiles (slug),
  activo boolean not null default true,
  primary key (correo, negocio)
);
alter table empeno_privado.dueno_accesos enable row level security;
revoke all on empeno_privado.dueno_accesos from public, anon, authenticated;

create function empeno_privado.permitido(slug text) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select auth.uid() is not null and (
      public.dueno_permitido_v53(slug) or exists (
        select 1 from empeno_privado.dueno_accesos a
        join auth.users u on lower(u.email) = a.correo
        where a.negocio = slug and a.activo and u.id = auth.uid()
          and u.email_confirmed_at is not null
          and (u.banned_until is null or u.banned_until < now())
      )
    )
  $$;
revoke all on function empeno_privado.permitido(text) from public, anon;
grant execute on function empeno_privado.permitido(text) to authenticated;

alter policy empeno_perfil_editar on public.empeno_perfiles
  using (empeno_privado.permitido(slug)) with check (empeno_privado.permitido(slug));
alter policy empeno_categoria_dueno on public.empeno_categorias
  using (empeno_privado.permitido(negocio)) with check (empeno_privado.permitido(negocio));
alter policy empeno_articulo_dueno on public.empeno_articulos
  using (empeno_privado.permitido(negocio)) with check (empeno_privado.permitido(negocio));
alter policy empeno_foto_subir on storage.objects
  with check (bucket_id = 'empeno-fotos'
    and name ~ '^[a-z0-9-]+/[a-f0-9-]{36}[.]webp$'
    and empeno_privado.permitido(split_part(name, '/', 1))
    and exists (select 1 from public.empeno_perfiles p where p.slug = split_part(name, '/', 1)));
create or replace function public.empeno_mis_perfiles() returns setof public.empeno_perfiles
  language sql stable security invoker set search_path = ''
  as $$ select * from public.empeno_perfiles where empeno_privado.permitido(slug) order by nombre $$;
