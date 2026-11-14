-- Recepción operativa, cierre maestro y fichas reusables.
CREATE OR REPLACE FUNCTION public.cliente_beneficio_enlace_crear(pedido uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p public.piloto_pedidos;
  c public.clientes;
  token text;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;

  select * into p from public.piloto_pedidos where id=pedido;
  if p.id is null or p.cliente_id is null then raise exception 'Este pedido no tiene cliente vinculado.'; end if;
  select * into c from public.clientes where id=p.cliente_id;
  if c.id is null then raise exception 'Cliente no encontrado.'; end if;
  if not c.telefono_verificado then raise exception 'Confirma primero que el teléfono del cliente sea correcto.'; end if;

  if exists(
    select 1 from public.cliente_consentimientos x
    where x.cliente_id=c.id and x.tipo='beneficios_cumpleanos'
      and x.aceptado=true and x.revocado_en is null
  ) then
    return jsonb_build_object('ya_activo',true);
  end if;

  delete from public.cliente_beneficio_enlaces
  where cliente_id=c.id and usado_en is null;

  token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.cliente_beneficio_enlaces(cliente_id,token_hash,creado_por,vence_en)
  values(c.id,encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),auth.uid(),now()+interval '7 days');

  return jsonb_build_object('ya_activo',false,'token',token,'vence_en',now()+interval '7 days');
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_beneficio_enlace_crear_cliente(cliente uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  c public.clientes;
  token text;
begin
  if not public.piloto_es_admin() then
    raise exception 'Solo administración/recepción.' using errcode='42501';
  end if;

  select * into c from public.clientes where id=cliente;
  if c.id is null then raise exception 'Cliente no encontrado.'; end if;
  if not c.telefono_verificado then
    raise exception 'Confirma primero que el teléfono del cliente sea correcto.';
  end if;

  if exists(
    select 1 from public.cliente_consentimientos x
    where x.cliente_id=c.id
      and x.tipo='beneficios_cumpleanos'
      and x.aceptado=true
      and x.revocado_en is null
  ) then
    return jsonb_build_object('ya_activo',true);
  end if;

  delete from public.cliente_beneficio_enlaces
  where cliente_id=c.id and usado_en is null;

  token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.cliente_beneficio_enlaces(cliente_id,token_hash,creado_por,vence_en)
  values(
    c.id,
    encode(extensions.digest(convert_to(token,'UTF8'),'sha256'),'hex'),
    auth.uid(),
    now()+interval '7 days'
  );

  return jsonb_build_object(
    'ya_activo',false,
    'token',token,
    'vence_en',now()+interval '7 days'
  );
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_campana_elegibles(campana uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.cliente_campanas;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  select * into c from public.cliente_campanas where id=campana;
  if not found then raise exception 'Campaña no encontrada.'; end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id',cl.id,'nombre',cl.nombre,'telefono',cl.telefono,'telefono_verificado',cl.telefono_verificado,
        'pedidos_completados',(select count(*) from public.piloto_pedidos p where p.cliente_id=cl.id and p.estado='entregado'),
        'enviado_en',(select e.enviado_en from public.cliente_campana_envios e where e.campana_id=c.id and e.cliente_id=cl.id),
        'preparado_en',(select e.preparado_en from public.cliente_campana_envios e where e.campana_id=c.id and e.cliente_id=cl.id)
      )
      order by coalesce(cl.ultimo_pedido_en,cl.creado_en) desc
    )
    from public.clientes cl
    where cl.telefono_verificado=true
      and not exists(select 1 from public.cliente_promocion_bajas b where b.cliente_id=cl.id)
      and exists(
        select 1 from public.cliente_consentimientos cc
        where cc.cliente_id=cl.id and cc.tipo='beneficios_cumpleanos'
          and cc.aceptado=true and cc.revocado_en is null
      )
      and (select count(*) from public.piloto_pedidos p where p.cliente_id=cl.id and p.estado='entregado') >= c.minimo_completados
      and (
        c.negocio_filtro=''
        or exists(
          select 1 from public.piloto_pedidos p
          where p.cliente_id=cl.id and p.estado='entregado'
            and exists(
              select 1 from jsonb_array_elements(coalesce(p.lineas,'[]'::jsonb)) l
              where lower(coalesce(l->>'negocio_nombre','')) like '%'||lower(c.negocio_filtro)||'%'
            )
        )
      )
  ),'[]'::jsonb);
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_campana_guardar(datos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  c public.cliente_campanas;
  titulo text:=trim(coalesce(datos->>'titulo',''));
  mensaje text:=trim(coalesce(datos->>'mensaje',''));
  negocio text:=trim(coalesce(datos->>'negocio_filtro',''));
  minimo integer:=coalesce((datos->>'minimo_completados')::integer,0);
  vig date:=nullif(datos->>'vigencia_hasta','')::date;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  if char_length(titulo) not between 3 and 120 then raise exception 'Escribe un título de 3 a 120 caracteres.'; end if;
  if char_length(mensaje) not between 10 and 1200 then raise exception 'Escribe un mensaje de 10 a 1200 caracteres.'; end if;
  if minimo not between 0 and 1000 then raise exception 'Mínimo de pedidos inválido.'; end if;

  insert into public.cliente_campanas(titulo,mensaje,negocio_filtro,minimo_completados,vigencia_hasta,creado_por)
  values(titulo,mensaje,negocio,minimo,vig,auth.uid())
  returning * into c;

  return to_jsonb(c);
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_campana_marcar_enviado(campana uuid, cliente uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  insert into public.cliente_campana_envios(campana_id,cliente_id,preparado_en,enviado_en,enviado_por)
  values(campana,cliente,now(),now(),auth.uid())
  on conflict(campana_id,cliente_id) do update
    set enviado_en=now(),enviado_por=auth.uid();
  return jsonb_build_object('ok',true);
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_campana_preparar(campana uuid, cliente uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  c public.cliente_campanas;
  cl public.clientes;
  mensaje_final text;
  token_raw text;
  token_hash text;
  preferencias_url text;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  select * into c from public.cliente_campanas where id=campana and activa=true;
  if not found then raise exception 'Campaña no disponible.'; end if;
  select * into cl from public.clientes where id=cliente and telefono_verificado=true;
  if not found then raise exception 'Cliente no disponible.'; end if;
  if exists(select 1 from public.cliente_promocion_bajas b where b.cliente_id=cl.id) then
    raise exception 'Este cliente eligió no recibir promociones.';
  end if;
  if not exists(
    select 1 from public.cliente_consentimientos cc
    where cc.cliente_id=cl.id and cc.tipo='beneficios_cumpleanos'
      and cc.aceptado=true and cc.revocado_en is null
  ) then raise exception 'El cliente no tiene consentimiento promocional vigente.'; end if;

  insert into public.cliente_campana_envios(campana_id,cliente_id,preparado_en)
  values(c.id,cl.id,now())
  on conflict(campana_id,cliente_id) do update set preparado_en=now();

  token_raw:=encode(extensions.gen_random_bytes(32),'hex');
  token_hash:=encode(extensions.digest(convert_to(token_raw,'UTF8'),'sha256'),'hex');
  insert into public.cliente_promocion_enlaces(cliente_id,token_hash)
  values(cl.id,token_hash);
  preferencias_url:='https://exhibicionfronteracomalapa.com/preferencias-promociones.html#'||token_raw;

  mensaje_final:=replace(replace(c.mensaje,'{nombre}',coalesce(nullif(cl.nombre,''),'cliente')),'{vigencia}',coalesce(to_char(c.vigencia_hasta,'DD/MM/YYYY'),''));
  mensaje_final:=regexp_replace(mensaje_final,'\s*Si ya no deseas recibir promociones, responde BAJA\.?\s*$','','i');
  mensaje_final:=trim(regexp_replace(mensaje_final,'[[:space:]]+',' ','g'))||
    E'\n\n⚙️ Preferencias de promociones: '||preferencias_url;

  return jsonb_build_object(
    'telefono',cl.telefono,'nombre',cl.nombre,'mensaje',mensaje_final,
    'url_destino',c.url_destino,'preferencias_url',preferencias_url
  );
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_campanas_listar()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  return coalesce((
    select jsonb_agg(
      to_jsonb(c) || jsonb_build_object(
        'enviados',(select count(*) from public.cliente_campana_envios e where e.campana_id=c.id and e.enviado_en is not null)
      )
      order by c.creado_en desc
    )
    from public.cliente_campanas c
  ),'[]'::jsonb);
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_operacion_listar()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.piloto_es_admin() then
    raise exception 'Solo administración/recepción.' using errcode='42501';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id',c.id,
        'nombre',c.nombre,
        'telefono',c.telefono,
        'telefono_verificado',c.telefono_verificado,
        'creado_en',c.creado_en,
        'actualizado_en',c.actualizado_en,
        'ultimo_pedido_en',c.ultimo_pedido_en,
        'pedidos_totales',(select count(*) from public.piloto_pedidos p where p.cliente_id=c.id),
        'pedidos_completados',(select count(*) from public.piloto_pedidos p where p.cliente_id=c.id and p.estado='entregado'),
        'pedidos_cancelados',(select count(*) from public.piloto_pedidos p where p.cliente_id=c.id and p.estado='cancelado'),
        'beneficios_activos',exists(
          select 1 from public.cliente_consentimientos cc
          where cc.cliente_id=c.id and cc.tipo='beneficios_cumpleanos'
            and cc.aceptado=true and cc.revocado_en is null
        ),
        'cumple_dia',(select cc.dia from public.cliente_consentimientos cc where cc.cliente_id=c.id and cc.tipo='beneficios_cumpleanos' and cc.aceptado=true and cc.revocado_en is null),
        'cumple_mes',(select cc.mes from public.cliente_consentimientos cc where cc.cliente_id=c.id and cc.tipo='beneficios_cumpleanos' and cc.aceptado=true and cc.revocado_en is null),
        'estado',case
          when (select count(*) from public.piloto_pedidos p where p.cliente_id=c.id and p.estado='entregado')>=3 then 'recurrente'
          when (select count(*) from public.piloto_pedidos p where p.cliente_id=c.id and p.estado='entregado')=2 then 'seguimiento'
          else 'nuevo'
        end
      )
      order by coalesce(c.ultimo_pedido_en,c.creado_en) desc
    )
    from public.clientes c
  ),'[]'::jsonb);
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_telefono_corregir(pedido uuid, telefono text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p public.piloto_pedidos;
  origen public.clientes;
  destino public.clientes;
  norm text;
  anterior text;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  norm:=public.cliente_telefono_normalizar(telefono);
  if norm='' then raise exception 'Escribe un teléfono válido de 10 a 15 dígitos.'; end if;

  select * into p from public.piloto_pedidos where id=pedido;
  if p.id is null then raise exception 'Pedido no encontrado.'; end if;

  if p.cliente_id is not null then
    select * into origen from public.clientes where id=p.cliente_id for update;
  end if;

  select * into destino from public.clientes where telefono_normalizado=norm for update;

  if origen.id is null then
    if destino.id is null then
      insert into public.clientes(nombre,telefono,telefono_normalizado,telefono_verificado,ultimo_pedido_en)
      values(trim(p.cliente),telefono,norm,true,p.creado_en)
      returning * into destino;
    end if;
    update public.piloto_pedidos set cliente_id=destino.id,telefono=telefono where id=p.id;
    insert into public.cliente_eventos(cliente_id,pedido_id,tipo,anterior,nuevo,actor)
    values(destino.id,p.id,'telefono_corregido',p.telefono,telefono,auth.uid());
  elsif destino.id is not null and destino.id<>origen.id then
    anterior:=origen.telefono;
    update public.piloto_pedidos set cliente_id=destino.id where cliente_id=origen.id;
    update public.piloto_pedidos set telefono=telefono where id=p.id;
    update public.clientes
      set nombre=case when trim(coalesce(p.cliente,''))<>'' then trim(p.cliente) else nombre end,
          telefono=telefono,
          telefono_verificado=true,
          actualizado_en=now(),
          ultimo_pedido_en=greatest(coalesce(ultimo_pedido_en,'epoch'::timestamptz),coalesce(origen.ultimo_pedido_en,'epoch'::timestamptz))
      where id=destino.id
      returning * into destino;
    insert into public.cliente_eventos(cliente_id,pedido_id,tipo,anterior,nuevo,actor)
    values(destino.id,p.id,'clientes_fusionados',anterior,telefono,auth.uid());
    delete from public.clientes where id=origen.id;
  else
    anterior:=origen.telefono;
    update public.clientes
      set telefono=telefono,telefono_normalizado=norm,telefono_verificado=true,actualizado_en=now()
      where id=origen.id
      returning * into destino;
    update public.piloto_pedidos set telefono=telefono where id=p.id;
    insert into public.cliente_eventos(cliente_id,pedido_id,tipo,anterior,nuevo,actor)
    values(destino.id,p.id,'telefono_corregido',anterior,telefono,auth.uid());
  end if;

  return jsonb_build_object('id',destino.id,'telefono',destino.telefono,'telefono_verificado',destino.telefono_verificado);
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_telefono_corregir_cliente(cliente uuid, telefono text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  c public.clientes;
  existente public.clientes;
  norm text;
  anterior text;
begin
  if not public.piloto_es_admin() then
    raise exception 'Solo administración/recepción.' using errcode='42501';
  end if;

  norm:=public.cliente_telefono_normalizar(telefono);
  if norm='' then
    raise exception 'Escribe un teléfono válido de 10 a 15 dígitos.';
  end if;

  select * into c from public.clientes where id=cliente for update;
  if not found then raise exception 'Cliente no encontrado.'; end if;

  select * into existente
  from public.clientes
  where telefono_normalizado=norm and id<>c.id
  limit 1;

  if existente.id is not null then
    raise exception 'Ese teléfono ya pertenece a otro cliente. Revisa antes de guardar para no mezclar historiales.';
  end if;

  anterior:=c.telefono;

  update public.clientes
  set telefono=cliente_telefono_corregir_cliente.telefono,
      telefono_normalizado=norm,
      telefono_verificado=true,
      actualizado_en=now()
  where id=c.id
  returning * into c;

  insert into public.cliente_eventos(cliente_id,pedido_id,tipo,anterior,nuevo,actor)
  values(c.id,null,'telefono_corregido',anterior,telefono,auth.uid());

  return jsonb_build_object(
    'id',c.id,
    'telefono',c.telefono,
    'telefono_verificado',c.telefono_verificado
  );
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_telefono_verificar(pedido uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.piloto_pedidos; c public.clientes;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  select * into p from public.piloto_pedidos where id=pedido;
  if p.id is null or p.cliente_id is null then raise exception 'Este pedido no tiene un cliente vinculado.'; end if;
  update public.clientes set telefono_verificado=true,actualizado_en=now() where id=p.cliente_id returning * into c;
  insert into public.cliente_eventos(cliente_id,pedido_id,tipo,anterior,nuevo,actor)
  values(c.id,p.id,'telefono_verificado',c.telefono,c.telefono,auth.uid());
  return jsonb_build_object('id',c.id,'telefono',c.telefono,'telefono_verificado',true);
end
$function$
;
CREATE OR REPLACE FUNCTION public.piloto_config_pago_guardar(configuracion jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare c jsonb;n text;begin
 if not coalesce(public.piloto_es_admin(),false) then raise exception 'Solo recepción autorizada.' using errcode='42501';end if;
 if configuracion is null or jsonb_typeof(configuracion)<>'object' or octet_length(configuracion::text)>2000 or jsonb_typeof(configuracion->'prueba') is distinct from 'boolean' then raise exception 'Revisa los datos de transferencia.';end if;
 n:=regexp_replace(configuracion->>'numero','[ -]','','g');
 if char_length(trim(coalesce(configuracion->>'banco',''))) not between 1 and 100 or char_length(trim(coalesce(configuracion->>'titular',''))) not between 1 and 120 or n is null or n !~ '^[0-9]{10,18}$' or (configuracion->>'prueba'='false' and n ~ '^0+$') then raise exception 'Revisa banco, titular y número de 10 a 18 dígitos. La cuenta de ceros es solo de prueba.';end if;
 c:=jsonb_build_object('banco',trim(configuracion->>'banco'),'numero',n,'titular',trim(configuracion->>'titular'),'prueba',(configuracion->>'prueba')::boolean);
 update public.piloto_configuracion_pago set configuracion=c,actualizado_en=now(),actualizado_por=auth.uid() where id;return c;
end$function$
;
CREATE OR REPLACE FUNCTION public.piloto_pedido_cerrar_recepcion(pedido uuid, version integer, repartidor uuid DEFAULT NULL::uuid, efectivo_recibido boolean DEFAULT false, nota text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.piloto_pedidos;
declare r public.piloto_repartidores;
begin
  if not public.piloto_es_admin() then raise exception 'Solo administración/recepción.' using errcode='42501'; end if;
  select * into p from public.piloto_pedidos where id=pedido for update;
  if not found then raise exception 'Pedido no encontrado.'; end if;
  if p.revision<>version then raise exception 'El pedido cambió. Actualiza antes de continuar.'; end if;
  if p.estado in ('entregado','cancelado') then raise exception 'Este pedido ya está cerrado.'; end if;
  if p.requiere_whatsapp and not p.whatsapp_confirmado then raise exception 'Primero confirma que recibiste el WhatsApp con este folio.'; end if;
  if not p.aceptado then raise exception 'Primero registra que el cliente aceptó el total.'; end if;
  if p.pago='transferencia' and not p.pago_verificado then raise exception 'Primero verifica la transferencia.'; end if;
  if p.pago='efectivo' and not coalesce(efectivo_recibido,false) then raise exception 'Confirma que se recibió el efectivo completo.'; end if;

  if repartidor is not null then
    select * into r from public.piloto_repartidores where id=repartidor;
    if not found then raise exception 'Repartidor no encontrado.'; end if;
    p.repartidor_id:=r.id;
  end if;

  p.efectivo_recibido:=case when p.pago='efectivo' then true else p.efectivo_recibido end;
  p.estado:='entregado';p.entregado_en:=now();p.terminado_en:=now();p.revision:=p.revision+1;
  update public.piloto_pedidos
  set repartidor_id=p.repartidor_id,efectivo_recibido=p.efectivo_recibido,estado=p.estado,
      entregado_en=p.entregado_en,terminado_en=p.terminado_en,revision=p.revision
  where id=p.id;

  perform public.piloto_promocion_consumir_interna(p.id);
  update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;
  insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision,datos)
  values(p.id,auth.uid(),'cierre_recepcion',p.estado,p.revision,jsonb_build_object(
    'repartidor_id',p.repartidor_id,'nota',left(trim(coalesce(nota,'')),500),'cierre_manual',true
  ));
  return to_jsonb(p);
end
$function$
;
CREATE OR REPLACE FUNCTION public.piloto_repartidor_contacto_guardar(repartidor uuid, nombre text, telefono text, disponible boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare rid uuid;t text:=regexp_replace(coalesce(telefono,''),'[^0-9]','','g');begin
 if not coalesce(public.piloto_es_admin(),false) then raise exception 'Solo recepción autorizada.' using errcode='42501';end if;
 if length(t)=10 then t:='52'||t;end if;
 if t !~ '^[1-9][0-9]{7,14}$' then raise exception 'Escribe 10 dígitos para México, o el número internacional con código de país.';end if;
 rid:=public.piloto_repartidor_guardar(repartidor,nombre,disponible);
 update public.piloto_repartidores set telefono=t where id=rid;return rid;
end$function$
;
CREATE OR REPLACE FUNCTION public.piloto_operacion_listar()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not public.piloto_es_operador() then raise exception 'Solo administración/recepción.' using errcode='42501';end if;
 return jsonb_build_object(
   'pedidos',(
     select coalesce(jsonb_agg(
       to_jsonb(p) || jsonb_build_object(
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
end
$function$
;
CREATE OR REPLACE FUNCTION public.cliente_telefono_verificar_cliente(cliente uuid, telefono_esperado text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
declare c public.clientes;
begin
 if auth.uid() is null or not public.piloto_es_admin() then raise exception 'Solo administración.' using errcode='42501'; end if;
 select * into c from public.clientes where id=cliente for update;
 if not found then raise exception 'Cliente no encontrado.'; end if;
 if c.telefono is distinct from telefono_esperado then raise exception 'El teléfono cambió. Actualiza Clientes.'; end if;
 if public.cliente_telefono_normalizar(c.telefono)='' then raise exception 'Corrige primero el teléfono.'; end if;
 update public.clientes set telefono_verificado=true,actualizado_en=now() where id=c.id;
 insert into public.cliente_eventos(cliente_id,pedido_id,tipo,anterior,nuevo,actor)
 values(c.id,null,'telefono_verificado',c.telefono,c.telefono,auth.uid());
 return jsonb_build_object('id',c.id,'telefono_verificado',true);
end $fn$;
REVOKE ALL ON FUNCTION public.cliente_telefono_verificar_cliente(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cliente_telefono_verificar_cliente(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.piloto_pedido_finalizar_admin(pedido uuid, version integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
declare p public.piloto_pedidos; previo text;
begin
 if auth.uid() is null or not public.piloto_es_admin() then raise exception 'Solo administración.' using errcode='42501'; end if;
 select * into p from public.piloto_pedidos where id=pedido for update;
 if not found then raise exception 'Pedido no encontrado.'; end if;
 if version is null or p.revision<>version then raise exception 'El pedido cambió. Actualiza antes de finalizar.'; end if;
 if p.estado in ('entregado','cancelado') then raise exception 'El pedido ya está cerrado.'; end if;
 previo:=p.estado;
 update public.piloto_pedidos set estado='entregado',aceptado=true,respuesta_cliente='',
 pago_verificado=(p.pago='transferencia'),efectivo_recibido=(p.pago='efectivo'),
 entregado_en=now(),terminado_en=now(),revision=revision+1 where id=p.id returning * into p;
 perform public.piloto_promocion_consumir_interna(p.id);
 update public.piloto_reparto_enlaces set activo=false where pedido_id=p.id;
 update public.piloto_confirmaciones_cliente set vence=now() where pedido_id=p.id;
 insert into public.piloto_pedido_eventos(pedido_id,actor,accion,estado,revision,datos)
 values(p.id,auth.uid(),'finalizar_admin',p.estado,p.revision,jsonb_build_object('estado_anterior',previo,'pago',p.pago,'entrega_y_cobro_confirmados',true));
 return to_jsonb(p);
end $fn$;
REVOKE ALL ON FUNCTION public.piloto_pedido_finalizar_admin(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.piloto_pedido_finalizar_admin(uuid,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.menu_validar_ficha_avanzada(ficha jsonb, anterior jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
declare foto jsonb; seccion jsonb; ruta text; src text;
begin
 if ficha is null then return; end if;
 if jsonb_typeof(ficha)<>'object' or octet_length(ficha::text)>30000
 or jsonb_typeof(ficha->'activa') is distinct from 'boolean'
 or jsonb_typeof(ficha->'fotos') is distinct from 'array'
 or jsonb_typeof(ficha->'secciones') is distinct from 'array' then raise exception 'Ficha avanzada inválida.';end if;
 if jsonb_array_length(ficha->'fotos')>4 or jsonb_array_length(ficha->'secciones')>5 then raise exception 'Máximo 4 fotos y 5 pestañas.';end if;
 if (select count(distinct value) from jsonb_array_elements(ficha->'fotos'))<>jsonb_array_length(ficha->'fotos') then raise exception 'No repitas fotos.';end if;
 for foto in select value from jsonb_array_elements(ficha->'fotos') loop
  if jsonb_typeof(foto)<>'string' then raise exception 'Foto inválida.';end if;
  src:=foto#>>'{}';
  if src=coalesce(anterior->>'foto','') or coalesce(anterior#>'{fichaAvanzada,fotos}','[]'::jsonb) @> jsonb_build_array(src) then continue;end if;
  if src not like 'https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/%' then raise exception 'Sube la foto desde el panel.';end if;
  ruta:=substr(src,length('https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/')+1);
  if split_part(ruta,'/',1)<>auth.uid()::text or ruta !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$' or not exists(select 1 from storage.objects where bucket_id='menu-publico' and name=ruta and metadata->>'mimetype'='image/webp') then raise exception 'La foto no pertenece a tu cuenta o no está cargada.';end if;
 end loop;
 for seccion in select value from jsonb_array_elements(ficha->'secciones') loop
  if jsonb_typeof(seccion)<>'object' or jsonb_typeof(seccion->'titulo') is distinct from 'string' or jsonb_typeof(seccion->'contenido') is distinct from 'string' or char_length(trim(seccion->>'titulo')) not between 1 and 60 or char_length(trim(seccion->>'contenido')) not between 1 and 4000 then raise exception 'Revisa título y contenido de las pestañas.';end if;
 end loop;
 if (select count(distinct lower(value->>'titulo')) from jsonb_array_elements(ficha->'secciones'))<>jsonb_array_length(ficha->'secciones') then raise exception 'No repitas pestañas.';end if;
end $fn$;
REVOKE ALL ON FUNCTION public.menu_validar_ficha_avanzada(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.menu_producto_crear(negocio text, version integer, producto uuid, datos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.piloto_menus_completos;nuevo jsonb;previo jsonb;foto text;ruta text;begin
 if not public.dueno_permitido_v53(negocio) then raise exception 'Solo administracion agrega productos.' using errcode='42501';end if;
 if producto is null or datos is null or jsonb_typeof(datos)<>'object' or octet_length(datos::text)>50000 or exists(select 1 from jsonb_object_keys(datos) k where k not in ('nombre','precio','ingredientes','disponible','foto','seccion','enCarrusel','gruposOpciones','extras','publicidad','fichaAvanzada')) then raise exception 'Datos invalidos.';end if;
 if char_length(trim(coalesce(datos->>'nombre',''))) not between 1 and 120 or char_length(coalesce(datos->>'ingredientes',''))>4000 or char_length(coalesce(datos->>'seccion',''))>80 or jsonb_typeof(datos->'precio') is distinct from 'number' or (datos->>'precio')::numeric not between 0 and 100000 or round((datos->>'precio')::numeric,2)<>(datos->>'precio')::numeric or jsonb_typeof(datos->'disponible') is distinct from 'boolean' then raise exception 'Revisa nombre, precio, descripcion y seccion.';end if;
 foto:=coalesce(datos->>'foto','');
 if foto<>'' then
 if foto not like 'https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/%' then raise exception 'Selecciona una foto desde el panel.';end if;
 ruta:=substr(foto,length('https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/')+1);
 if split_part(ruta,'/',1)<>auth.uid()::text or ruta !~ '^[a-f0-9-]+/[a-f0-9-]+\.webp$' or not exists(select 1 from storage.objects where bucket_id='menu-publico' and name=ruta and metadata->>'mimetype'='image/webp') then raise exception 'La foto no esta cargada o no pertenece a esta cuenta.';end if;
 end if;
 nuevo:=jsonb_build_object('id',producto::text,'nombre',trim(datos->>'nombre'),'precio',datos->'precio','ingredientes',coalesce(datos->>'ingredientes',''),'foto',foto,'seccion',trim(coalesce(datos->>'seccion','')),'disponible',datos->'disponible','enCarrusel',false,'gruposOpciones',coalesce(datos->'gruposOpciones','[]'::jsonb),'extras',coalesce(datos->'extras','[]'::jsonb));
 perform public.menu_validar_ficha_avanzada(datos->'fichaAvanzada');
 if datos ? 'fichaAvanzada' then nuevo:=jsonb_set(nuevo,'{fichaAvanzada}',datos->'fichaAvanzada');end if;
 perform public.menu_validar_elecciones(nuevo);
 select * into m from public.piloto_menus_completos where slug=negocio for update;
 if not found then raise exception 'Negocio inexistente.';end if;
 if not coalesce(public.piloto_es_admin(),false) then datos:=jsonb_set(datos,'{publicidad}',coalesce(datos->'publicidad','{}')||jsonb_build_object('enCarrusel',false));end if;
 nuevo:=public.menu_aplicar_publicidad(nuevo,datos->'publicidad',m.plan);
 select value into previo from jsonb_array_elements(m.original->'productos') where value->>'id'=producto::text;
 if previo is not null then
 if previo=nuevo then return jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);end if;
 raise exception 'Este producto ya existe. Actualiza el menu.';
 end if;
 if version is null or version<>m.revision then raise exception 'El menu cambio. Actualiza antes de crear.';end if;
 if jsonb_array_length(m.original->'productos')>=500 then raise exception 'Este menu alcanzo 500 productos.';end if;
 update public.piloto_menus_completos set original=jsonb_set(original,'{productos}',coalesce(original->'productos','[]'::jsonb)||jsonb_build_array(nuevo)),borrador=jsonb_set(borrador,'{productos}',coalesce(borrador->'productos','[]'::jsonb)||jsonb_build_array(nuevo)),revision=revision+1,actualizado_en=now() where slug=negocio returning * into m;
 insert into public.menu_productos_publicados values(negocio,producto::text,nuevo,now(),auth.uid(),m.revision);
 insert into public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) values(negocio,producto::text,'{}'::jsonb,nuevo,auth.uid());
 return jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);
end$function$
;
CREATE OR REPLACE FUNCTION public.menu_producto_publicar(negocio text, version integer, producto text, cambios jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.piloto_menus_completos;indice int;previo jsonb;nuevo jsonb;nuevo_borrador jsonb;foto text;ruta text;gi int;oi int;g jsonb;o jsonb;promo_previa jsonb;
begin
 if not public.dueno_permitido_v53(negocio) then raise exception 'Solo administraciÃƒÂ³n publica el menÃƒÂº.' using errcode='42501';end if;
 if cambios is null or jsonb_typeof(cambios)<>'object' or octet_length(cambios::text)>40000 then raise exception 'Cambios invÃƒÂ¡lidos.';end if;
 select * into m from public.piloto_menus_completos where slug=negocio for update;
 if not found then raise exception 'Negocio inexistente.';end if;
 select (ordinality-1)::int,value into indice,previo from jsonb_array_elements(m.original->'productos') with ordinality where value->>'id'=producto;
 if previo is null then raise exception 'Producto inexistente.';end if;
 if previo->>'eliminado'='true' then raise exception 'Restaura el producto antes de editarlo.';end if;
 foto:=coalesce(cambios->>'foto',previo->>'foto','');
 if foto<>coalesce(previo->>'foto','') and foto<>'' then
 if foto not like 'https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/%' then raise exception 'Selecciona una foto desde el panel.';end if;
 ruta:=substr(foto,length('https://gyvoyzxsgckpfkagzjtf.supabase.co/storage/v1/object/public/menu-publico/')+1);
 if split_part(ruta,'/',1)<>auth.uid()::text or ruta !~ '^[a-f0-9-]+/[a-f0-9-]+\.webp$' or not exists(select 1 from storage.objects where bucket_id='menu-publico' and name=ruta and metadata->>'mimetype'='image/webp') then raise exception 'La imagen no estÃƒÂ¡ cargada o no pertenece a esta cuenta.';end if;
 end if;
 if cambios ? 'seccion' and (jsonb_typeof(cambios->'seccion')<>'string' or char_length(cambios->>'seccion')>80) then raise exception 'Revisa la seccion.';end if;
 if not coalesce(public.piloto_es_admin(),false) then cambios:=jsonb_set(cambios,'{publicidad}',coalesce(cambios->'publicidad','{}')||jsonb_build_object('enCarrusel',coalesce(previo->'enCarrusel','false')));end if;
 perform public.menu_validar_ficha_avanzada(cambios->'fichaAvanzada',previo);
 perform public.piloto_menu_producto_guardar(negocio,version,producto,cambios-array['foto','seccion','publicidad','fichaAvanzada']);
 select * into m from public.piloto_menus_completos where slug=negocio;
 select value into nuevo from jsonb_array_elements(m.borrador->'productos') where value->>'id'=producto;
 -- Existing promotions stay published as they were; old trial drafts are never released incidentally.
 if cambios ? 'seccion' then nuevo:=jsonb_set(nuevo,'{seccion}',to_jsonb(trim(cambios->>'seccion')));end if;
 nuevo:=jsonb_set(nuevo,'{foto}',to_jsonb(foto));
 if cambios ? 'fichaAvanzada' then nuevo:=jsonb_set(nuevo,'{fichaAvanzada}',cambios->'fichaAvanzada');elsif previo ? 'fichaAvanzada' then nuevo:=jsonb_set(nuevo,'{fichaAvanzada}',previo->'fichaAvanzada');end if;
 nuevo_borrador:=nuevo;
 if previo ? 'promocion' then nuevo:=jsonb_set(nuevo,'{promocion}',previo->'promocion');else nuevo:=nuevo-'promocion';end if;
 for gi,g in select (ordinality-1)::int,value from jsonb_array_elements(nuevo->'gruposOpciones') with ordinality loop
 for oi,o in select (ordinality-1)::int,value from jsonb_array_elements(g->'opciones') with ordinality loop
 select b->'promocion' into promo_previa from jsonb_array_elements(previo->'gruposOpciones') a cross join lateral jsonb_array_elements(a->'opciones') b where a->>'id'=g->>'id' and b->>'id'=o->>'id';
 if promo_previa is not null then o:=jsonb_set(o,'{promocion}',promo_previa);else o:=o-'promocion';end if;
 nuevo:=jsonb_set(nuevo,array['gruposOpciones',gi::text,'opciones',oi::text],o);
 end loop;
 end loop;
 nuevo:=public.menu_aplicar_publicidad(nuevo,cambios->'publicidad',m.plan);
 nuevo_borrador:=jsonb_set(nuevo_borrador,'{enCarrusel}',coalesce(nuevo->'enCarrusel','false'::jsonb));
 if cambios#>'{publicidad,promocion}' is not null then nuevo_borrador:=nuevo;end if;
 update public.piloto_menus_completos set original=jsonb_set(original,array['productos',indice::text],nuevo),
 borrador=jsonb_set(borrador,array['productos',indice::text],nuevo_borrador) where slug=negocio;
 insert into public.menu_productos_publicados values(negocio,producto,nuevo,now(),auth.uid(),m.revision)
 on conflict on constraint menu_productos_publicados_pkey do update set contenido=excluded.contenido,publicado_en=excluded.publicado_en,publicado_por=excluded.publicado_por,revision=excluded.revision;
 insert into public.menu_publicacion_historial(negocio,producto,anterior,nuevo,actor) values(negocio,producto,previo,nuevo,auth.uid());
 return jsonb_build_object('producto',producto,'revision',m.revision,'publicado',true);
end$function$
;
CREATE OR REPLACE FUNCTION public.piloto_repartidor_guardar(repartidor uuid, nombre text, disponible boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare rid uuid;begin
 if not public.piloto_es_operador() then raise exception 'Solo administración.' using errcode='42501';end if;
 if not public.piloto_es_admin() and (repartidor is null or not exists(select 1 from public.piloto_repartidores r where r.id=repartidor and r.nombre=trim(piloto_repartidor_guardar.nombre))) then raise exception 'Solo administración modifica el equipo.' using errcode='42501';end if;
 if char_length(trim(nombre)) not between 1 and 100 then raise exception 'Escribe un nombre válido.';end if;
 if repartidor is null then insert into public.piloto_repartidores(nombre,disponible) values(trim(nombre),disponible) returning id into rid;
 else
 perform 1 from public.piloto_repartidores where id=repartidor for update;
 if not found then raise exception 'Repartidor no encontrado.';end if;
 if not disponible and exists(select 1 from public.piloto_pedidos where repartidor_id=repartidor and estado in ('propuesto','asignado','recogido')) then raise exception 'Tiene un trabajo activo. Resuélvelo antes de ponerlo fuera de servicio.';end if;
 update public.piloto_repartidores set nombre=trim(piloto_repartidor_guardar.nombre),disponible=piloto_repartidor_guardar.disponible where id=repartidor returning id into rid;end if;return rid;
end$function$
;
