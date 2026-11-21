
create table public.empeno_perfiles (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre text not null check (length(btrim(nombre)) between 1 and 120),
  rubro text not null check (length(btrim(rubro)) between 1 and 100),
  descripcion text not null default '',
  telefono text not null check (telefono ~ '^[0-9]{10}$'),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  direccion text not null default '',
  horarios text[] not null check (cardinality(horarios) = 7),
  facebook text not null default '',
  tiktok text not null default '',
  instagram text not null default '',
  cotizar_texto text not null check (length(btrim(cotizar_texto)) between 1 and 100),
  cotizar_mensaje text not null check (length(btrim(cotizar_mensaje)) between 1 and 500),
  catalogo_texto text not null check (length(btrim(catalogo_texto)) between 1 and 100)
);
create table public.empeno_categorias (
  negocio text not null references public.empeno_perfiles (slug),
  id uuid not null default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) between 1 and 80),
  orden integer not null default 0 check (orden >= 0),
  visible boolean not null default true,
  primary key (negocio, id)
);
create unique index empeno_categorias_nombre on public.empeno_categorias (negocio, lower(btrim(nombre)));
create table public.empeno_articulos (
  negocio text not null,
  categoria uuid not null,
  id uuid not null default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) between 1 and 120),
  descripcion text not null default '' check (length(descripcion) <= 2000),
  precio_centavos integer check (precio_centavos between 0 and 100000000),
  estado text not null default 'Disponible' check (estado in ('Disponible','Apartado','Vendido')),
  pausado boolean not null default false,
  consultar boolean not null default true,
  fotos text[] not null default '{}' check (cardinality(fotos) <= 10 and array_to_string(fotos, ',') ~ '^([a-f0-9-]{36}[.]webp(,[a-f0-9-]{36}[.]webp)*)?$'),
  primary key (negocio, id),
  foreign key (negocio, categoria) references public.empeno_categorias (negocio, id)
);
create index empeno_articulos_categoria on public.empeno_articulos (negocio, categoria);
alter table public.empeno_perfiles enable row level security;
alter table public.empeno_categorias enable row level security;
alter table public.empeno_articulos enable row level security;
revoke all on public.empeno_perfiles, public.empeno_categorias, public.empeno_articulos from public, anon, authenticated;
grant select on public.empeno_perfiles, public.empeno_categorias, public.empeno_articulos to anon, authenticated;
grant update (nombre, rubro, descripcion, telefono, whatsapp, direccion, horarios, facebook, tiktok, instagram, cotizar_texto, cotizar_mensaje, catalogo_texto) on public.empeno_perfiles to authenticated;
grant insert, delete on public.empeno_categorias to authenticated;
grant update (nombre, orden, visible) on public.empeno_categorias to authenticated;
grant insert on public.empeno_articulos to authenticated;
grant update (categoria, nombre, descripcion, precio_centavos, estado, pausado, consultar, fotos) on public.empeno_articulos to authenticated;

create policy empeno_perfil_publico on public.empeno_perfiles for select to anon, authenticated using (true);
create policy empeno_perfil_editar on public.empeno_perfiles for update to authenticated
  using (public.dueno_permitido_v53(slug)) with check (public.dueno_permitido_v53(slug));
create policy empeno_categoria_publica on public.empeno_categorias for select to anon, authenticated using (visible);
create policy empeno_categoria_dueno on public.empeno_categorias for all to authenticated
  using (public.dueno_permitido_v53(negocio)) with check (public.dueno_permitido_v53(negocio));
create policy empeno_articulo_publico on public.empeno_articulos for select to anon, authenticated
  using (not pausado and estado <> 'Vendido' and exists (
    select 1 from public.empeno_categorias c
    where c.negocio = empeno_articulos.negocio and c.id = empeno_articulos.categoria and c.visible
  ));
create policy empeno_articulo_dueno on public.empeno_articulos for all to authenticated
  using (public.dueno_permitido_v53(negocio)) with check (public.dueno_permitido_v53(negocio));

create function public.empeno_mis_perfiles() returns setof public.empeno_perfiles
  language sql stable security invoker set search_path = ''
  as $$ select * from public.empeno_perfiles where public.dueno_permitido_v53(slug) order by nombre $$;
revoke all on function public.empeno_mis_perfiles() from public, anon;
grant execute on function public.empeno_mis_perfiles() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('empeno-fotos', 'empeno-fotos', true, 1048576, array['image/webp']);
create policy empeno_foto_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'empeno-fotos'
    and name ~ '^[a-z0-9-]+/[a-f0-9-]{36}[.]webp$'
    and public.dueno_permitido_v53(split_part(name, '/', 1))
    and exists (select 1 from public.empeno_perfiles p where p.slug = split_part(name, '/', 1)));

insert into public.empeno_perfiles
(slug, nombre, rubro, descripcion, telefono, whatsapp, direccion, horarios, facebook, tiktok, instagram, cotizar_texto, cotizar_mensaje, catalogo_texto)
values (
  'fundacion-donde-comalapa', 'Fundación Dondé. Sucursal Comalapa', 'Casa de empeño y tienda',
  'Tienda y casa de empeño con promociones y descuentos en joyería, herramientas, electrodomésticos y más.',
  '9631200079', '9631200079', 'Av. Central Sur No. 2, Col. Centro, 30140 Frontera Comalapa, Chis.',
  array['09:00–18:00','09:00–18:00','09:00–18:00','09:00–18:00','09:00–18:00','09:00–14:00','Cerrado'],
  'Donde Frontera Comalapa', 'Fundacion donde Comalapa', 'FRD COMALAPA',
  'Cotizar un empeño', 'Hola, quisiera información para cotizar un empeño.', 'Ver artículos disponibles'
);
insert into public.empeno_categorias (negocio, nombre, orden)
select 'fundacion-donde-comalapa', nombre, orden
from unnest(array['Joyería de oro','Joyería de plata','Relojes','Herramientas','Electrónicos','Electrodomésticos','Celulares','Otros artículos'])
with ordinality as c(nombre, orden);
