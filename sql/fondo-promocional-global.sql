-- Global Exhibición fund. All amounts are integer MXN cents.
create schema if not exists promocion_privada;
revoke all on schema promocion_privada from public, anon, authenticated;
create table public.exhibicion_fondo (
 id boolean primary key default true check(id),
 saldo_centavos bigint not null check(saldo_centavos>=0),
 actualizado_en timestamptz not null default now()
);
create table public.exhibicion_fondo_movimientos (
 id uuid primary key default gen_random_uuid(),
 clave uuid not null unique,
 pedido_id uuid references public.piloto_pedidos(id),
 importe_centavos bigint not null check(importe_centavos<>0),
 saldo_despues_centavos bigint not null check(saldo_despues_centavos>=0),
 actor uuid references auth.users(id),
 motivo text not null,
 creado_en timestamptz not null default now()
);
create unique index exhibicion_fondo_un_cobro_por_pedido on public.exhibicion_fondo_movimientos(pedido_id) where pedido_id is not null;
create table public.exhibicion_fondo_apoyos (
 pedido_id uuid primary key references public.piloto_pedidos(id),
 servicio_base_centavos integer not null check(servicio_base_centavos>0),
 descuento_centavos integer not null check(descuento_centavos>0 and descuento_centavos=round(servicio_base_centavos/2.0)),
 estado text not null check(estado in ('reservada','consumida','liberada')),
 vence_en timestamptz not null,
 confirmado_en timestamptz,
 confirmado_por uuid references auth.users(id)
);
create index exhibicion_fondo_reservas on public.exhibicion_fondo_apoyos(vence_en) include(descuento_centavos) where estado='reservada';
alter table public.exhibicion_fondo enable row level security;
alter table public.exhibicion_fondo_movimientos enable row level security;
alter table public.exhibicion_fondo_apoyos enable row level security;
revoke all on public.exhibicion_fondo,public.exhibicion_fondo_movimientos,public.exhibicion_fondo_apoyos from public,anon,authenticated;
-- Deliberately no direct-client policies: all access through authorized RPCs.
insert into public.exhibicion_fondo(id,saldo_centavos) values(true,12000);
insert into public.exhibicion_fondo_movimientos(clave,importe_centavos,saldo_despues_centavos,motivo)
values(gen_random_uuid(),12000,12000,'Carga inicial autorizada');

