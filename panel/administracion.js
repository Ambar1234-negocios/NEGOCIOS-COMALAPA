'use strict';
async function cargarResumenMaestro(){const zona=el('resumen-maestro');zona.replaceChildren();await api('/rest/v1/rpc/piloto_admin_listar',{method:'POST',datos:{}});const consultas=await Promise.allSettled([api('/rest/v1/piloto_menus_completos?select=slug'),api('/rest/v1/piloto_revision?estado=eq.pendiente&select=entidad_id'),api('/rest/v1/rpc/piloto_operacion_listar',{method:'POST',datos:{}}),api('/rest/v1/rpc/admin_promociones_negocio_listar',{method:'POST',datos:{}})]);const etiquetas=['Menús completos importados','Revisiones pendientes · piloto anterior','Solicitudes en proceso','🔔 Promociones de negocios pendientes'];consultas.forEach((r,i)=>{const card=nodo('section',undefined,'tarjeta');card.append(nodo('h3',etiquetas[i]));if(r.status==='fulfilled'){const n=i===2?r.value.pedidos.filter(p=>!['entregado','cancelado'].includes(p.estado)).length:i===3?r.value.filter(p=>p.estado==='pendiente').length:r.value.length;card.append(nodo('strong',String(n),'numero-maestro'));}else card.append(nodo('p','No se pudo consultar. Actualiza para reintentar.'));zona.append(card);});await Promise.all([cargarAccesos(),cargarPromocionesNegociosAdmin(),cargarPromocionesDirectasAdmin(),cargarPromoGlobalMaestro()]);aviso('Resumen actualizado desde Supabase.');}
el('login').onsubmit=e=>{e.preventDefault();tarea(async()=>{cuenta=await api('/auth/v1/token?grant_type=password',{method:'POST',datos:{email:el('correo').value.trim(),password:el('clave').value}});el('clave').value='';sessionStorage.setItem('exhibicionPilotoSesion',JSON.stringify(cuenta));mostrar();await cargarResumenMaestro();});};el('recargar').onclick=()=>tarea(cargarResumenMaestro);el('salir').onclick=()=>tarea(async()=>{try{await api('/auth/v1/logout',{method:'POST'})}finally{cuenta=null;sessionStorage.removeItem('exhibicionPilotoSesion');el('resumen-maestro').replaceChildren();mostrar();aviso('Sesión cerrada.');}});try{const s=JSON.parse(sessionStorage.getItem('exhibicionPilotoSesion'));if(s?.expires_at*1000>Date.now())cuenta=s;}catch{}mostrar();if(cuenta)tarea(cargarResumenMaestro);

async function cargarAccesos(){const lista=await api('/rest/v1/rpc/piloto_accesos_listar',{method:'POST',datos:{}}),zona=el('lista-accesos');zona.replaceChildren(nodo('h4','Cuentas de recepción'));if(!lista.length)zona.append(nodo('p','Todavía no hay cuentas autorizadas.'));for(const a of lista){const tarjeta=nodo('div',undefined,'tarjeta');tarjeta.append(nodo('strong',a.correo),nodo('p',a.activo?'🟢 Recepción autorizada':'🔴 Recepción desactivada'));const b=nodo('button',a.activo?'🔴 Desactivar acceso':'🟢 Reactivar acceso');b.type='button';b.onclick=()=>{el('correo-acceso').value=a.correo;el('estado-acceso').value=String(!a.activo);el('correo-acceso').focus();aviso('Revisa el correo y pulsa Guardar permiso para confirmar el cambio.');};tarjeta.append(b);zona.append(tarjeta);}}
el('form-acceso-recepcion').onsubmit=e=>{e.preventDefault();tarea(async()=>{const correo=el('correo-acceso').value.trim(),activo=el('estado-acceso').value==='true';if(!confirm((activo?'Autorizar':'Desactivar')+' recepción para '+correo+'? '+(activo?'Podrá ver datos de contacto, direcciones y pedidos, y registrar acciones de operación.':'Se bloquearán sus próximas consultas y acciones de recepción.')))return;await api('/rest/v1/rpc/piloto_acceso_recepcion_guardar',{method:'POST',datos:{correo,activo}});await cargarAccesos();aviso(activo?'Cuenta autorizada para recepción. Ya puede iniciar sesión.':'Acceso de recepción desactivado.');});};

