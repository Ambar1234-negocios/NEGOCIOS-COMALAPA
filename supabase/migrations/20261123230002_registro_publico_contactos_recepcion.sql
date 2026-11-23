create schema if not exists registro_publico_privado;
revoke all on schema registro_publico_privado from public, anon, authenticated;

create function registro_publico_privado.contactos_recepcion(p_offset integer)
returns table (nombre text, telefono text)
language sql stable security definer set search_path = ''
as $$
  select cliente.nombre, cliente.telefono
  from public.registro_publico_clientes cliente
  where (select auth.uid()) is not null
    and (select public.piloto_es_operador()) is true
    and cliente.activo
    and cliente.consentimiento
    and cliente.duplicado_de is null
  order by cliente.fecha desc, cliente.id
  limit 100 offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function registro_publico_privado.contactos_recepcion(integer) from public, anon, authenticated;
grant usage on schema registro_publico_privado to authenticated;
grant execute on function registro_publico_privado.contactos_recepcion(integer) to authenticated;

create function public.registro_publico_contactos_recepcion(p_offset integer default 0)
returns table (nombre text, telefono text)
language sql stable security invoker set search_path = ''
as $$
  select * from registro_publico_privado.contactos_recepcion(p_offset);
$$;

revoke all on function public.registro_publico_contactos_recepcion(integer) from public, anon, authenticated;
grant execute on function public.registro_publico_contactos_recepcion(integer) to authenticated;