create function promocion_privada.reservar(pedido uuid,servicio integer,zona_local boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.piloto_pedidos; saldo bigint; reservado bigint; descuento integer;
begin
 if auth.uid() is null or not public.piloto_es_operador() then raise exception 'Solo recepción autorizada.' using errcode='42501'; end if;
 select * into p from public.piloto_pedidos where id=pedido for update;
 select saldo_centavos into saldo from public.exhibicion_fondo where id for update;
 if exists(select 1 from public.exhibicion_fondo_apoyos where pedido_id=pedido and estado='consumida') then
  raise exception 'El apoyo de este pedido ya fue confirmado; no se puede recotizar.';
 end if;
 update public.exhibicion_fondo_apoyos set estado='liberada' where pedido_id=pedido and estado='reservada';
 if p.tipo<>'comida' or p.entrega<>'domicilio' or not coalesce(zona_local,false) or servicio<=0
    or jsonb_array_length(p.lineas)=0 or exists(
      select 1 from jsonb_array_elements(p.lineas) l
      left join public.piloto_menus_completos m on m.slug=l->>'negocio'
      where m.slug is null or m.original->>'categoria' is distinct from 'comida'
       or m.original->>'tipoDelivery' is distinct from 'mandaditos'
       or m.original->>'delivery' is distinct from 'true'
    ) then return jsonb_build_object('descuento_centavos',0); end if;
 descuento:=round(servicio/2.0)::integer;
 select coalesce(sum(descuento_centavos),0) into reservado from public.exhibicion_fondo_apoyos
 where estado='reservada' and vence_en>now();
 if saldo-reservado<descuento then return jsonb_build_object('descuento_centavos',0); end if;
 insert into public.exhibicion_fondo_apoyos(pedido_id,servicio_base_centavos,descuento_centavos,estado,vence_en)
 values(pedido,servicio,descuento,'reservada',now()+interval '30 minutes')
 on conflict(pedido_id) do update set servicio_base_centavos=excluded.servicio_base_centavos,
 descuento_centavos=excluded.descuento_centavos,estado='reservada',vence_en=excluded.vence_en,confirmado_en=null,confirmado_por=null;
 return jsonb_build_object('descuento_centavos',descuento);
end $$;

create function promocion_privada.confirmar(pedido uuid) returns void
language plpgsql security definer set search_path='' as $$
declare a public.exhibicion_fondo_apoyos; saldo bigint; p public.piloto_pedidos;
begin
 if auth.uid() is null or not public.piloto_es_operador() then raise exception 'Solo recepción autorizada.' using errcode='42501'; end if;
 select * into p from public.piloto_pedidos where id=pedido for update;
 select saldo_centavos into saldo from public.exhibicion_fondo where id for update;
 select * into a from public.exhibicion_fondo_apoyos where pedido_id=pedido for update;
 if not found or a.estado='consumida' then return; end if;
 if a.estado<>'reservada' or a.vence_en<=now() then raise exception 'El apoyo venció. Guarda una nueva cotización antes de confirmar.'; end if;
 if p.estado<>'cotizado' or p.servicio_base_centavos<>a.servicio_base_centavos
    or p.descuento_servicio_centavos<>a.descuento_centavos then raise exception 'Revisa la cotización antes de confirmar el apoyo.'; end if;
 if saldo<a.descuento_centavos then raise exception 'Saldo insuficiente.'; end if;
 update public.exhibicion_fondo set saldo_centavos=saldo_centavos-a.descuento_centavos,actualizado_en=now() where id
 returning saldo_centavos into saldo;
 insert into public.exhibicion_fondo_movimientos(clave,pedido_id,importe_centavos,saldo_despues_centavos,actor,motivo)
 values(gen_random_uuid(),pedido,-a.descuento_centavos,saldo,auth.uid(),'Pedido confirmado desde panel');
 update public.exhibicion_fondo_apoyos set estado='consumida',confirmado_en=now(),confirmado_por=auth.uid() where pedido_id=pedido;
end $$;

create function public.exhibicion_fondo_cargar(monto_centavos integer,clave uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare saldo bigint; previo public.exhibicion_fondo_movimientos;
begin
 if auth.uid() is null or not public.piloto_es_admin() then raise exception 'Solo administración puede reponer saldo.' using errcode='42501'; end if;
 if monto_centavos is null or monto_centavos not between 1 and 10000000 or clave is null then raise exception 'Monto o clave inválidos.'; end if;
 select saldo_centavos into saldo from public.exhibicion_fondo where id for update;
 select * into previo from public.exhibicion_fondo_movimientos m where m.clave=exhibicion_fondo_cargar.clave;
 if found then
  if previo.importe_centavos<>monto_centavos or previo.pedido_id is not null then raise exception 'Esta clave ya corresponde a otro movimiento.'; end if;
  return jsonb_build_object('saldo_centavos',saldo);
 end if;
 update public.exhibicion_fondo set saldo_centavos=saldo_centavos+monto_centavos,actualizado_en=now() where id returning saldo_centavos into saldo;
 insert into public.exhibicion_fondo_movimientos(clave,importe_centavos,saldo_despues_centavos,actor,motivo)
 values(clave,monto_centavos,saldo,auth.uid(),'Reposición admin');
 return jsonb_build_object('saldo_centavos',saldo);
end $$;

create function public.exhibicion_fondo_estado() returns jsonb
language plpgsql security definer set search_path='' as $$
declare saldo bigint; reservado bigint;
begin
 if auth.uid() is null or not public.piloto_es_operador() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
 select saldo_centavos into saldo from public.exhibicion_fondo where id;
 select coalesce(sum(descuento_centavos),0) into reservado from public.exhibicion_fondo_apoyos where estado='reservada' and vence_en>now();
 return jsonb_build_object('saldo_centavos',saldo,'reservado_centavos',reservado,'disponible_centavos',saldo-reservado);
end $$;

-- Availability only. Never disclose the fund balance to customers.
create function public.exhibicion_fondo_disponible(negocios text[],servicio_centavos integer) returns boolean
language sql security definer set search_path='' as $$
 select coalesce(servicio_centavos between 1 and 10000000 and cardinality(negocios) between 1 and 40
 and not exists(select 1 from unnest(negocios) n left join public.piloto_menus_completos m on m.slug=n
   where m.slug is null or m.original->>'categoria' is distinct from 'comida'
   or m.original->>'tipoDelivery' is distinct from 'mandaditos' or m.original->>'delivery' is distinct from 'true')
 and (select saldo_centavos from public.exhibicion_fondo where id)
 -(select coalesce(sum(descuento_centavos),0) from public.exhibicion_fondo_apoyos where estado='reservada' and vence_en>now())>=round(servicio_centavos/2.0),false)
$$;
revoke all on all functions in schema promocion_privada from public,anon,authenticated;
revoke all on function public.exhibicion_fondo_cargar(integer,uuid),public.exhibicion_fondo_estado(),public.exhibicion_fondo_disponible(text[],integer) from public,anon,authenticated;
grant execute on function public.exhibicion_fondo_cargar(integer,uuid),public.exhibicion_fondo_estado() to authenticated;
grant execute on function public.exhibicion_fondo_disponible(text[],integer) to anon,authenticated;

-- Integrations preserve existing authorization, revision checks and order events.
CREATE OR REPLACE FUNCTION public.piloto_pedido_operar(pedido uuid, version integer, accion text, datos jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p public.piloto_pedidos;
  r public.piloto_repartidores;
  admin boolean:=public.piloto_es_operador();
  es_rider boolean:=false;
  productos int;
  servicio int;
  servicio_cliente int;
  minutos int;
  promo uuid;
  promo_calc jsonb;
  zona_local boolean;
begin
  if auth.uid() is null then raise exception 'Entra a tu cuenta.' using errcode='42501';end if;
  select * into p from public.piloto_pedidos where id=pedido for update;
  if not found then raise exception 'No se encontró la solicitud.';end if;
  if p.repartidor_id is not null then select * into r from public.piloto_repartidores where id=p.repartidor_id;es_rider:=r.usuario_id=auth.uid();end if;
  if not admin and not coalesce(es_rider,false) and p.solicitante_id is distinct from auth.uid() then raise exception 'No tienes acceso a esta solicitud.' using errcode='42501';end if;
  if version is null or p.revision<>version then raise exception 'La solicitud cambió. Actualiza antes de continuar.';end if;
  if p.requiere_whatsapp and not p.whatsapp_confirmado and accion<>'cancelar' then raise exception 'Primero confirma que recibiste el WhatsApp con este mismo folio.';end if;
  if p.estado in ('entregado','cancelado') then raise exception 'Esta solicitud ya está cerrada.';end if;
  if accion in ('cotizar','verificar_pago','proponer','cancelar','preparar','listo_recoger','entregar_recogida','registrar_aceptacion') and not admin then raise exception 'Solo recepción puede realizar esta acción.' using errcode='42501';end if;
  if accion in ('aceptar_reparto','rechazar_reparto','recoger','entregar') and not admin and not coalesce(es_rider,false) then raise exception 'Solo el repartidor asignado.' using errcode='42501';end if;

  if accion='cotizar' then
    if p.estado not in ('pendiente','cotizado') then raise exception 'Ya no se puede recotizar.';end if;
    productos:=(datos->>'productos_centavos')::int;
    servicio:=(datos->>'servicio_centavos')::int;
    minutos:=(datos->>'minutos')::int;
    promo:=nullif(datos->>'promocion_id','')::uuid;
    zona_local:=coalesce((datos->>'zona_local')::boolean,false);
    if productos is null or servicio is null or minutos is null or productos not between 0 and 100000000 or servicio not between 0 and 10000000 or minutos not between 1 and 1440 then raise exception 'Revisa importes y minutos.';end if;
    if p.tipo='comida' and productos<>p.productos_centavos then raise exception 'El importe de comida proviene del menú aprobado y no puede alterarse aquí.';end if;
    if p.entrega='recoger' and servicio<>0 then raise exception 'Recoger no tiene costo de envío.';end if;
    if p.entrega='recoger' and promo is not null then raise exception 'Las promociones de mandadito no aplican a pedidos para recoger.';end if;

    if exists(select 1 from public.exhibicion_fondo_apoyos where pedido_id=p.id and estado='consumida') then raise exception 'El apoyo ya fue confirmado; no se puede recotizar.'; end if;
    if promo is null then
      perform public.piloto_promocion_liberar_interna(p.id);
      promo_calc:=promocion_privada.reservar(p.id,servicio,zona_local);
    else
      update public.exhibicion_fondo_apoyos set estado='liberada' where pedido_id=p.id and estado='reservada';
      promo_calc:=public.piloto_promocion_reservar_interna(p.id,promo,servicio,zona_local);
    end if;
    servicio_cliente:=greatest(servicio-coalesce((promo_calc->>'descuento_centavos')::int,0),0);

    if p.pago_verificado and (productos<>p.productos_centavos or servicio_cliente<>p.servicio_centavos) then raise exception 'Ya se registró el pago. No cambies importes sin resolver el pago anterior.';end if;
    if productos<>p.productos_centavos or servicio_cliente<>p.servicio_centavos or promo is distinct from p.promocion_id then p.aceptado:=false;end if;
    p.productos_centavos:=productos;
    p.servicio_base_centavos:=servicio;
    p.descuento_servicio_centavos:=coalesce((promo_calc->>'descuento_centavos')::int,0);
    p.servicio_centavos:=servicio_cliente;
    p.promocion_id:=promo;
    p.minutos:=minutos;
    p.estado:='cotizado';
    p.aceptado:=false;
    p.respuesta_cliente:='';
    if p.entrega='domicilio' then p.entrega_programada_en:=now()+make_interval(mins=>minutos); else p.entrega_programada_en:=null; end if;

  elsif accion in ('aceptar_total','registrar_aceptacion') then
    if accion='aceptar_total' and p.solicitante_id is distinct from auth.uid() then raise exception 'Solo quien envió la solicitud puede aceptar.' using errcode='42501';end if;
    if p.estado<>'cotizado' then raise exception 'Primero guarda la cotización.';end if;p.aceptado:=true;p.respuesta_cliente:='';
    if accion='registrar_aceptacion' then perform promocion_privada.confirmar(p.id); end if;

  elsif accion='verificar_pago' then
    if p.pago<>'transferencia' or not p.aceptado or not (p.estado='cotizado' or (p.pago_al_recibir and p.estado='recogido')) then raise exception 'Primero debe aceptarse el total y el pago debe ser por transferencia.';end if;
    p.pago_verificado:=true;

  elsif accion='proponer' then
    if exists(select 1 from public.exhibicion_fondo_apoyos where pedido_id=p.id and estado<>'consumida')
       and p.descuento_servicio_centavos>0 and p.promocion_id is null then
      raise exception 'Confirma el pedido y el apoyo desde el panel antes de asignarlo.';
    end if;
    if p.entrega<>'domicilio' or p.estado<>'cotizado' or not p.aceptado or (p.pago='transferencia' and not p.pago_al_recibir and not p.pago_verificado) then raise exception 'Confirma cotización, aceptación y pago antes de proponer.';end if;
    select * into r from public.piloto_repartidores where id=(datos->>'repartidor_id')::uuid for update;
    if not found or not r.disponible then raise exception 'El repartidor no está disponible.';end if;
    if exists(select 1 from public.piloto_pedidos where repartidor_id=r.id and estado in ('propuesto','asignado','recogido')) then raise exception 'Ese repartidor ya tiene un trabajo o propuesta.';end if;
    p.repartidor_id:=r.id;p.estado:='propuesto';

  elsif accion='aceptar_reparto' then
    if p.estado<>'propuesto' then raise exception 'No hay propuesta pendiente.';end if;p.estado:='asignado';

  elsif accion='rechazar_reparto' then
    if p.estado<>'propuesto' then raise exception 'No hay propuesta pendiente.';end if;p.estado:='cotizado';p.repartidor_id:=null;

  elsif accion='recoger' then
    if p.estado<>'asignado' then raise exception 'Primero acepta la propuesta.';end if;p.estado:='recogido';

  elsif accion='entregar' then
    if p.estado<>'recogido' then raise exception 'Primero registra la recogida.';end if;
    if p.pago='transferencia' and not p.pago_verificado then raise exception 'Recepción debe comprobar la transferencia antes de entregar.';end if;
    if p.pago='efectivo' and not coalesce((datos->>'efectivo_recibido')::boolean,false) then raise exception 'Confirma que recibiste el efectivo completo.';end if;
    p.efectivo_recibido:=p.pago='efectivo';p.estado:='entregado';p.entregado_en:=now();
    perform public.piloto_promocion_consumir_interna(p.id);

  elsif accion='preparar' then
    if p.entrega<>'recoger' or p.estado<>'cotizado' or not p.aceptado or not p.pago_verificado then raise exception 'Recoger requiere total aceptado y transferencia verificada antes de preparar.';end if;p.estado:='preparando';

  elsif accion='listo_recoger' then
    if p.estado<>'preparando' or p.entrega<>'recoger' then raise exception 'Primero marca en preparación.';end if;p.estado:='listo_recoger';

  elsif accion='entregar_recogida' then
    if p.estado<>'listo_recoger' then raise exception 'Primero marca listo para recoger.';end if;p.estado:='entregado';p.entregado_en:=now();
    perform public.piloto_promocion_consumir_interna(p.id);

  elsif accion='cancelar' then
    if char_length(trim(coalesce(datos->>'motivo','')))=0 or char_length(datos->>'motivo')>500 then raise exception 'Escribe el motivo de cancelación.';end if;p.estado:='cancelado';
    update public.exhibicion_fondo_apoyos set estado='liberada' where pedido_id=p.id and estado='reservada';
    perform public.piloto_promocion_liberar_interna(p.id);

  else raise exception 'Acción inválida.';end if;

  if accion in ('proponer','cancelar','rechazar_reparto') then update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;end if;
  p.revision:=p.revision+1;

  update public.piloto_pedidos
  set respuesta_cliente=p.respuesta_cliente,
      productos_centavos=p.productos_centavos,
      servicio_centavos=p.servicio_centavos,
      servicio_base_centavos=p.servicio_base_centavos,
      descuento_servicio_centavos=p.descuento_servicio_centavos,
      promocion_id=p.promocion_id,
      minutos=p.minutos,
      estado=p.estado,
      revision=p.revision,
      aceptado=p.aceptado,
      pago_verificado=p.pago_verificado,
      efectivo_recibido=p.efectivo_recibido,
      repartidor_id=p.repartidor_id,
      entregado_en=p.entregado_en,
      entrega_programada_en=p.entrega_programada_en
  where id=p.id;

  insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision,datos)
  values(
    p.id,auth.uid(),accion,p.estado,p.revision,
    case
      when accion='cancelar' then jsonb_build_object('motivo',datos->>'motivo')
      when accion='cotizar' then jsonb_build_object(
        'minutos',p.minutos,
        'entrega_programada_en',p.entrega_programada_en,
        'promocion_id',p.promocion_id,
        'servicio_base_centavos',p.servicio_base_centavos,
        'descuento_servicio_centavos',p.descuento_servicio_centavos
      )
      else '{}'::jsonb
    end
  );
  return to_jsonb(p);
end $function$;

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
         case when c.id is null then null when not public.piloto_es_admin() then jsonb_build_object('pedidos_completados',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.estado='entregado'),'pedidos_cancelados',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.estado='cancelado'),'pedidos_totales',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id),'estado','operativo') else jsonb_build_object(
           'id',c.id,
           'nombre',c.nombre,
           'telefono',c.telefono,
           'telefono_verificado',c.telefono_verificado,
           'pedidos_completados',(select count(*) from public.piloto_pedidos pc where pc.cliente_id=c.id and pc.estado='entregado'),
           'pedidos_cancelados',(select count(*) from public.piloto_pedidos px where px.cliente_id=c.id and px.estado='cancelado'),
           'pedidos_totales',(select count(*) from public.piloto_pedidos pt where pt.cliente_id=c.id),
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
   ),
   'repartidores',(select coalesce(jsonb_agg(to_jsonb(r) order by nombre),'[]') from public.piloto_repartidores r)
 );
