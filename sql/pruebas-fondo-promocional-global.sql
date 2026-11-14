-- Transactional integration tests; no live orders or balance changes survive.
begin;
do $$
declare admin_id uuid; operador_id uuid; p uuid; q uuid; r jsonb; v integer; saldo bigint; k uuid:=gen_random_uuid(); slug text;
begin
 select usuario_id into admin_id from public.piloto_administradores limit 1;
 if admin_id is null then raise exception 'Missing authorized admin fixture'; end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 select m.slug into slug from public.piloto_menus_completos m where original->>'categoria'='comida' and original->>'tipoDelivery'='mandaditos' and original->>'delivery'='true' limit 1;
 if slug is null then raise exception 'Missing eligible food business'; end if;
 select saldo_centavos into saldo from public.exhibicion_fondo where id for update;
 if saldo<>12000 then raise exception 'Expected initial 12000, got %',saldo; end if;
 insert into public.piloto_pedidos(clave,solicitud,tipo,entrega,pago,cliente,detalle,lineas,productos_centavos)
 values(gen_random_uuid(),'{}','comida','domicilio','efectivo','PRUEBA TRANSACCIONAL','No preparar',jsonb_build_array(jsonb_build_object('negocio',slug)),15000) returning id into p;
 r:=public.piloto_pedido_operar(p,1,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>2000 or (r->>'servicio_centavos')::int<>2000 or (r->>'productos_centavos')::int<>15000 then raise exception 'Wrong service discount/products'; end if;
 if (select saldo_centavos from public.exhibicion_fondo where id)<>12000 then raise exception 'Quotation spent balance'; end if;
 if not exists(select 1 from public.exhibicion_fondo_apoyos where pedido_id=p and estado='reservada') then raise exception 'Reservation missing'; end if;
 r:=public.piloto_pedido_operar(p,(r->>'revision')::int,'registrar_aceptacion','{}');
 if (select saldo_centavos from public.exhibicion_fondo where id)<>10000 then raise exception 'Expected final 10000'; end if;
 r:=public.piloto_pedido_operar(p,(r->>'revision')::int,'registrar_aceptacion','{}');
 if (select saldo_centavos from public.exhibicion_fondo where id)<>10000 or (select count(*) from public.exhibicion_fondo_movimientos where pedido_id=p)<>1 then raise exception 'Double spend'; end if;
 begin
  perform public.piloto_pedido_operar(p,(r->>'revision')::int,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',6000,'minutos',40,'zona_local',true));
  raise exception 'TEST_FAIL: consumed order was recotized';
 exception when others then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
 -- Another order: outside locality, then reserve, expire and reject confirmation.
 insert into public.piloto_pedidos(clave,solicitud,tipo,entrega,pago,cliente,detalle,lineas,productos_centavos)
 values(gen_random_uuid(),'{}','comida','domicilio','efectivo','PRUEBA TRANSACCIONAL','No preparar',jsonb_build_array(jsonb_build_object('negocio',slug)),15000) returning id into q;
 r:=public.piloto_pedido_operar(q,1,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',false));
 if (r->>'descuento_servicio_centavos')::int<>0 then raise exception 'Promo outside locality'; end if;
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 update public.exhibicion_fondo_apoyos set vence_en=now()-interval '1 second' where pedido_id=q;
 if (public.exhibicion_fondo_estado()->>'reservado_centavos')::bigint<>0 then raise exception 'Expired reserve still committed'; end if;
 begin
  perform public.piloto_pedido_operar(q,(r->>'revision')::int,'registrar_aceptacion','{}');
  raise exception 'TEST_FAIL: expired reservation confirmed';
 exception when others then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'cancelar','{"motivo":"Prueba transaccional"}');
 if (public.exhibicion_fondo_estado()->>'reservado_centavos')::bigint<>0 or (select saldo_centavos from public.exhibicion_fondo where id)<>10000 then raise exception 'Cancel consumed fund'; end if;
 -- Insufficient balance must remove the entire promotion, never prorate it.
 update public.exhibicion_fondo set saldo_centavos=1999 where id;
 if promocion_privada.exhibicion_fondo_disponible(array[slug],4000) then raise exception 'Unavailable full discount advertised'; end if;
 insert into public.piloto_pedidos(clave,solicitud,tipo,entrega,pago,cliente,detalle,lineas,productos_centavos)
 values(gen_random_uuid(),'{}','comida','domicilio','efectivo','PRUEBA TRANSACCIONAL','No preparar',jsonb_build_array(jsonb_build_object('negocio',slug)),15000) returning id into q;
 r:=public.piloto_pedido_operar(q,1,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>0 or (r->>'servicio_centavos')::int<>4000 then raise exception 'Partial or overdrawn promo'; end if;
 -- Admin topups are idempotent too.
 perform public.exhibicion_fondo_cargar(10000,k);perform public.exhibicion_fondo_cargar(10000,k);
 if (select saldo_centavos from public.exhibicion_fondo where id)<>11999 then raise exception 'Duplicate topup'; end if;
 -- Every business shares the same remaining availability; reservations cannot overbook.
 update public.exhibicion_fondo set saldo_centavos=2000 where id;
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>2000 then raise exception 'Exact remaining balance not reservable'; end if;
 if promocion_privada.exhibicion_fondo_disponible(array[slug],4000) then raise exception 'Reserved funds offered twice'; end if;
 begin
  update public.piloto_pedidos set estado='entregado' where id=q;
  raise exception 'TEST_FAIL: fulfillment bypassed confirmation';
 exception when others then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
 -- Reception may confirm but cannot replenish the fund.
 select usuario_id into operador_id from public.piloto_recepcion_accesos x where activo and not exists(select 1 from public.piloto_administradores a where a.usuario_id=x.usuario_id) limit 1;
 if operador_id is null then raise exception 'Missing reception fixture'; end if;
 perform set_config('request.jwt.claim.sub',operador_id::text,true);
 perform public.exhibicion_fondo_estado();
 begin perform public.exhibicion_fondo_cargar(10000,gen_random_uuid());raise exception 'TEST_FAIL: reception topup';
 exception when insufficient_privilege then null;end;
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'registrar_aceptacion','{}');
 if (select saldo_centavos from public.exhibicion_fondo where id)<>0 then raise exception 'Reception confirmation did not spend exact balance'; end if;
 -- A signed-in nonoperator cannot read the balance or load it.
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.exhibicion_fondo_cargar(10000,gen_random_uuid());raise exception 'TEST_FAIL: unauthorized topup';
 exception when insufficient_privilege then null;end;
 begin perform public.exhibicion_fondo_estado();raise exception 'TEST_FAIL: unauthorized balance read';
 exception when insufficient_privilege then null;end;
 if has_table_privilege('anon','public.exhibicion_fondo','SELECT') or has_table_privilege('authenticated','public.exhibicion_fondo','UPDATE')
 or has_function_privilege('anon','public.exhibicion_fondo_cargar(integer,uuid)','EXECUTE')
 or has_function_privilege('authenticated','promocion_privada.confirmar(uuid)','EXECUTE') then raise exception 'Unsafe privileges';end if;
end $$;
rollback;
select 'PASS: 12000 -> quote/reserve 2000 (balance 12000) -> confirm 10000; repeated confirmation 10000; expiration/cancel/no partial discount/topup idempotency/auth checked. All fixture changes rolled back.' as resultado,
 saldo_centavos as saldo_real_centavos from public.exhibicion_fondo where id;

