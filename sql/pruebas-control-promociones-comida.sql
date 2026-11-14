begin;
do $$
declare admin_id uuid; receptor uuid; camp jsonb; r jsonb; p uuid; q uuid; slug text; saldo bigint;
begin
 select usuario_id into admin_id from public.piloto_administradores limit 1;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 select saldo_centavos into saldo from public.exhibicion_fondo where id for update;
 if saldo<>12000 then raise exception 'Expected untouched initial balance';end if;
 select m.slug into slug from public.piloto_menus_completos m where original->>'categoria'='comida' and original->>'tipoDelivery'='mandaditos' and original->>'delivery'='true' limit 1;
 camp:=public.exhibicion_promocion_comida_guardar(null,null,'{"titulo":"PRUEBA GLOBAL 40","porcentaje":40,"activa":true,"mostrar_anuncio":true}');
 if (public.exhibicion_promocion_publica()->>'porcentaje')::int<>40 or (select count(*) from public.exhibicion_promociones_comida where activa)<>1 then raise exception 'Active campaign not connected to advertising';end if;
 insert into public.piloto_pedidos(clave,solicitud,tipo,entrega,pago,cliente,detalle,lineas,productos_centavos)
 values(gen_random_uuid(),'{}','comida','domicilio','efectivo','PRUEBA TRANSACCIONAL','No preparar',jsonb_build_array(jsonb_build_object('negocio',slug)),15000) returning id into p;
 r:=public.piloto_pedido_operar(p,1,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>1600 then raise exception 'Quoted discount is not configured 40 percent';end if;
 camp:=public.exhibicion_promocion_comida_guardar((camp->>'id')::uuid,(camp->>'revision')::int,'{"titulo":"PRUEBA GLOBAL 80","porcentaje":80,"activa":true,"mostrar_anuncio":false}');
 if (public.exhibicion_promocion_publica()->>'porcentaje')::int<>0 then raise exception 'Hidden announcement still public';end if;
 r:=public.piloto_pedido_operar(p,(r->>'revision')::int,'registrar_aceptacion','{}');
 if (select saldo_centavos from public.exhibicion_fondo where id)<>saldo-1600 then raise exception 'Edit retroactively changed a reserved discount';end if;
 insert into public.piloto_pedidos(clave,solicitud,tipo,entrega,pago,cliente,detalle,lineas,productos_centavos)
 values(gen_random_uuid(),'{}','comida','domicilio','efectivo','PRUEBA TRANSACCIONAL','No preparar',jsonb_build_array(jsonb_build_object('negocio',slug)),15000) returning id into q;
 r:=public.piloto_pedido_operar(q,1,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>3200 then raise exception 'Hidden announcement incorrectly disabled actual promo';end if;
 camp:=public.exhibicion_promocion_comida_guardar((camp->>'id')::uuid,(camp->>'revision')::int,'{"titulo":"PRUEBA GLOBAL 80","porcentaje":80,"activa":false,"mostrar_anuncio":true}');
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>0 or (public.exhibicion_promocion_publica()->>'porcentaje')::int<>0 then raise exception 'Disabled campaign still discounts or advertises';end if;
 camp:=public.exhibicion_promocion_comida_guardar((camp->>'id')::uuid,(camp->>'revision')::int,'{"titulo":"PRUEBA GLOBAL 50","porcentaje":50,"activa":true,"mostrar_anuncio":true}');
 update public.exhibicion_fondo set saldo_centavos=1999 where id;
 if (public.exhibicion_promocion_publica()->>'porcentaje')::int<>0 then raise exception 'Insufficient support still advertises';end if;
 r:=public.piloto_pedido_operar(q,(r->>'revision')::int,'cotizar',jsonb_build_object('productos_centavos',15000,'servicio_centavos',4000,'minutos',40,'zona_local',true));
 if (r->>'descuento_servicio_centavos')::int<>0 then raise exception 'Insufficient support still discounts';end if;
 perform public.exhibicion_fondo_cargar(10000,gen_random_uuid());
 if (public.exhibicion_promocion_publica()->>'porcentaje')::int<>50 then raise exception 'Reload did not restore active announcement';end if;
 select usuario_id into receptor from public.piloto_recepcion_accesos x where activo and not exists(select 1 from public.piloto_administradores a where a.usuario_id=x.usuario_id) limit 1;
 perform set_config('request.jwt.claim.sub',receptor::text,true);
 begin perform public.exhibicion_promocion_comida_guardar(null,null,'{"titulo":"PROHIBIDA","porcentaje":100,"activa":true,"mostrar_anuncio":true}');raise exception 'Reception changed campaign';exception when insufficient_privilege then null;end;
 if has_table_privilege('anon','public.exhibicion_promociones_comida','SELECT') or has_table_privilege('authenticated','public.exhibicion_promociones_comida','UPDATE') or has_function_privilege('anon','public.exhibicion_promocion_comida_guardar(uuid,integer,jsonb)','EXECUTE') then raise exception 'Unsafe campaign permissions';end if;
end $$;
rollback;
select 'PASS: same campaign drives quote and signs; edit snapshot preserved; hide is separate from disable; exhaustion hides and prevents full service discount; reload restores; reception cannot administer; all changes rolled back' resultado,
saldo_centavos saldo_real_centavos,public.exhibicion_promocion_publica() promocion_actual from public.exhibicion_fondo where id;

