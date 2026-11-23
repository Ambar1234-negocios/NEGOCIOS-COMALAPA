lock table public.registro_publico_clientes in share row exclusive mode;

alter table public.registro_publico_clientes
  add column telefono_normalizado text generated always as (
    case
      when telefono ~ '^52[0-9]{10}$|^521[0-9]{10}$' then right(telefono, 10)
      else telefono
    end
  ) stored,
  add column duplicado_de uuid references public.registro_publico_clientes(id),
  add constraint registro_publico_no_duplicado_de_si_mismo check (duplicado_de <> id);

with ordenados as (
  select id, first_value(id) over (
    partition by telefono_normalizado order by fecha, id
  ) as original
  from public.registro_publico_clientes
)
update public.registro_publico_clientes cliente
set duplicado_de = ordenados.original
from ordenados
where cliente.id = ordenados.id and ordenados.id <> ordenados.original;

update public.registro_publico_clientes original
set activo = false
where original.duplicado_de is null and exists (
  select 1 from public.registro_publico_clientes duplicado
  where duplicado.duplicado_de = original.id and not duplicado.activo
);

create unique index registro_publico_un_whatsapp
  on public.registro_publico_clientes (telefono_normalizado)
  where duplicado_de is null;

drop policy registrar_cliente on public.registro_publico_clientes;
create policy registrar_cliente on public.registro_publico_clientes
  for insert to anon
  with check (consentimiento and activo and origen = 'Registro web' and duplicado_de is null);
