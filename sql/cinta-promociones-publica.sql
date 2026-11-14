-- Parameterless marketing endpoint: no balances, customer data or arbitrary-price probes.
create function public.exhibicion_promocion_publica() returns jsonb
language sql stable security definer set search_path='' as $$
 select case when
  (select saldo_centavos from public.exhibicion_fondo where id)
  -(select coalesce(sum(descuento_centavos),0) from public.exhibicion_fondo_apoyos where estado='reservada' and vence_en>now()) >= 2000
 then jsonb_build_object('porcentaje',50,'negocios',coalesce((
  select jsonb_agg(slug order by slug) from public.piloto_menus_completos
  where original->>'categoria'='comida' and original->>'tipoDelivery'='mandaditos'
   and original->>'delivery'='true' and original->>'activo' is distinct from 'false'
 ),'[]'::jsonb)) else jsonb_build_object('porcentaje',0,'negocios','[]'::jsonb) end
$$;
-- Conservatively advertise only while a full $20 support remains (the $40 reference service).
-- Actual delivery prices and full-discount eligibility are still validated at quotation.
revoke all on function public.exhibicion_promocion_publica() from public,anon,authenticated;
grant execute on function public.exhibicion_promocion_publica() to anon,authenticated;

