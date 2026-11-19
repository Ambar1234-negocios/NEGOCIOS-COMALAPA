create schema cierre_mandaditos_privado;
revoke all on schema cierre_mandaditos_privado from public, anon, authenticated;

alter table public.piloto_pedidos
  add column cierre_mandaditos text check (cierre_mandaditos in (
    'entregado', 'cliente_cancelo', 'negocio_cerrado', 'no_realizado', 'incidencia'
  ));

create table cierre_mandaditos_privado.lotes (
  id uuid primary key default gen_random_uuid(),
  huella bytea not null unique,
  jornada date not null,
  vence_en timestamptz not null,
  creado_por uuid not null
);
create table cierre_mandaditos_privado.pedidos (
  lote_id uuid references cierre_mandaditos_privado.lotes on delete cascade,
  pedido_id uuid references public.piloto_pedidos on delete cascade,
  primary key (lote_id, pedido_id)
);
create index cierre_mandaditos_por_pedido on cierre_mandaditos_privado.pedidos (pedido_id);
alter table cierre_mandaditos_privado.lotes enable row level security;
alter table cierre_mandaditos_privado.pedidos enable row level security;
revoke all on all tables in schema cierre_mandaditos_privado from public, anon, authenticated;

create function public.piloto_cierre_mandaditos_crear() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  jornada_actual date := (now() at time zone 'America/Mexico_City' - interval '1 hour')::date;
  inicio timestamptz := (jornada_actual + time '01:00') at time zone 'America/Mexico_City';
  fin timestamptz := (jornada_actual + 1 + time '01:00') at time zone 'America/Mexico_City';
  token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  lote uuid;
  cantidad integer;
begin
  if auth.uid() is null or not coalesce(public.piloto_es_operador(), false) then
    raise exception 'Solo recepción autorizada.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('piloto_cierre_diario', 0));
  delete from cierre_mandaditos_privado.lotes where vence_en <= now();

  insert into cierre_mandaditos_privado.lotes (huella, jornada, vence_en, creado_por)
  values (sha256(convert_to(token, 'UTF8')), jornada_actual, now() + interval '24 hours', auth.uid())
  returning id into lote;

  insert into cierre_mandaditos_privado.pedidos (lote_id, pedido_id)
  select lote, p.id from public.piloto_pedidos p
  where p.creado_en >= inicio and p.creado_en < fin
    and p.estado not in ('entregado', 'cancelado') and p.cierre_mandaditos is null
  order by p.id for update of p;
  get diagnostics cantidad = row_count;
  if cantidad = 0 then
    delete from cierre_mandaditos_privado.lotes where id = lote;
    return jsonb_build_object('cantidad', 0);
  end if;
  return jsonb_build_object('token', token, 'cantidad', cantidad);
end;
$$;