end $function$;

CREATE OR REPLACE FUNCTION public.piloto_pedido_finalizar_admin(pedido uuid, version integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.piloto_pedidos; previo text;
begin
 if auth.uid() is null or not public.piloto_es_admin() then raise exception 'Solo administración.' using errcode='42501'; end if;
 select * into p from public.piloto_pedidos where id=pedido for update;
 if not found then raise exception 'Pedido no encontrado.'; end if;
 if version is null or p.revision<>version then raise exception 'El pedido cambió. Actualiza antes de finalizar.'; end if;
 if p.estado in ('entregado','cancelado') then raise exception 'El pedido ya está cerrado.'; end if;
 previo:=p.estado;
 perform promocion_privada.confirmar(p.id);
 update public.piloto_pedidos set estado='entregado',aceptado=true,respuesta_cliente='',
 pago_verificado=(p.pago='transferencia'),efectivo_recibido=(p.pago='efectivo'),
 entregado_en=now(),terminado_en=now(),revision=revision+1 where id=p.id returning * into p;
 perform public.piloto_promocion_consumir_interna(p.id);
 update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;
 update public.piloto_confirmaciones_cliente set vence=now() where pedido_id=p.id;
 insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision,datos)
 values(p.id,auth.uid(),'finalizar_admin',p.estado,p.revision,jsonb_build_object('estado_anterior',previo,'pago',p.pago,'entrega_y_cobro_confirmados',true));
 return to_jsonb(p);
end $function$;





