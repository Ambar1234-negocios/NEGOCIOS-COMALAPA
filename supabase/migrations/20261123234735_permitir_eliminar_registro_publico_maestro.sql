alter table public.registro_publico_solicitudes
  drop constraint registro_publico_solicitudes_cliente_id_fkey,
  add constraint registro_publico_solicitudes_cliente_id_fkey
    foreign key (cliente_id) references public.registro_publico_clientes(id) on delete cascade;

alter table public.registro_publico_clientes
  drop constraint registro_publico_clientes_duplicado_de_fkey,
  add constraint registro_publico_clientes_duplicado_de_fkey
    foreign key (duplicado_de) references public.registro_publico_clientes(id) on delete cascade;

create index registro_publico_clientes_duplicado_de
  on public.registro_publico_clientes (duplicado_de) where duplicado_de is not null;

grant delete on public.registro_publico_clientes to authenticated;
create policy eliminar_registro_maestro on public.registro_publico_clientes
  for delete to authenticated
  using ((select public.piloto_es_admin()) is true);