async function cargarPromocionesNegociosAdmin(){
  const zona=el('lista-promociones-negocios'),conteo=el('conteo-promociones-negocios');if(!zona)return;
  const lista=await api('/rest/v1/rpc/admin_promociones_negocio_listar',{method:'POST',datos:{}});
  const pendientes=lista.filter(x=>x.estado==='pendiente');conteo.textContent='Pendientes de revisión: '+pendientes.length;
  zona.replaceChildren();
  if(!pendientes.length){zona.append(nodo('p','No hay promociones pendientes.','nota'));return;}
  for(const p of pendientes){
    const card=nodo('article',undefined,'tarjeta');
    const beneficio=p.tipo==='envio_gratis'?'Envío gratis':p.tipo==='porcentaje'?Number(p.valor)+'% de descuento':p.tipo==='monto'?'$'+Number(p.valor).toFixed(2)+' de descuento':'Promoción general';
    card.append(nodo('strong',p.negocio_nombre+' · '+p.titulo),nodo('p','🎁 '+beneficio),nodo('p',p.detalle),nodo('small',p.vigencia_hasta?'Válida hasta '+p.vigencia_hasta:'Sin fecha de vencimiento'));
    const acciones=nodo('div',undefined,'acciones-dueno');
    const aprobar=nodo('button','✅ Aprobar y crear campaña');aprobar.type='button';
    aprobar.onclick=()=>{if(!confirm('¿Aprobar esta promoción y crear la campaña para clientes elegibles?'))return;tarea(async()=>{await api('/rest/v1/rpc/admin_promocion_negocio_revisar',{method:'POST',datos:{solicitud:p.id,aprobar:true,nota:''}});await cargarPromocionesNegociosAdmin();aviso('Promoción aprobada. Ya está disponible como campaña en Recepción → Promociones.');});};
    const rechazar=nodo('button','🔴 Rechazar','secundario');rechazar.type='button';
    rechazar.onclick=()=>{const nota=prompt('Motivo o nota para el negocio (opcional):','')??null;if(nota===null)return;tarea(async()=>{await api('/rest/v1/rpc/admin_promocion_negocio_revisar',{method:'POST',datos:{solicitud:p.id,aprobar:false,nota}});await cargarPromocionesNegociosAdmin();aviso('Promoción rechazada.');});};
    acciones.append(aprobar,rechazar);card.append(acciones);zona.append(card);
  }
}


