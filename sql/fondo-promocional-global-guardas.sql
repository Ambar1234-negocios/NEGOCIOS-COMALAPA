-- Guard every fulfillment/cancellation entry point, including legacy RPCs.
create function promocion_privada.proteger_transicion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.estado='cancelado' then
  update public.exhibicion_fondo_apoyos set estado='liberada' where pedido_id=new.id and estado='reservada';
 elsif new.estado in ('propuesto','asignado','recogido','entregado') and exists(
  select 1 from public.exhibicion_fondo_apoyos where pedido_id=new.id and estado<>'consumida'
 ) and new.descuento_servicio_centavos>0 and new.promocion_id is null then
  raise exception 'Confirma el pedido y el apoyo desde el panel antes de continuar.';
 end if;
 return new;
end $$;
revoke all on function promocion_privada.proteger_transicion() from public,anon,authenticated;
create trigger exhibicion_fondo_proteger_transicion before update on public.piloto_pedidos
for each row execute function promocion_privada.proteger_transicion();

