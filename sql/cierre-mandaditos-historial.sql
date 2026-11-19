-- Conserva el punto de entrada para las versiones anteriores y los trabajos programados.
-- El historial se determina por la fecha de recepción, sin cambiar el resultado del pedido.
create or replace function public.piloto_cierre_diario()
returns integer language sql security definer set search_path = '' as $$
  select 0;
$$;

create function public.piloto_cierre_mandaditos_crear(fecha date, token_anterior text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  jornada_actual date := (now() at time zone 'America/Mexico_City' - interval '1 hour')::date;
  jornada_elegida date := coalesce(fecha, jornada_actual);
  inicio timestamptz := (jornada_elegida + time '01:00') at time zone 'America/Mexico_City';
  fin timestamptz := (jornada_elegida + 1 + time '01:00') at time zone 'America/Mexico_City';
  token text;
  lote cierre_mandaditos_privado.lotes;
  pendientes uuid[];
begin
  if auth.uid() is null or not coalesce(public.piloto_es_operador(), false) then
    raise exception 'Solo recepción autorizada.' using errcode = '42501';
  end if;
  if not isfinite(jornada_elegida) or jornada_elegida > jornada_actual then
    raise exception 'Elige una jornada válida.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('piloto_cierre_diario', 0));
  delete from cierre_mandaditos_privado.lotes where vence_en <= now();

  select array(select p.id from public.piloto_pedidos p
    where p.creado_en >= inicio and p.creado_en < fin
      and p.estado not in ('entregado', 'cancelado') and p.cierre_mandaditos is null
    order by p.id for update of p) into pendientes;
  if cardinality(pendientes) = 0 then
    return jsonb_build_object('cantidad', 0);
  end if;

  if token_anterior is not null and token_anterior ~ '^[0-9a-f]{64}$' then
    select l.* into lote from cierre_mandaditos_privado.lotes l
    where l.huella = sha256(convert_to(token_anterior, 'UTF8'))
      and l.jornada = jornada_elegida and l.vence_en > now() and l.creado_por = auth.uid()
      and not exists (
        select 1 from unnest(pendientes) as p(id)
        where not exists (
          select 1 from cierre_mandaditos_privado.pedidos m
          where m.lote_id = l.id and m.pedido_id = p.id
        )
      );
  end if;
  token := token_anterior;
  if lote.id is null then
    token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    insert into cierre_mandaditos_privado.lotes (huella, jornada, vence_en, creado_por)
    values (sha256(convert_to(token, 'UTF8')), jornada_elegida, now() + interval '48 hours', auth.uid())
    returning * into lote;
    insert into cierre_mandaditos_privado.pedidos (lote_id, pedido_id)
    select lote.id, p.id from unnest(pendientes) as p(id);
  end if;

  return jsonb_build_object('token', token, 'cantidad', cardinality(pendientes), 'vence_en', lote.vence_en);
end;
$$;

create or replace function public.piloto_cierre_mandaditos_crear()
returns jsonb language sql security invoker set search_path = '' as $$
  select public.piloto_cierre_mandaditos_crear(null, null);
$$;

revoke all on function public.piloto_cierre_mandaditos_crear(date, text) from public, anon, authenticated;
grant execute on function public.piloto_cierre_mandaditos_crear(date, text) to authenticated;
