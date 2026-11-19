create or replace function public.piloto_pedido_marcar_prueba(pedido uuid, version integer)
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

  if p.estado <> 'entregado' and (p.estado not in ('pendiente', 'cotizado', 'cancelado') or p.repartidor_id is not null
    or p.pago_verificado or p.efectivo_recibido or p.transferencia_reportada
    or exists(select 1 from public.exhibicion_fondo_apoyos a where a.pedido_id=p.id and a.estado='consumida'))
  then
    raise exception 'Solo puedes retirar pedidos de prueba que no tengan reparto ni pagos registrados.';
  end if;

  update public.piloto_pedidos
  set pedido_prueba_en=now(),
      estado=case when p.estado='entregado' then p.estado else 'cancelado' end,
      revision=revision+1
  where id=p.id returning * into p;
  perform public.piloto_promocion_liberar_interna(p.id);
  update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;
  update public.piloto_confirmaciones_cliente set vence=now() where pedido_id=p.id;
  insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision)
  values(p.id,auth.uid(),'marcar_prueba',p.estado,p.revision);
end;
$$;
