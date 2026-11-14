create table public.exhibicion_promociones_comida (
 id uuid primary key default gen_random_uuid(),
 titulo text not null check(char_length(trim(titulo)) between 3 and 100),
 porcentaje integer not null check(porcentaje between 1 and 100),
 activa boolean not null default false,
 mostrar_anuncio boolean not null default true,
 revision integer not null default 1,
 actualizado_en timestamptz not null default now(),
 actualizado_por uuid references auth.users(id)
);
create unique index exhibicion_una_promocion_comida_activa on public.exhibicion_promociones_comida(activa) where activa;
alter table public.exhibicion_promociones_comida enable row level security;
revoke all on public.exhibicion_promociones_comida from public,anon,authenticated;
insert into public.exhibicion_promociones_comida(titulo,porcentaje,activa,mostrar_anuncio)
values('Apoyo de Exhibición',50,true,true);
alter table public.exhibicion_fondo_apoyos add column porcentaje integer not null default 50 check(porcentaje between 1 and 100);
alter table public.exhibicion_fondo_apoyos add column promocion_comida_id uuid references public.exhibicion_promociones_comida(id);
update public.exhibicion_fondo_apoyos set promocion_comida_id=(select id from public.exhibicion_promociones_comida where activa);
alter table public.exhibicion_fondo_apoyos drop constraint exhibicion_fondo_apoyos_check;
alter table public.exhibicion_fondo_apoyos add constraint exhibicion_apoyo_porcentaje_check
check(descuento_centavos>0 and descuento_centavos=round(servicio_base_centavos::numeric*porcentaje/100));

create function public.exhibicion_promocion_comida_guardar(promocion uuid,version integer,datos jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.exhibicion_promociones_comida; pct integer; nombre text; encendida boolean; visible boolean;
begin
 if auth.uid() is null or not public.piloto_es_admin() then raise exception 'Solo administración puede administrar promociones globales.' using errcode='42501';end if;
 if datos is null or jsonb_typeof(datos)<>'object' then raise exception 'Revisa la promoción.';end if;
 nombre:=trim(datos->>'titulo');pct:=(datos->>'porcentaje')::integer;
 encendida:=(datos->>'activa')::boolean;visible:=(datos->>'mostrar_anuncio')::boolean;
 if nombre is null or char_length(nombre) not between 3 and 100 or pct is null or pct not between 1 and 100 or encendida is null or visible is null then raise exception 'Escribe un nombre, porcentaje de 1 a 100 y elige la visibilidad.';end if;
 -- Same serialization point as reservations and balance loads.
 perform 1 from public.exhibicion_fondo where id for update;
 if promocion is not null then
  select * into p from public.exhibicion_promociones_comida where id=promocion for update;
  if not found or version is null or p.revision<>version then raise exception 'La promoción cambió. Actualiza antes de guardar.';end if;
 end if;
 if encendida then
  update public.exhibicion_promociones_comida set activa=false,revision=revision+1,actualizado_en=now(),actualizado_por=auth.uid()
   where activa and id is distinct from promocion;
 end if;
 if promocion is null then
  insert into public.exhibicion_promociones_comida(titulo,porcentaje,activa,mostrar_anuncio,actualizado_por)
  values(nombre,pct,encendida,visible,auth.uid()) returning * into p;
 else
  update public.exhibicion_promociones_comida set titulo=nombre,porcentaje=pct,activa=encendida,mostrar_anuncio=visible,
   revision=revision+1,actualizado_en=now(),actualizado_por=auth.uid() where id=promocion returning * into p;
 end if;
 return to_jsonb(p);
end $$;
revoke all on function public.exhibicion_promocion_comida_guardar(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.exhibicion_promocion_comida_guardar(uuid,integer,jsonb) to authenticated;

CREATE OR REPLACE FUNCTION promocion_privada.reservar(pedido uuid, servicio integer, zona_local boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.piloto_pedidos; saldo bigint; reservado bigint; descuento integer; promo public.exhibicion_promociones_comida;
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
 select * into promo from public.exhibicion_promociones_comida where activa;
 if not found then return jsonb_build_object('descuento_centavos',0);end if;
 descuento:=round(servicio::numeric*promo.porcentaje/100)::integer;
 if descuento<=0 then return jsonb_build_object('descuento_centavos',0);end if;
 select coalesce(sum(descuento_centavos),0) into reservado from public.exhibicion_fondo_apoyos
 where estado='reservada' and vence_en>now();
 if saldo-reservado<descuento then return jsonb_build_object('descuento_centavos',0); end if;
 insert into public.exhibicion_fondo_apoyos(pedido_id,servicio_base_centavos,descuento_centavos,estado,vence_en,porcentaje,promocion_comida_id)
 values(pedido,servicio,descuento,'reservada',now()+interval '30 minutes',promo.porcentaje,promo.id)
 on conflict(pedido_id) do update set servicio_base_centavos=excluded.servicio_base_centavos,
 descuento_centavos=excluded.descuento_centavos,estado='reservada',vence_en=excluded.vence_en,confirmado_en=null,confirmado_por=null,porcentaje=excluded.porcentaje,promocion_comida_id=excluded.promocion_comida_id;
 return jsonb_build_object('descuento_centavos',descuento);
end $function$;
CREATE OR REPLACE FUNCTION public.exhibicion_fondo_estado()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare saldo bigint; reservado bigint;
begin
 if auth.uid() is null or not public.piloto_es_operador() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
 select saldo_centavos into saldo from public.exhibicion_fondo where id;
 select coalesce(sum(descuento_centavos),0) into reservado from public.exhibicion_fondo_apoyos where estado='reservada' and vence_en>now();
 return jsonb_build_object('saldo_centavos',saldo,'reservado_centavos',reservado,'disponible_centavos',saldo-reservado,'promociones_comida',(select coalesce(jsonb_agg(to_jsonb(c) order by c.actualizado_en desc),'[]'::jsonb) from public.exhibicion_promociones_comida c where c.activa or public.piloto_es_admin()));
end $function$;
create or replace function public.exhibicion_promocion_publica() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((
  select jsonb_build_object('porcentaje',c.porcentaje,'titulo',c.titulo,'negocios',coalesce((
    select jsonb_agg(slug order by slug) from public.piloto_menus_completos
    where original->>'categoria'='comida' and original->>'tipoDelivery'='mandaditos'
     and original->>'delivery'='true' and original->>'activo' is distinct from 'false'
  ),'[]'::jsonb))
  from public.exhibicion_promociones_comida c where c.activa and c.mostrar_anuncio
   and (select saldo_centavos from public.exhibicion_fondo where id)
    -(select coalesce(sum(descuento_centavos),0) from public.exhibicion_fondo_apoyos where estado='reservada' and vence_en>now())
      >=round(4000::numeric*c.porcentaje/100)
 ),jsonb_build_object('porcentaje',0,'titulo','','negocios','[]'::jsonb))
$$;



