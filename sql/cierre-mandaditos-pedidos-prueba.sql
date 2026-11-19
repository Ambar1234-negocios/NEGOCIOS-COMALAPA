alter table public.piloto_pedidos add column pedido_prueba_en timestamptz;

create function public.piloto_pedido_marcar_prueba(pedido uuid, version integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.piloto_pedidos;
begin
  if auth.uid() is null or not coalesce(public.piloto_es_admin(), false) then
    raise exception 'Solo administración puede retirar pedidos de prueba.' using errcode = '42501';
  end if;
  select * into p from public.piloto_pedidos where id=pedido for update;
  if not found then raise exception 'Pedido no encontrado.'; end if;
  if p.pedido_prueba_en is not null then return; end if;
  if p.revision is distinct from version then raise exception 'El pedido cambió. Actualiza antes de continuar.'; end if;

  if p.estado not in ('pendiente', 'cotizado', 'cancelado') or p.repartidor_id is not null
    or p.pago_verificado or p.efectivo_recibido or p.transferencia_reportada
    or exists(select 1 from public.exhibicion_fondo_apoyos a where a.pedido_id=p.id and a.estado='consumida')
  then
    raise exception 'Solo puedes retirar pedidos de prueba que no tengan reparto ni pagos registrados.';
  end if;

  update public.piloto_pedidos
  set pedido_prueba_en=now(), estado='cancelado', revision=revision+1
  where id=p.id returning * into p;
  perform public.piloto_promocion_liberar_interna(p.id);
  update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;
  update public.piloto_confirmaciones_cliente set vence=now() where pedido_id=p.id;
  insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision)
  values(p.id,auth.uid(),'marcar_prueba',p.estado,p.revision);
end;
$$;
revoke all on function public.piloto_pedido_marcar_prueba(uuid,integer) from public, anon, authenticated;
grant execute on function public.piloto_pedido_marcar_prueba(uuid,integer) to authenticated;

create or replace function public.piloto_cierre_mandaditos_crear(fecha date, token_anterior text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  jornada_actual date := (now() at time zone 'America/Mexico_City' - interval '1 hour')::date;
  jornada_elegida date := coalesce(fecha, jornada_actual);
  inicio timestamptz := (jornada_elegida + time '01:00') at time zone 'America/Mexico_City';
  fin timestamptz := (jornada_elegida + 1 + time '01:00') at time zone 'America/Mexico_City';
  token text;
  lote cierre_mandaditos_privado.lotes;
  pedidos_jornada uuid[];
  pendientes integer;
begin
  if auth.uid() is null or not coalesce(public.piloto_es_operador(), false) then
    raise exception 'Solo recepción autorizada.' using errcode = '42501';
  end if;
  if not isfinite(jornada_elegida) or jornada_elegida > jornada_actual then
    raise exception 'Elige una jornada válida.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('piloto_cierre_diario', 0));
  delete from cierre_mandaditos_privado.lotes where vence_en <= now();

  select coalesce(array_agg(p.id), '{}'::uuid[]),
    count(*) filter (where p.estado not in ('entregado', 'cancelado') and p.cierre_mandaditos is null)
  into pedidos_jornada, pendientes
  from (
    select o.id, o.estado, o.cierre_mandaditos
    from public.piloto_pedidos o
    where o.creado_en >= inicio and o.creado_en < fin and o.pedido_prueba_en is null
    order by o.id for update of o
  ) p;
  if cardinality(pedidos_jornada) = 0 then
    return jsonb_build_object('cantidad', 0);
  end if;

  if token_anterior is not null and token_anterior ~ '^[0-9a-f]{64}$' then
    select l.* into lote from cierre_mandaditos_privado.lotes l
    where l.huella = sha256(convert_to(token_anterior, 'UTF8'))
      and l.jornada = jornada_elegida and l.vence_en > now() and l.creado_por = auth.uid()
      and not exists (
        select 1 from unnest(pedidos_jornada) as p(id)
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
    select lote.id, p.id from unnest(pedidos_jornada) as p(id);
  end if;

  return jsonb_build_object('token', token, 'cantidad', cardinality(pedidos_jornada), 'pendientes', pendientes, 'vence_en', lote.vence_en);
end;
$$;

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
    where m.lote_id = lote.id and o.pedido_prueba_en is null and o.folio = folio_pedido for update of o;
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
          raise exception 'Recepción debe verificar este pedido antes de cerrarlo. Comunícate con recepción.';
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
      'entrega', o.entrega,
      'direccion', case when lote.mostrar_direccion and o.entrega = 'domicilio'
        then nullif(btrim(o.direccion), '') end,
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
    where m.lote_id = lote.id and o.pedido_prueba_en is null
  ));