const pesosPromo=v=>Math.round(Number(v||0)*100);
function actualizarValorPromoDirecta(){
  const t=el('promo-directa-tipo')?.value,z=el('promo-directa-valor-zona'),v=el('promo-directa-valor');
  if(!z||!v)return;
  const requiere=t==='porcentaje_envio'||t==='monto_envio';
  z.hidden=!requiere;v.required=requiere;
  if(t==='porcentaje_envio'){v.max='100';v.placeholder='Ej. 50';}
  else{v.removeAttribute('max');v.placeholder='Ej. 20';}
}
function actualizarCondicionPromoDirecta(){
  const t=el('promo-condicion-tipo')?.value,m=el('promo-condicion-monto-zona'),q=el('promo-condicion-cantidad-zona');
  if(!m||!q)return;
  m.hidden=t!=='monto_minimo';
  q.hidden=!['cantidad_producto','cantidad_categoria'].includes(t);
  if(el('promo-condicion-producto'))el('promo-condicion-producto').closest('label').hidden=t!=='cantidad_producto';
  if(el('promo-condicion-categoria'))el('promo-condicion-categoria').closest('label').hidden=t!=='cantidad_categoria';
}
let promocionDirectaEditando=null;
function llenarFormularioPromoDirecta(p){
  const select=el('promo-directa-negocio');
  promocionDirectaEditando=p?.id||null;
  if(p){
    if([...select.options].some(o=>o.value===p.negocio_slug))select.value=p.negocio_slug;
    el('promo-directa-titulo').value=p.titulo||'';
    el('promo-directa-tipo').value=p.promo_tipo||'general';
    el('promo-directa-valor').value=p.promo_valor??'';
    el('promo-aporte-exhibicion').value=Number(p.aporte_exhibicion_centavos||0)/100;
    el('promo-presupuesto-exhibicion').value=p.presupuesto_exhibicion_centavos==null?'':Number(p.presupuesto_exhibicion_centavos)/100;
    el('promo-aporte-negocio').value=Number(p.aporte_negocio_centavos||0)/100;
    el('promo-presupuesto-negocio').value=p.presupuesto_negocio_centavos==null?'':Number(p.presupuesto_negocio_centavos)/100;
    el('promo-directa-max-usos').value=p.max_usos??'';
    el('promo-directa-vigencia').value=p.vigencia_hasta||'';
    el('promo-directa-local').checked=p.solo_zona_local!==false;
    el('promo-condicion-tipo').value=p.condicion_tipo||'ninguna';
    el('promo-condicion-monto').value=p.condicion_monto_centavos==null?'':Number(p.condicion_monto_centavos)/100;
    el('promo-condicion-cantidad').value=p.condicion_cantidad??'';
    el('promo-condicion-producto').value=p.condicion_producto_id||'';
    el('promo-condicion-categoria').value=p.condicion_categoria||'';
    el('promo-premio-texto').value=p.premio_texto||'';
    el('promo-terminos-publicos').value=p.terminos_publicos||'';
    el('promo-directa-guardar').textContent='💾 Guardar cambios';
    el('promo-directa-cancelar').hidden=false;
    actualizarValorPromoDirecta();
    actualizarCondicionPromoDirecta();
    const detalle=el('form-promocion-directa').closest('details');if(detalle)detalle.open=true;
    el('form-promocion-directa').scrollIntoView({behavior:'smooth',block:'start'});
  }else{
    el('form-promocion-directa').reset();
    el('promo-directa-tipo').value='porcentaje_envio';
    el('promo-directa-valor').value='50';
    el('promo-aporte-exhibicion').value='10';
    el('promo-presupuesto-exhibicion').value='200';
    el('promo-aporte-negocio').value='10';
    el('promo-presupuesto-negocio').value='200';
    el('promo-directa-local').checked=true;
    el('promo-condicion-tipo').value='ninguna';
    el('promo-directa-guardar').textContent='🚀 Crear campaña';
    el('promo-directa-cancelar').hidden=true;
    actualizarValorPromoDirecta();
    actualizarCondicionPromoDirecta();
  }
}
async function cargarPromocionesDirectasAdmin(){
  const select=el('promo-directa-negocio'),zona=el('lista-promociones-directas');if(!select||!zona)return;
  const [menus,promos]=await Promise.all([
    api('/rest/v1/piloto_menus_completos?select=slug,borrador&order=slug.asc'),
    api('/rest/v1/rpc/promociones_operativas_listar',{method:'POST',datos:{}})
  ]);
  const actual=select.value;
  select.replaceChildren();
  const m=nodo('option','🛵 Mandaditos');m.value='__mandaditos__';m.dataset.nombre='Mandaditos';select.append(m);
  for(const x of menus){
    const nombre=x.borrador?.nombre||x.slug,o=nodo('option',nombre);o.value=x.slug;o.dataset.nombre=nombre;select.append(o);
  }
  if([...select.options].some(o=>o.value===actual))select.value=actual;
  zona.replaceChildren();
  const lista=promos.filter(p=>p.negocio_slug||p.aporte_exhibicion_centavos||p.aporte_negocio_centavos);
  if(!lista.length){zona.append(nodo('p','No hay campañas individuales. La promoción global de envío aparece arriba.','nota'));return;}
  for(const p of lista){
    const card=nodo('article',undefined,'tarjeta');
    const gastEx=Number(p.exhibicion_gastado_centavos||0),gastNeg=Number(p.negocio_gastado_centavos||0);
    const preEx=p.presupuesto_exhibicion_centavos,preNeg=p.presupuesto_negocio_centavos;
    card.append(nodo('strong',(p.negocio_nombre||'Promoción')+' · '+p.titulo),
      nodo('p','✅ Servicios completados: '+Number(p.usos_completados||0)+' · ⏳ Reservados: '+Number(p.usos_reservados||0)),
      nodo('p','Exhibición: '+dineroPromo(gastEx)+(preEx!=null?' de '+dineroPromo(preEx):'')+' · Negocio: '+dineroPromo(gastNeg)+(preNeg!=null?' de '+dineroPromo(preNeg):'')),
      nodo('small',(p.activa?'🟢 Activa':'🔴 Inactiva')+(p.vigencia_hasta?' · Hasta '+p.vigencia_hasta:'')));
    const acciones=nodo('div',undefined,'acciones-dueno');
    const editar=nodo('button','✏️ Editar','secundario');editar.type='button';editar.onclick=()=>llenarFormularioPromoDirecta(p);
    const estado=nodo('button',p.activa?'⏸️ Desactivar':'▶️ Reactivar','secundario');estado.type='button';
    estado.onclick=()=>{if(!confirm((p.activa?'¿Desactivar':'¿Reactivar')+' esta promoción?'))return;tarea(async()=>{await api('/rest/v1/rpc/admin_promocion_directa_estado',{method:'POST',datos:{campana:p.id,activa:!p.activa}});await cargarPromocionesDirectasAdmin();aviso(p.activa?'Promoción desactivada.':'Promoción reactivada.');});};
    const movimientos=Number(p.usos_completados||0)+Number(p.usos_reservados||0);
    const eliminar=nodo('button','🗑️ Eliminar','secundario');eliminar.type='button';eliminar.disabled=movimientos>0;
    if(movimientos>0)eliminar.title='Ya tiene movimientos; desactívala para conservar el historial.';
    eliminar.onclick=()=>{if(!confirm('¿Eliminar definitivamente esta promoción?'))return;tarea(async()=>{await api('/rest/v1/rpc/admin_promocion_directa_eliminar',{method:'POST',datos:{campana:p.id}});if(promocionDirectaEditando===p.id)llenarFormularioPromoDirecta(null);await cargarPromocionesDirectasAdmin();aviso('Promoción eliminada.');});};
    acciones.append(editar,estado,eliminar);card.append(acciones);zona.append(card);
  }
}
function dineroPromo(c){return '$'+new Intl.NumberFormat('es-MX',{minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(c||0)/100);}
if(el('promo-directa-tipo')){el('promo-directa-tipo').onchange=actualizarValorPromoDirecta;actualizarValorPromoDirecta();}
if(el('promo-condicion-tipo')){el('promo-condicion-tipo').onchange=actualizarCondicionPromoDirecta;actualizarCondicionPromoDirecta();}
if(el('form-promocion-directa'))el('form-promocion-directa').onsubmit=e=>{e.preventDefault();tarea(async()=>{
  const s=el('promo-directa-negocio'),op=s.options[s.selectedIndex],tipo=el('promo-directa-tipo').value;
  const datos={
    titulo:el('promo-directa-titulo').value.trim(),
    negocio_slug:s.value,
    negocio_nombre:op?.dataset?.nombre||op?.textContent||'',
    promo_tipo:tipo,
    promo_valor:(tipo==='porcentaje_envio'||tipo==='monto_envio')?Number(el('promo-directa-valor').value):null,
    aporte_exhibicion_centavos:pesosPromo(el('promo-aporte-exhibicion').value),
    aporte_negocio_centavos:pesosPromo(el('promo-aporte-negocio').value),
    presupuesto_exhibicion_centavos:el('promo-presupuesto-exhibicion').value===''?null:pesosPromo(el('promo-presupuesto-exhibicion').value),
    presupuesto_negocio_centavos:el('promo-presupuesto-negocio').value===''?null:pesosPromo(el('promo-presupuesto-negocio').value),
    max_usos:el('promo-directa-max-usos').value===''?null:Number(el('promo-directa-max-usos').value),
    vigencia_hasta:el('promo-directa-vigencia').value||null,
    solo_zona_local:el('promo-directa-local').checked
  };
  const editando=promocionDirectaEditando;
  if(!confirm(editando?'¿Guardar los cambios de esta promoción?':'¿Crear esta campaña y dejarla disponible para Recepción?'))return;
  const guardada=editando
    ? await api('/rest/v1/rpc/admin_promocion_directa_actualizar',{method:'POST',datos:{campana:editando,datos}})
    : await api('/rest/v1/rpc/admin_promocion_directa_guardar',{method:'POST',datos:{datos}});
  const condicionTipo=el('promo-condicion-tipo').value;
  await api('/rest/v1/rpc/admin_promocion_reglas_actualizar',{method:'POST',datos:{campana:editando||guardada.id,datos:{
    condicion_tipo:condicionTipo,
    condicion_monto_centavos:condicionTipo==='monto_minimo'?pesosPromo(el('promo-condicion-monto').value):null,
    condicion_cantidad:['cantidad_producto','cantidad_categoria'].includes(condicionTipo)?Number(el('promo-condicion-cantidad').value):null,
    condicion_producto_id:condicionTipo==='cantidad_producto'?el('promo-condicion-producto').value.trim():'',
    condicion_categoria:condicionTipo==='cantidad_categoria'?el('promo-condicion-categoria').value.trim():'',
    premio_texto:el('promo-premio-texto').value.trim(),
    terminos_publicos:el('promo-terminos-publicos').value.trim()
  }}});
  llenarFormularioPromoDirecta(null);await cargarPromocionesDirectasAdmin();
  aviso(editando?'Promoción actualizada.':'Campaña creada. Recepción ya puede aplicarla al cotizar.');
});};
if(el('promo-directa-cancelar'))el('promo-directa-cancelar').onclick=()=>{llenarFormularioPromoDirecta(null);aviso('Edición cancelada.');};

async function cargarPromoGlobalMaestro(){
 const destino=el('promocion-global-comida-maestro');if(!destino)return;
 try{
  const esAdmin=await api('/rest/v1/rpc/piloto_es_admin',{method:'POST',datos:{}});
  if(!esAdmin){destino.replaceChildren();return;}
  const fondo=await api('/rest/v1/rpc/exhibicion_fondo_estado',{method:'POST',datos:{}});
  pintarControlPromoComida({esAdmin:true,fondo,contenedor:'promocion-global-comida-maestro',recargar:cargarPromoGlobalMaestro,mostrarSaldo:true});
 }catch(e){destino.replaceChildren(nodo('p','No se pudo cargar la promoción global. '+e.message,'aviso'));const reintentar=nodo('button','Actualizar promoción global');reintentar.type='button';reintentar.onclick=()=>tarea(cargarPromoGlobalMaestro);destino.append(reintentar);}
}
