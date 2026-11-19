create or replace function public.piloto_cierre_mandaditos_responder(
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
        if (p.pago = 'transferencia' and not p.pago_verificado)
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
