-- Additive migration: no balance writes, no changes to automatic order/promo RPCs.
-- Privileged implementation remains outside exposed schemas.
create or replace function promocion_privada.ajustar_fondo(
 p_accion text, p_monto_centavos integer, p_clave uuid, p_saldo_esperado bigint
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 saldo bigint; final bigint; diferencia bigint; reservado bigint;
 motivo_ajuste text; previo public.exhibicion_fondo_movimientos;
begin
 if auth.uid() is null or not coalesce(public.piloto_es_admin(),false) then
  raise exception 'Solo administración autorizada puede ajustar saldo.' using errcode='42501';
 end if;
 if p_accion is null or p_accion not in ('agregar','restar','fijar')
    or p_monto_centavos is null or p_monto_centavos not between 0 and 10000000
    or (p_accion <> 'fijar' and p_monto_centavos=0)
    or p_clave is null or p_saldo_esperado is null or p_saldo_esperado not between 0 and 9007199254740991 then
  raise exception 'Acción, monto o confirmación inválidos.' using errcode='22023';
 end if;
 motivo_ajuste:='Ajuste manual admin: '||p_accion||' saldo';
 -- Same lock used by reservations, consumption and existing top-ups.
 select saldo_centavos into saldo from public.exhibicion_fondo where id for update;
 if not found then raise exception 'No se encontró el fondo promocional.'; end if;
 select * into previo from public.exhibicion_fondo_movimientos where clave=p_clave;
 if found then
  -- Validate the complete original request, including actor and reviewed balance.
  if previo.actor is distinct from auth.uid() or previo.pedido_id is not null
     or previo.motivo<>motivo_ajuste
     or previo.saldo_despues_centavos-previo.importe_centavos<>p_saldo_esperado
     or (p_accion='agregar' and previo.importe_centavos<>p_monto_centavos)
     or (p_accion='restar' and previo.importe_centavos<>-p_monto_centavos)
     or (p_accion='fijar' and previo.saldo_despues_centavos<>p_monto_centavos) then
   raise exception 'Esta clave ya corresponde a otra operación.' using errcode='22023';
  end if;
  return public.exhibicion_fondo_estado() || jsonb_build_object('movimiento_id',previo.id,'repetido',true);
 end if;
 if saldo<>p_saldo_esperado then
  raise exception 'El saldo cambió. Actualiza el fondo y confirma nuevamente.' using errcode='22023';
 end if;
 final:=case p_accion when 'agregar' then saldo+p_monto_centavos when 'restar' then saldo-p_monto_centavos else p_monto_centavos end;
 if final<0 then raise exception 'Saldo insuficiente. No se permite saldo negativo.' using errcode='22023'; end if;
 if final>9007199254740991 then raise exception 'Saldo fuera del límite permitido.' using errcode='22023'; end if;
 diferencia:=final-saldo;
 if diferencia=0 then raise exception 'El saldo final ya es el actual; no hay ajuste que registrar.' using errcode='22023'; end if;
 select coalesce(sum(descuento_centavos),0) into reservado from public.exhibicion_fondo_apoyos
 where estado='reservada' and vence_en>now();
 if final<reservado then raise exception 'El saldo final no cubre los apoyos pendientes.' using errcode='22023'; end if;
 update public.exhibicion_fondo set saldo_centavos=final,actualizado_en=now() where id;
 insert into public.exhibicion_fondo_movimientos(clave,importe_centavos,saldo_despues_centavos,actor,motivo)
 values(p_clave,diferencia,final,auth.uid(),motivo_ajuste) returning * into previo;
 return public.exhibicion_fondo_estado() || jsonb_build_object('movimiento_id',previo.id,'repetido',false);
end $$;
revoke all on function promocion_privada.ajustar_fondo(text,integer,uuid,bigint) from public,anon,authenticated;
grant usage on schema promocion_privada to authenticated;
grant execute on function promocion_privada.ajustar_fondo(text,integer,uuid,bigint) to authenticated;

create or replace function public.exhibicion_fondo_ajustar(
 p_accion text, p_monto_centavos integer, p_clave uuid, p_saldo_esperado bigint
) returns jsonb language sql security invoker set search_path='' as $$
 select promocion_privada.ajustar_fondo(p_accion,p_monto_centavos,p_clave,p_saldo_esperado)
$$;
revoke all on function public.exhibicion_fondo_ajustar(text,integer,uuid,bigint) from public,anon,authenticated;
grant execute on function public.exhibicion_fondo_ajustar(text,integer,uuid,bigint) to authenticated;
