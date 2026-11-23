create table public.registro_publico_clientes (
  id uuid primary key,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 100),
  telefono text not null check (telefono ~ '^[0-9]{10,15}$'),
  dia smallint not null,
  mes smallint not null check (mes between 1 and 12),
  consentimiento boolean not null check (consentimiento),
  origen text not null default 'Registro web' check (origen = 'Registro web'),
  fecha timestamptz not null default now(),
  activo boolean not null default true,
  check (dia between 1 and (array[31,29,31,30,31,30,31,31,30,31,30,31])[mes])
);

create table public.registro_publico_solicitudes (
  cliente_id uuid primary key references public.registro_publico_clientes(id),
  busqueda text not null check (char_length(btrim(busqueda)) between 1 and 160),
  categoria text not null default '' check (char_length(categoria) <= 80),
  comentario text not null default '' check (char_length(comentario) <= 500),
  fecha timestamptz not null default now(),
  estado text not null default 'Nueva' check (
    estado in ('Nueva', 'Buscando', 'Cotizando', 'Opción encontrada', 'Cliente informado', 'Finalizada')
  )
);

create index registro_publico_clientes_fecha on public.registro_publico_clientes (fecha desc, id);
create index registro_publico_solicitudes_fecha on public.registro_publico_solicitudes (fecha desc, cliente_id);

alter table public.registro_publico_clientes enable row level security;
alter table public.registro_publico_solicitudes enable row level security;
revoke all on public.registro_publico_clientes, public.registro_publico_solicitudes from public, anon, authenticated;
grant insert (id, nombre, telefono, dia, mes, consentimiento) on public.registro_publico_clientes to anon;
grant insert (cliente_id, busqueda, categoria, comentario) on public.registro_publico_solicitudes to anon;
grant select on public.registro_publico_clientes, public.registro_publico_solicitudes to authenticated;
grant update (activo) on public.registro_publico_clientes to authenticated;
grant update (estado) on public.registro_publico_solicitudes to authenticated;

create policy registrar_cliente on public.registro_publico_clientes
  for insert to anon with check (consentimiento and activo and origen = 'Registro web');
create policy registrar_solicitud on public.registro_publico_solicitudes
  for insert to anon with check (estado = 'Nueva');
create policy leer_clientes_maestro on public.registro_publico_clientes
  for select to authenticated using ((select public.piloto_es_admin()) is true);
create policy leer_solicitudes_maestro on public.registro_publico_solicitudes
  for select to authenticated using ((select public.piloto_es_admin()) is true);
create policy cambiar_actividad_maestro on public.registro_publico_clientes
  for update to authenticated using ((select public.piloto_es_admin()) is true)
  with check ((select public.piloto_es_admin()) is true);
create policy cambiar_solicitud_maestro on public.registro_publico_solicitudes
  for update to authenticated using ((select public.piloto_es_admin()) is true)
  with check ((select public.piloto_es_admin()) is true);