end;
$$;

CREATE OR REPLACE FUNCTION public.piloto_operacion_listar()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not public.piloto_es_operador() then raise exception 'Solo administración/recepción.' using errcode='42501';end if;
 return jsonb_build_object(
   'fondo',public.exhibicion_fondo_estado(),
   'pedidos',(
     select coalesce(jsonb_agg(
       to_jsonb(p) || jsonb_build_object('fondo',(select to_jsonb(a)||jsonb_build_object('vigente',a.estado='reservada' and a.vence_en>now()) from public.exhibicion_fondo_apoyos a where a.pedido_id=p.id)) || jsonb_build_object(
         'cliente_info',
         case when c.id is null then null when not public.piloto_es_admin() then jsonb_build_object('pedidos_completados',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.pedido_prueba_en is null and pc.estado='entregado'),'pedidos_cancelados',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.pedido_prueba_en is null and pc.estado='cancelado'),'pedidos_totales',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.pedido_prueba_en is null),'estado','operativo') else jsonb_build_object(
           'id',c.id,
           'nombre',c.nombre,
           'telefono',c.telefono,
           'telefono_verificado',c.telefono_verificado,
           'pedidos_completados',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.pedido_prueba_en is null and pc.estado='entregado'),
           'pedidos_cancelados',(select count(*) from public.piloto_pedidos px where px.cliente_id=c.id and px.pedido_prueba_en is null and px.estado='cancelado'),
           'pedidos_totales',(select count(*) from public.piloto_pedidos pt where pt.cliente_id=c.id and pt.pedido_prueba_en is null),
           'estado',case
             when (select count(*) from public.piloto_pedidos pe where pe.cliente_id=c.id and pe.estado='entregado')>=3 then 'recurrente'
             when (select count(*) from public.piloto_pedidos pe where pe.cliente_id=c.id and pe.estado='entregado')=2 then 'seguimiento'
             else 'nuevo'
           end,
           'beneficios_activos',exists(
             select 1 from public.cliente_consentimientos cc
             where cc.cliente_id=c.id and cc.tipo='beneficios_cumpleanos'
               and cc.aceptado=true and cc.revocado_en is null
           ),
           'cumple_dia',(select cc.dia from public.cliente_consentimientos cc where cc.cliente_id=c.id and cc.tipo='beneficios_cumpleanos' and cc.aceptado=true and cc.revocado_en is null),
           'cumple_mes',(select cc.mes from public.cliente_consentimientos cc where cc.cliente_id=c.id and cc.tipo='beneficios_cumpleanos' and cc.aceptado=true and cc.revocado_en is null)
         ) end
       )
       order by p.creado_en desc
     ),'[]'::jsonb)
     from public.piloto_pedidos p
     left join public.clientes c on c.id=p.cliente_id
     where p.pedido_prueba_en is null
   ),
   'repartidores',(select coalesce(jsonb_agg(to_jsonb(r) order by nombre),'[]') from public.piloto_repartidores r)
 );
end
$function$;

CREATE OR REPLACE FUNCTION public.piloto_operacion_sello()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
 if not coalesce(public.piloto_es_operador(),false) then raise exception 'Cuenta sin permiso de recepción.' using errcode='42501';end if;
 return (select jsonb_build_object('cantidad',count(*),'version',coalesce(sum(revision),0),'equipo',(select md5(coalesce(jsonb_agg(to_jsonb(r) order by r.id)::text,'[]')) from public.piloto_repartidores r)||(select actualizado_en::text from public.piloto_configuracion_pago where id)) from public.piloto_pedidos where pedido_prueba_en is null);
end$function$;