create function public.piloto_cierre_mandaditos_responder(
  token text, folio_pedido text default null, decision text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  lote cierre_mandaditos_privado.lotes;
  p public.piloto_pedidos;
  estado_anterior text;
begin
  if token is not null and token ~ '^[0-9a-f]{64}$' then
    select l.* into lote from cierre_mandaditos_privado.lotes l
    where l.huella = sha256(convert_to(token, 'UTF8')) and l.vence_en > now()
    for share;
  end if;
  if lote.id is null then return jsonb_build_object('enlace_valido', false); end if;

  if decision is not null then
    if decision not in ('entregado', 'cliente_cancelo', 'negocio_cerrado', 'no_realizado', 'incidencia') then
      raise exception 'Opción inválida.';
    end if;
    select o.* into p from cierre_mandaditos_privado.pedidos m
    join public.piloto_pedidos o on o.id = m.pedido_id
    where m.lote_id = lote.id and o.folio = folio_pedido for update of o;
    if not found then raise exception 'Pedido fuera de este enlace.'; end if;

    if p.estado not in ('entregado', 'cancelado') and p.cierre_mandaditos is null then
      estado_anterior := p.estado;
      if decision = 'entregado' then
        if not p.aceptado or (p.requiere_whatsapp and not p.whatsapp_confirmado)
          or (p.pago = 'transferencia' and not p.pago_verificado)
          or (p.entrega = 'recoger' and p.estado <> 'listo_recoger')
          or (p.descuento_servicio_centavos > 0 and p.promocion_id is null and exists (
            select 1 from public.exhibicion_fondo_apoyos a
            where a.pedido_id = p.id and a.estado <> 'consumida'
          ))
        then
          raise exception 'Recepción debe verificar este pedido antes de cerrarlo. Puedes reportar un problema.';
        end if;
        p.estado := 'entregado';
        p.entregado_en := now();
        p.efectivo_recibido := p.pago = 'efectivo';
      elsif decision <> 'incidencia' then
        p.estado := 'cancelado';
      end if;

      update public.piloto_pedidos o
      set estado = p.estado, entregado_en = p.entregado_en,
          efectivo_recibido = p.efectivo_recibido, revision = o.revision + 1,
          cierre_mandaditos = decision
      where o.id = p.id returning o.* into p;

      if decision = 'entregado' then
        perform public.piloto_promocion_consumir_interna(p.id);
      elsif decision <> 'incidencia' then
        perform public.piloto_promocion_liberar_interna(p.id);
      end if;
      update public.piloto_reparto_enlaces set activo = false where pedido_id = p.id;
      update public.piloto_confirmaciones_cliente set vence = now() where pedido_id = p.id;
      insert into public.piloto_pedido_eventos(pedido_id, actor, accion, estado, revision, datos)
      values (p.id, null, 'cierre_mandaditos', p.estado, p.revision,
        jsonb_build_object('resultado', decision, 'estado_anterior', estado_anterior, 'lote_id', lote.id));
    end if;
  end if;

  return jsonb_build_object('enlace_valido', true, 'jornada', lote.jornada, 'pedidos', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'folio', o.folio,
      'cliente', o.cliente,
      'telefono', case when char_length(o.telefono) >= 4
        then '•••• ' || right(regexp_replace(o.telefono, '[^0-9]', '', 'g'), 2) end,
      'negocio', (
        select string_agg(distinct (l->>'negocio_nombre'), ', ' order by (l->>'negocio_nombre'))
        from jsonb_array_elements(o.lineas) l where nullif(l->>'negocio_nombre', '') is not null
      ),
      'pago', o.pago,
      'resultado', case
        when o.estado = 'entregado' then 'entregado'
        when o.estado = 'cancelado' then
          case when o.cierre_mandaditos in ('cliente_cancelo','negocio_cerrado','no_realizado')
            then o.cierre_mandaditos else 'cancelado' end
        else o.cierre_mandaditos end
    ) order by (o.pago <> 'efectivo'), o.creado_en, o.id), '[]'::jsonb)
    from cierre_mandaditos_privado.pedidos m join public.piloto_pedidos o on o.id = m.pedido_id
    where m.lote_id = lote.id
  ));
end;
$$;

revoke all on function public.piloto_cierre_mandaditos_crear() from public, anon, authenticated;
grant execute on function public.piloto_cierre_mandaditos_crear() to authenticated;
revoke all on function public.piloto_cierre_mandaditos_responder(text, text, text) from public, anon, authenticated;
grant execute on function public.piloto_cierre_mandaditos_responder(text, text, text) to anon, authenticated;

CREATE OR REPLACE FUNCTION public.piloto_cierre_diario()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare p public.piloto_pedidos;n integer:=0;inicio timestamptz:=(((now() at time zone 'America/Mexico_City'-interval '1 hour')::date+time '01:00') at time zone 'America/Mexico_City');begin
 if not pg_try_advisory_xact_lock(hashtextextended('piloto_cierre_diario',0)) then return 0;end if;
 for p in select * from public.piloto_pedidos where creado_en<inicio and estado not in ('entregado','cancelado') and cierre_mandaditos is distinct from 'incidencia'
 and not exists (
   select 1 from cierre_mandaditos_privado.pedidos m
   join cierre_mandaditos_privado.lotes l on l.id=m.lote_id
   where m.pedido_id=piloto_pedidos.id and l.vence_en>now()
 )
 order by id for update skip locked loop
  update public.piloto_pedidos set estado='cancelado',revision=revision+1,terminado_en=now() where id=p.id returning * into p;
  update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;
  insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision,datos) values(p.id,null,'Cancelado automáticamente al cierre del día',p.estado,p.revision,jsonb_build_object('canal','cierre_diario','automatico',true,'motivo','La jornada terminó a la 1:00 a. m.','pago_verificado',p.pago_verificado,'efectivo_recibido',p.efectivo_recibido));
  n:=n+1;
 end loop;return n;
end$function$
;
