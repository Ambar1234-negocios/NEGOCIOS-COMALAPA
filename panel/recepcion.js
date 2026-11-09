'use strict';
const enlacesListos=new Map();
let configuracionPago=null,vistaHistorial=false,ultimoDiaOperacion=null;
let pedidos=[],riders=[],clientes=[],campanas=[],promocionesOperativas=[],campanaSeleccionada=null,pedidoSeleccionado=null,ejemploPendiente=null,edicionPendiente=false;
const invitacionesBeneficiosPreparadas=new Map();
const estadosPedido={pendiente:'📥 Pendiente de cotizar',cotizado:'💰 Cotizado',propuesto:'🛵 Esperando repartidor',asignado:'👍 Aceptado por repartidor',recogido:'🛵 En camino',preparando:'👨‍🍳 Preparando para recoger',listo_recoger:'📦 Listo para recoger',entregado:'✅ Entregado',cancelado:'🔴 Cancelado'};
const dineroOperacion=n=>'$'+new Intl.NumberFormat('es-MX',{minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)/100),totalPedido=p=>p.productos_centavos+p.servicio_centavos;
function tiempoOperacion(valor){const n=Number(valor),h=Math.floor(n/60),m=n%60;return h?(h+' '+(h===1?'hora':'horas')+(m?' y '+m+' '+(m===1?'minuto':'minutos'):'')):n+' '+(n===1?'minuto':'minutos');}
function diaOperacion(fecha){fecha=new Date(new Date(fecha).getTime()-3600000);const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(fecha)).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;}
function seleccionado(){return pedidos.find(p=>p.id===pedidoSeleccionado);}
function detalleLinea(l){return [l.cantidad+' × '+l.nombre+' · '+dineroOperacion(l.subtotal_centavos),...(l.opciones||[]).map(o=>'  '+(o.grupo?o.grupo+': ':'')+(o.nombre||o.opcion||'')),...(l.extras||[]).map(o=>'  + '+(o.nombre||'')),l.cupon?'  Cupón '+l.cupon+': descuento de '+dineroOperacion(l.descuento_centavos)+' ya incluido.':'',l.nota?'  Nota: '+l.nota:''].filter(Boolean).join('\n');}
function lineasMensaje(p){const grupos=new Map();for(const l of p.lineas){const nombre=l.negocio_nombre||(l.negocio&&!/^[a-f0-9-]{36}$/i.test(l.negocio)?l.negocio:'Negocio');if(!grupos.has(nombre))grupos.set(nombre,[]);grupos.get(nombre).push('• '+detalleLinea(l));}return Array.from(grupos,([n,ls])=>'🏪 *'+n+'*\n'+ls.join('\n')).join('\n');}
function fechaHoraComalapaInput(valor){
  if(!valor)return '';
  const z=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(valor)).map(x=>[x.type,x.value]));
  return z.year+'-'+z.month+'-'+z.day+'T'+z.hour+':'+z.minute;
}
function fechaHoraComalapaTexto(valor){
  if(!valor)return '';
  return new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(valor));
}
function minutosHasta(valor){return Math.round((new Date(valor).getTime()-Date.now())/60000);}
function textoAlertaEntrega(p){
  if(!p.entrega_programada_en)return '';
  const m=minutosHasta(p.entrega_programada_en);
  if(m<0)return '🔴 Tiempo vencido hace '+Math.abs(m)+' min · revisar pedido';
  if(m===0)return '🔴 Hora estimada de entrega ahora';
  if(m<=5)return '🟠 Avisa al repartidor · entrega en '+m+' min';
  return '🕒 Entrega estimada '+fechaHoraComalapaTexto(p.entrega_programada_en);
}
function pintarAlertasEntrega(){
  const zona=el('alertas-entrega');if(!zona)return;
  zona.replaceChildren();
  const activos=pedidos.filter(p=>p.entrega_programada_en&&!cerrado(p)&&minutosHasta(p.entrega_programada_en)<=5).sort((a,b)=>new Date(a.entrega_programada_en)-new Date(b.entrega_programada_en));
  zona.hidden=!activos.length;
  if(!activos.length){document.title='Recepción · Exhibición';return;}
  zona.append(nodo('h3','⏰ Entregas próximas · '+activos.length));
  for(const p of activos){
    const b=nodo('button',textoAlertaEntrega(p)+' · '+p.folio+' · '+p.cliente,minutosHasta(p.entrega_programada_en)<0?'alerta-entrega-vencida':'alerta-entrega-proxima');
    b.type='button';
    b.onclick=()=>tarea(async()=>{pedidoSeleccionado=p.id;el('filtro-pedidos').value='activas';activarPanel('operacion','vista-solicitudes');pintarLista();await pintarDetalle();});
    zona.append(b);
  }
  document.title='('+activos.length+') Recepción · Exhibición';
}
function formaPago(p){return p.pago==='efectivo'?'💵 Efectivo al recibir':p.pago_al_recibir?'📲 Transferencia al recibir':'🏦 Transferencia anticipada';}
function mensajeCotizacion(p){
  if(p.estado==='pendiente')return 'Primero guarda la cotización.';
  const base=Number(p.servicio_base_centavos||p.servicio_centavos||0),desc=Number(p.descuento_servicio_centavos||0);
  const desglose=['🛍️ Compra: '+dineroOperacion(p.productos_centavos)];
  if(desc>0)desglose.push('🛵 Mandadito normal: '+dineroOperacion(base),'🎁 Promoción: -'+dineroOperacion(desc),'🛵 Tú pagas de mandadito: '+dineroOperacion(p.servicio_centavos));
  else desglose.push('🛵 Servicio: '+dineroOperacion(p.servicio_centavos));
  desglose.push('✅ *Total: '+dineroOperacion(totalPedido(p))+'*');
  return ['🛵 *Exhibición Frontera Comalapa*','👋 ¡Hola, '+p.cliente+'!','🧾 *Folio: '+p.folio+'*','','📋 *Tu pedido*',p.lineas.length?lineasMensaje(p):p.detalle,'','💵 *Desglose*',...desglose,'','📍 *Entrega:* '+(p.entrega==='recoger'?'Recoges en el negocio, sin costo de envío.':p.direccion),'⏱️ *Tiempo:* '+tiempoOperacion(p.minutos)+' desde la confirmación.','💳 *Pago:* '+(p.pago==='efectivo'?'Efectivo al recibir.':p.pago_al_recibir?'Transferencia cuando llegue tu pedido. Recepción confirmará el pago antes de entregarlo.':'Deja tu pago listo por transferencia. Solicita los datos y espera la confirmación de recepción.'),...datosTransferencia(p),'','✅ *ACEPTO* / ❌ *RECHAZO*','Confírmanos tu respuesta por WhatsApp para continuar.' ].join('\n');
}
function mensajeRepartidor(p){
  const base=Number(p.servicio_base_centavos||p.servicio_centavos||0),desc=Number(p.descuento_servicio_centavos||0);
  const servicio=desc>0?['🛵 *Servicio real:* '+dineroOperacion(base),'🎁 *Promoción cubierta:* '+dineroOperacion(desc),'👤 *Cliente paga de envío:* '+dineroOperacion(p.servicio_centavos)]:['🛵 Servicio: '+dineroOperacion(p.servicio_centavos)];
  return ['🛵 *SOLICITUD DE REPARTO*','🧾 *Folio: '+p.folio+'*','','👤 *Cliente:* '+p.cliente,...(p.telefono?['📞 *Contacto:* '+p.telefono]:[]),'','📦 *Pedido para recoger*',p.lineas.length?lineasMensaje(p):p.detalle,'','📍 *Entregar en:* '+p.direccion,'','💵 *Desglose*','🛍️ Compra: '+dineroOperacion(p.productos_centavos),...servicio,'✅ *Total cliente: '+dineroOperacion(totalPedido(p))+'*','💳 *Pago:* '+(p.pago==='efectivo'?'Cobrar al cliente únicamente el total mostrado. La promoción se liquida aparte.':p.pago_verificado?'Pago del cliente verificado por recepción. No cobrar de nuevo.':p.pago_al_recibir?'El cliente transferirá el total mostrado al recibir. Recepción confirma antes de entregar.':'Transferencia pendiente: consultar a recepción antes de continuar.'),'⏱️ *Tiempo estimado:* '+tiempoOperacion(p.minutos),'','¿Puedes realizar este reparto?','✅ *ACEPTO* / ❌ *RECHAZO*','Responde por este chat. Recepción registrará tu respuesta.'].join('\n');
}
function enlaceChat(zona,telefono,texto,titulo){if(!telefono)return;const a=nodo('a',titulo,'enlace-boton'),movil=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');a.href=(movil?'https://api.whatsapp.com/send?':'https://web.whatsapp.com/send?')+'phone='+telefono+'&text='+encodeURIComponent(texto);a.target='_blank';a.rel='noopener noreferrer';zona.append(a);const detalles=nodo('details');detalles.append(nodo('summary','👀 Ver mensaje del repartidor y copiar con emojis'));const campo=entrada(detalles,'mensaje-repartidor-'+crypto.randomUUID(),'Mensaje del repartidor','textarea');campo.value=texto;campo.readOnly=true;campo.style.minHeight='320px';const copiar=nodo('button','📋 Copiar mensaje con emojis','secundario');copiar.type='button';copiar.onclick=async()=>{try{await navigator.clipboard.writeText(texto);aviso('Mensaje copiado con sus emojis. Pégalo en el chat del repartidor.');}catch{campo.focus();campo.select();aviso('Seleccionamos el mensaje. Cópialo y pégalo en el chat.');}};detalles.append(copiar,nodo('p','Si WhatsApp cambia un emoji por un símbolo raro, copia este mensaje y pégalo en el chat.','nota'));zona.append(detalles);}
function controlAccion(zona,texto,accion,datos={},permitido=true){const b=nodo('button',texto);b.disabled=!permitido;b.onclick=()=>{let ventana=null;const p=seleccionado(),d=typeof datos==='function'?datos():datos;if(accion==='proponer'){const r=riders.find(r=>r.id===d.repartidor_id);if(!r?.telefono){aviso('Selecciona un repartidor con WhatsApp registrado.');return;}ventana=window.open('about:blank','_blank');}tarea(async()=>{try{if(!p)throw Error('Selecciona una solicitud.');const actualizado=await api('/rest/v1/rpc/piloto_pedido_operar',{method:'POST',datos:{pedido:p.id,version:p.revision,accion,datos:d}});if(accion==='proponer'){borrarEnlaceReparto(p.id);const r=riders.find(r=>r.id===d.repartidor_id);await abrirRepartidor(actualizado,r,ventana);ventana=null;}await cargarOperacion();aviso(accion==='proponer'?'Pedido asignado. Pulsa Enviar en WhatsApp.':'Acción registrada.');}finally{if(ventana&&!ventana.closed)ventana.close();}});};zona.append(b);return b;}
async function cargarOperacion(){await api('/rest/v1/rpc/piloto_cierre_diario_operador',{method:'POST',datos:{}});configuracionPago=await api('/rest/v1/rpc/piloto_config_pago_leer',{method:'POST',datos:{}});pintarConfiguracionPago();const [r,pr]=await Promise.all([api('/rest/v1/rpc/piloto_operacion_listar',{method:'POST',datos:{}}),api('/rest/v1/rpc/promociones_operativas_listar',{method:'POST',datos:{}})]);pedidos=r.pedidos;riders=r.repartidores;promocionesOperativas=pr;if(!pedidoSeleccionado&&pedidos.length)pedidoSeleccionado=pedidos[0].id;await seleccionarPrimeroVisible();pintarRiders();pintarResumen();pintarAlertasEntrega();edicionPendiente=false;}
function pintarLista(){pintarContadores();const zona=el('lista-pedidos');zona.replaceChildren();const filtro=el('filtro-pedidos').value||'activas';const lista=pedidos.filter(p=>coincideFiltroPedido(p,filtro));for(const p of lista){const b=nodo('button',undefined,'pedido-lista estado-'+p.estado);b.setAttribute('aria-pressed',String(p.id===pedidoSeleccionado));b.append(nodo('strong',p.cliente+' · '+dineroOperacion(totalPedido(p))),nodo('small',p.folio+' · 🕒 '+fechaRecibida(p,true)),nodo('span',p.tipo+' · '+(p.requiere_whatsapp&&!p.whatsapp_confirmado?'💬 Esperando WhatsApp':estadosPedido[p.estado])));if(p.entrega_programada_en)b.append(nodo('small',textoAlertaEntrega(p),minutosHasta(p.entrega_programada_en)<=5?'pedido-entrega-alerta':'pedido-entrega-programada'));b.onclick=()=>tarea(async()=>{pedidoSeleccionado=p.id;pintarLista();await pintarDetalle();});zona.append(b);}if(!lista.length)zona.append(nodo('p',vistaHistorial?'0 pedidos en esta fecha.':'0 pedidos en esta sección.'));}
function pintarClientePedido(zona,p){
  const c=p.cliente_info,card=nodo('section',undefined,'tarjeta cliente-recepcion');
  card.append(nodo('h3','👤 Historial del cliente'));
  if(!c){
    card.append(nodo('p',p.telefono?'Este teléfono todavía no está vinculado a un cliente.':'Este pedido no tiene teléfono; no puede acumular historial de cliente.','nota'));
    zona.append(card);return;
  }
  const completos=Number(c.pedidos_completados||0),cancelados=Number(c.pedidos_cancelados||0),totales=Number(c.pedidos_totales||0);
  const titulo=c.estado==='recurrente'?'✅ Cliente recurrente':c.estado==='seguimiento'?'🟡 Cliente en seguimiento':'🆕 Cliente nuevo';
  card.append(nodo('strong',titulo),nodo('p','Pedidos completados: '+completos+' · Totales: '+totales+(cancelados?' · Cancelados: '+cancelados:'')));
  if(c.telefono)card.append(nodo('p','📱 '+c.telefono+(c.telefono_verificado?' · ✅ teléfono confirmado':' · ⚠️ teléfono sin confirmar')));
  if(c.beneficios_activos){
    const meses=['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    card.append(nodo('p','🎁 Beneficios y cumpleaños: activo'+(c.cumple_dia&&c.cumple_mes?' · 🎂 '+c.cumple_dia+' de '+meses[Number(c.cumple_mes)]:'') ,'nota'));
  }else{
    card.append(nodo('p',c.telefono_verificado?'🎁 Todavía no participa en beneficios/cumpleaños. Puedes invitarlo de forma opcional.':'🎁 Para invitarlo a beneficios primero confirma que su teléfono sea correcto.','nota'));
  }
  if(completos<2)card.append(nodo('p','💳 Primeros pedidos: conviene transferencia anticipada o recoger primero el dinero antes de realizar compras por cuenta del cliente.','aviso'));
  else if(c.estado==='recurrente')card.append(nodo('p','Este cliente ya tiene historial de entregas completadas. Revisa de todos modos el pedido actual antes de continuar.','nota'));
  const acciones=nodo('div',undefined,'acciones-operacion');
  if(c.telefono&&!c.telefono_verificado){
    const verificar=nodo('button','✅ Confirmar que este teléfono es correcto','secundario');
    verificar.type='button';verificar.onclick=()=>tarea(async()=>{await api('/rest/v1/rpc/cliente_telefono_verificar',{method:'POST',datos:{pedido:p.id}});await cargarOperacion();aviso('Teléfono confirmado para este cliente.');});
    acciones.append(verificar);
  }
  const corregir=nodo('button','✏️ Corregir teléfono','secundario');corregir.type='button';
  corregir.onclick=()=>{const actual=c.telefono||p.telefono||'',nuevo=prompt('Escribe el teléfono correcto del cliente:',actual);if(nuevo===null)return;const limpio=nuevo.trim();if(!limpio)return aviso('No se cambió el teléfono.');tarea(async()=>{await api('/rest/v1/rpc/cliente_telefono_corregir',{method:'POST',datos:{pedido:p.id,telefono:limpio}});await cargarOperacion();aviso('Teléfono corregido y cliente actualizado.');});};
  acciones.append(corregir);
  if(!c.beneficios_activos){
    const invitar=nodo('button','🎁 Invitar a beneficios','secundario');invitar.type='button';invitar.disabled=!c.telefono_verificado||!c.telefono;
    invitar.onclick=()=>tarea(async()=>{
      const r=await api('/rest/v1/rpc/cliente_beneficio_enlace_crear',{method:'POST',datos:{pedido:p.id}});
      if(r.ya_activo){await cargarOperacion();aviso('Este cliente ya participa en beneficios.');return;}
      const url=location.origin+'/beneficios.html#'+r.token;
      const mensaje='Hola, '+p.cliente+' 👋\n\nSi gustas, puedes participar voluntariamente en nuestros beneficios, promociones y detalles de cumpleaños 🎁\n\nSolo te pediremos el día y mes de tu cumpleaños. No necesitas crear cuenta ni contraseña.\n\n👉 '+url+'\n\nEs opcional y puedes dejar de participar cuando quieras.';
      const tel=String(c.telefono).replace(/\D/g,'');
      const numero=tel.length===10?'52'+tel:tel;
      const a=nodo('a');a.href='https://api.whatsapp.com/send?phone='+numero+'&text='+encodeURIComponent(mensaje);a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('data-contacto-cliente','');a.click();
      aviso('Invitación lista. Pulsa Enviar en WhatsApp.');
    });
    acciones.append(invitar);
  }
  card.append(acciones);zona.append(card);
}
async function pintarDetalle(){const zona=el('detalle-pedido'),p=seleccionado();zona.replaceChildren();if(!p){zona.append(nodo('p','Selecciona un pedido.'));return;}if(p.requiere_whatsapp&&!p.whatsapp_confirmado){const espera=nodo('div',undefined,'aviso');espera.append(nodo('strong','💬 Esperando el WhatsApp del cliente'),nodo('p','Busca este mismo folio en el mensaje recibido. Si no llegó, el pedido permanece en espera; el folio ya está utilizado.'));const confirmar=nodo('button','✅ Recibí el WhatsApp con este folio');confirmar.onclick=()=>tarea(async()=>{await api('/rest/v1/rpc/piloto_pedido_whatsapp_confirmar',{method:'POST',datos:{pedido:p.id,version:p.revision}});await cargarOperacion();aviso('Mensaje confirmado. Ya puedes continuar con este pedido.');});espera.append(confirmar);zona.append(espera);}zona.append(nodo('h2',p.folio),nodo('span',estadosPedido[p.estado],'estado-pedido estado-'+p.estado),nodo('p','🕒 Solicitud recibida: '+fechaRecibida(p),'fecha-recibida'),nodo('p',p.cliente+' · '+formaPago(p)+' · '+(p.entrega==='recoger'?'Para recoger':'A domicilio')));if(!p.lineas.length)zona.append(nodo('p',p.detalle,'detalle-texto'));if(p.telefono)zona.append(nodo('p','Teléfono: '+p.telefono));pintarClientePedido(zona,p);if(p.direccion)zona.append(nodo('p','📍 Domicilio: '+p.direccion));
if(p.entrega==='domicilio'&&!cerrado(p)&&p.entrega_programada_en){
  const agenda=nodo('section',undefined,'tarjeta programacion-entrega');
  agenda.append(
    nodo('h3','⏰ Entrega estimada automáticamente'),
    nodo('p','Se calculó desde el momento en que recepción guardó la cotización de '+tiempoOperacion(p.minutos)+'.','nota'),
    nodo('strong',textoAlertaEntrega(p),minutosHasta(p.entrega_programada_en)<=5?'pedido-entrega-alerta':'')
  );
  zona.append(agenda);
}for(const l of p.lineas)zona.append(nodo('p',(l.negocio_nombre?'🏪 '+l.negocio_nombre+'\n':'')+detalleLinea(l),'detalle-texto'));const seguimiento=nodo('ul',undefined,'seguimiento-reparto'),rider=riders.find(r=>r.id===p.repartidor_id),nombre=rider?.nombre||'El repartidor';const paso=(ok,texto)=>seguimiento.append(nodo('li',(ok?'✅ ':'◻️ ')+texto,ok?'completo':'pendiente'));paso(p.aceptado,'El cliente aceptó la cotización');if(p.entrega==='domicilio'){paso(['asignado','recogido','entregado'].includes(p.estado),nombre+' aceptó el pedido');paso(['recogido','entregado'].includes(p.estado),nombre+' recogió el pedido');paso(['recogido','entregado'].includes(p.estado),nombre+' va en camino');if(p.pago==='transferencia')paso(p.pago_verificado,'Recepción confirmó la transferencia');paso(p.estado==='entregado'&&(p.pago==='efectivo'?p.efectivo_recibido:p.pago_verificado),p.pago==='efectivo'?nombre+' recibió el efectivo completo y entregó el pedido':nombre+' entregó el pedido');}if(p.estado!=='cancelado')zona.append(seguimiento);if(p.estado==='recogido'&&p.entrega==='domicilio'){const avisoCliente=nodo('section',undefined,'tarjeta');avisoCliente.append(nodo('h3','📲 Avisar al cliente'));if(p.telefono){const a=nodo('a','🛵 Avisar: tu pedido va en camino','enlace-boton');a.setAttribute('data-contacto-cliente','');const tel=String(p.telefono).replace(/\D/g,'');a.href='https://api.whatsapp.com/send?phone='+(tel.length===10?'52'+tel:tel)+'&text='+encodeURIComponent('🛵 ¡Hola, '+p.cliente+'!\n📦 '+nombre+' ya recogió tu pedido y va hacia tu domicilio.\n🧾 Folio: '+p.folio+'\n📍 '+p.direccion);a.target='_blank';a.rel='noopener noreferrer';avisoCliente.append(a);}else{const b=nodo('button','📋 Copiar aviso para el cliente','secundario');b.onclick=()=>navigator.clipboard.writeText('🛵 ¡Hola, '+p.cliente+'! '+nombre+' ya recogió tu pedido y va hacia tu domicilio. 🧾 '+p.folio).then(()=>aviso('Aviso copiado. Pégalo en el chat del cliente.')).catch(()=>aviso('No se pudo copiar el aviso.'));avisoCliente.append(nodo('p','Este pedido no tiene WhatsApp de contacto.'),b);}zona.append(avisoCliente);}const recorrido=p.entrega==='recoger'?[['pendiente','Cotizar'],['cotizado','Confirmar'],['preparando','Preparar'],['listo_recoger','Listo'],['entregado','Recogido']]:[['pendiente','Cotizar'],['cotizado','Confirmar'],['propuesto','Proponer'],['asignado','Aceptado'],['recogido','En camino'],['entregado','Entregado']];const avance=nodo('ol',undefined,'recorrido-pedido');avance.setAttribute('aria-label','Etapas del pedido');const indice=recorrido.findIndex(x=>x[0]===p.estado);recorrido.forEach(([estado,titulo],i)=>{const paso=nodo('li',(i<indice?'✓':String(i+1))+' · '+titulo,i===indice?'actual':i<indice?'completo':'');if(i===indice)paso.setAttribute('aria-current','step');avance.append(paso);});if(p.estado!=='cancelado')zona.append(avance);const form=nodo('form');form.hidden=!['pendiente','cotizado'].includes(p.estado);const prod=entrada(form,'cot-productos',p.tipo==='comida'?'Productos del menú · calculado automáticamente ($)':'Importe de la compra o pago por realizar ($)','number');prod.min='0';prod.step='.01';prod.value=String(p.productos_centavos/100);prod.readOnly=p.tipo==='comida';const ayudaCompra=nodo('p',p.tipo==='comida'?'🔒 Este importe viene del pedido del menú. Recepción no modifica el precio de los productos.':'🛍️ Aquí va el dinero de la compra o pago que solicitó el cliente, separado del servicio. Confirma el importe con el negocio antes de cotizar. Si solo es recoger algo que ya está pagado, escribe 0.','nota');ayudaCompra.id='ayuda-cot-productos';prod.setAttribute('aria-describedby',ayudaCompra.id);form.append(ayudaCompra);const servicio=entrada(form,'cot-servicio','Costo REAL del mandadito o envío ($)','number');servicio.min='0';servicio.step='.01';servicio.value=String(Number(p.servicio_base_centavos||p.servicio_centavos||0)/100);servicio.readOnly=p.entrega==='recoger';
const promoCaja=nodo('section',undefined,'tarjeta');
promoCaja.append(nodo('h3','🎁 Promoción de mandadito'));
const promoLabel=nodo('label','Promoción aplicada');promoLabel.htmlFor='cot-promocion';
const promoSelect=nodo('select');promoSelect.id='cot-promocion';promoSelect.append(nodo('option','Sin promoción'));promoSelect.firstChild.value='';
const hoyPromo=new Date().toISOString().slice(0,10);
for(const x of promocionesOperativas){
  if(!x.activa)continue;if(x.vigencia_hasta&&x.vigencia_hasta<hoyPromo)continue;
  const financiera=['envio_gratis','porcentaje_envio','monto_envio'].includes(x.promo_tipo);
  if(!financiera)continue;
  const o=nodo('option',(x.negocio_nombre||'Promoción')+' · '+x.titulo+' · usados '+Number(x.usos_completados||0));
  o.value=x.id;if(x.id===p.promocion_id)o.selected=true;promoSelect.append(o);
}
const zonaLocal=entrada(promoCaja,'cot-zona-local','Confirmo que el domicilio está dentro de la zona urbana/local de Frontera Comalapa','checkbox');zonaLocal.checked=true;zonaLocal.disabled=p.entrega==='recoger';
const ayudaPromo=nodo('p','El sistema reservará el presupuesto al guardar la cotización. Solo se marcará como gastado cuando el pedido quede entregado; si se cancela, se libera.','nota');
promoCaja.prepend(promoLabel,promoSelect);promoCaja.append(ayudaPromo);if(p.entrega==='recoger'){promoSelect.disabled=true;promoCaja.hidden=true;}form.append(promoCaja);
const bloqueTiempo=nodo('div',undefined,'tiempo-cotizacion');const horas=entrada(bloqueTiempo,'cot-horas','Horas','number'),mins=entrada(bloqueTiempo,'cot-minutos','Minutos','number');horas.min='0';horas.max='24';horas.step='1';mins.min='0';mins.max='59';mins.step='1';horas.value=String(Math.floor(p.minutos/60));mins.value=String(p.minutos%60);const minutosTotales=()=>Number(horas.value)*60+Number(mins.value);const tiempoLegible=nodo('p','El cliente leerá: '+tiempoOperacion(p.minutos),'nota');const actualizarTiempo=()=>{const n=minutosTotales();tiempoLegible.textContent=Number.isInteger(n)&&n>=1&&n<=1440?'El cliente leerá: '+tiempoOperacion(n):'Elige un tiempo entre 1 minuto y 24 horas.';};horas.oninput=mins.oninput=actualizarTiempo;form.append(nodo('h3','⏱️ Tiempo estimado'),bloqueTiempo,tiempoLegible);const guardar=nodo('button','💾 Guardar cotización');guardar.disabled=!['pendiente','cotizado'].includes(p.estado)||(p.requiere_whatsapp&&!p.whatsapp_confirmado);form.append(guardar);form.onsubmit=e=>{e.preventDefault();tarea(async()=>{await api('/rest/v1/rpc/piloto_pedido_operar',{method:'POST',datos:{pedido:p.id,version:p.revision,accion:'cotizar',datos:{productos_centavos:pesos(prod.value),servicio_centavos:pesos(servicio.value),minutos:minutosTotales(),promocion_id:promoSelect.value||null,zona_local:zonaLocal.checked}}});await cargarOperacion();aviso('Cotización guardada. La hora estimada de entrega se calculó automáticamente.');});};zona.append(form);
if(Number(p.descuento_servicio_centavos||0)>0){
  const promoResumen=nodo('section',undefined,'tarjeta');
  promoResumen.append(nodo('strong','🎁 Promoción aplicada'),nodo('p','Mandadito real: '+dineroOperacion(p.servicio_base_centavos)+' · Promoción cubre: '+dineroOperacion(p.descuento_servicio_centavos)+' · Cliente paga: '+dineroOperacion(p.servicio_centavos)));
  zona.append(promoResumen);
}
zona.append(nodo('p','Total cliente: '+dineroOperacion(totalPedido(p)),'importe-operacion'),nodo('p',p.aceptado?'✓ Aceptación del total registrada':'Falta aceptación del total'),nodo('p',p.pago==='transferencia'?(p.pago_verificado?'✓ Transferencia verificada manualmente':p.pago_al_recibir?(p.transferencia_reportada?'🔔 El repartidor reportó que el cliente transfirió. Revisa tu banco.':'📲 El cliente transferirá al recibir; puedes asignar el reparto.'):'Falta verificar la transferencia'):(p.efectivo_recibido?'✓ Efectivo recibido':'Efectivo pendiente de recibir')));const acciones=nodo('div',undefined,'acciones-operacion');controlAccion(acciones,'👍 El cliente aceptó el total','registrar_aceptacion',{},p.estado==='cotizado'&&!p.aceptado);if(p.pago==='transferencia')controlAccion(acciones,'🏦 Confirmé en mi banco: transferencia recibida','verificar_pago',{},p.aceptado&&!p.pago_verificado&&(p.estado==='cotizado'||(p.pago_al_recibir&&p.estado==='recogido')));zona.append(acciones,nodo('p','Verificar pago registra tu comprobación manual; no consulta ningún banco.','nota'));if(p.entrega==='recoger'){controlAccion(zona,'👨‍🍳 Poner en preparación','preparar',{},p.estado==='cotizado'&&p.aceptado&&p.pago_verificado);controlAccion(zona,'📦 Listo para recoger','listo_recoger',{},p.estado==='preparando');controlAccion(zona,'✅ Cliente ya recogió','entregar_recogida',{},p.estado==='listo_recoger');}else{const label=nodo('label','Proponer a un repartidor');label.htmlFor='repartidor-pedido';const select=nodo('select');select.id='repartidor-pedido';select.append(nodo('option','Selecciona un repartidor'));select.firstChild.value='';for(const r of riders){const ocupado=pedidos.some(x=>x.repartidor_id===r.id&&['propuesto','asignado','recogido'].includes(x.estado));const o=nodo('option',r.nombre+(ocupado?' · ocupado':r.disponible?' · disponible':' · fuera de servicio'));o.value=r.id;o.disabled=ocupado||!r.disponible;select.append(o);}zona.append(label,select);controlAccion(zona,'🛵 Asignar pedido y abrir WhatsApp','proponer',()=>({repartidor_id:select.value}),p.estado==='cotizado'&&p.aceptado&&(p.pago==='efectivo'||p.pago_al_recibir||p.pago_verificado));}if(p.estado==='cotizado'&&!p.aceptado&&!p.respuesta_cliente){const cliente=nodo('section',undefined,'tarjeta'),copiar=nodo('button','📋 Copiar mensaje para el cliente');copiar.disabled=true;cliente.append(nodo('h3','💬 Mensaje para el cliente'),copiar);zona.append(cliente);const vista=nodo('details');vista.append(nodo('summary','Ver mensaje'));const texto=entrada(vista,'mensaje-cotizacion','Mensaje para el cliente','textarea');texto.readOnly=true;cliente.append(vista);copiar.onclick=()=>copiarMensaje(texto);try{texto.value=await mensajeClienteListo(p);copiar.disabled=false;}catch(e){texto.value='No se pudo preparar el mensaje. Pulsa Actualizar para reintentar.';aviso(e.message);}}
if(p.respuesta_cliente==='rechazar')zona.append(nodo('p','✋ El cliente rechazó la cotización.','aviso'));
const asignado=riders.find(r=>r.id===p.repartidor_id);
if(asignado&&['propuesto','asignado','recogido'].includes(p.estado)){zona.append(nodo('h3','🛵 '+asignado.nombre));if(asignado.telefono)prepararEnvioRepartidor(zona,p,asignado);else zona.append(nodo('p','Agrega su WhatsApp en Repartidores antes de enviarle el pedido.','aviso'));
}
if(p.entrega==='domicilio'&&!cerrado(p)&&p.aceptado){
  const cierre=nodo('details');cierre.className='cierre-recepcion';cierre.append(nodo('summary','✅ Cerrar servicio manualmente desde recepción'));
  cierre.append(nodo('p','Úsalo cuando recepción ya confirmó que el mandadito fue realizado, aunque el repartidor no haya marcado sus pasos en el enlace. Quedará registrado como cierre de recepción.','nota'));
  const lab=nodo('label','Repartidor que realizó el servicio');lab.htmlFor='cierre-repartidor';const sel=nodo('select');sel.id='cierre-repartidor';sel.append(nodo('option','Sin especificar'));sel.firstChild.value='';
  for(const r of riders){const o=nodo('option',r.nombre);o.value=r.id;if(r.id===p.repartidor_id)o.selected=true;sel.append(o);}cierre.append(lab,sel);
  const nota=entrada(cierre,'cierre-nota','Nota opcional');nota.maxLength=500;nota.placeholder='Ej. Recepción confirmó entrega por WhatsApp';
  let efectivo=null;if(p.pago==='efectivo'){efectivo=entrada(cierre,'cierre-efectivo','Confirmo que se recibió el efectivo completo','checkbox');}
  const finalizar=nodo('button','✅ Mandadito realizado');finalizar.type='button';
  finalizar.onclick=()=>{if(!confirm('¿Confirmas que este servicio ya fue realizado y debe quedar como entregado?'))return;tarea(async()=>{await api('/rest/v1/rpc/piloto_pedido_cerrar_recepcion',{method:'POST',datos:{pedido:p.id,version:p.revision,repartidor:sel.value||null,efectivo_recibido:efectivo?efectivo.checked:false,nota:nota.value.trim()}});await cargarOperacion();aviso('Servicio marcado como realizado por recepción.');});};
  cierre.append(finalizar);zona.append(cierre);
}
if(!['entregado','cancelado'].includes(p.estado)){const cancelar=nodo('details');cancelar.className='cancelacion-pedido';cancelar.append(nodo('summary','🔴 Cancelar esta solicitud'));zona.append(cancelar);const motivo=entrada(cancelar,'motivo-cancelacion','Motivo de cancelación');motivo.maxLength=500;controlAccion(cancelar,'🔴 Cancelar solicitud de prueba','cancelar',()=>({motivo:motivo.value.trim()}));}const hist=nodo('details');hist.append(nodo('summary','🕘 Ver historial del pedido'));zona.append(hist);const eventos=await api('/rest/v1/piloto_pedido_eventos?pedido_id=eq.'+encodeURIComponent(p.id)+'&order=id.asc');if(seleccionado()?.id!==p.id)return;const lista=nodo('ol',undefined,'historial-operacion');for(const e of eventos)lista.append(nodo('li',new Date(e.fecha).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})+' · '+e.accion+' · '+estadosPedido[e.estado]));hist.append(lista);}
async function cargarClientes(){
  clientes=await api('/rest/v1/rpc/cliente_operacion_listar',{method:'POST',datos:{}});
  pintarClientes();
}
function pintarClientes(){
  const zona=el('lista-clientes');if(!zona)return;
  zona.replaceChildren();
  const q=(el('buscar-clientes')?.value||'').trim().toLowerCase();
  const meses=['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const lista=clientes.filter(c=>!q||String(c.nombre||'').toLowerCase().includes(q)||String(c.telefono||'').includes(q));
  if(!lista.length){zona.append(nodo('p','No hay clientes que coincidan.','nota'));return;}
  for(const c of lista){
    const card=nodo('article',undefined,'tarjeta cliente-listado');
    const completos=Number(c.pedidos_completados||0),cancelados=Number(c.pedidos_cancelados||0),totales=Number(c.pedidos_totales||0);
    const estado=c.estado==='recurrente'?'✅ Recurrente':c.estado==='seguimiento'?'🟡 En seguimiento':'🆕 Nuevo';
    card.append(nodo('h3',c.nombre||'Cliente sin nombre'),nodo('p','📱 '+(c.telefono||'Sin teléfono')+(c.telefono_verificado?' · ✅ confirmado':' · ⚠️ sin confirmar')),nodo('strong',estado),nodo('p','Completados: '+completos+' · Totales: '+totales+(cancelados?' · Cancelados: '+cancelados:'')));
    if(c.beneficios_activos){
      card.append(nodo('p','🎁 Beneficios activos'+(c.cumple_dia&&c.cumple_mes?' · 🎂 '+c.cumple_dia+' de '+meses[Number(c.cumple_mes)]:'') ,'nota'));
    }else{
      card.append(nodo('p','🎁 Sin registro de beneficios/cumpleaños.','nota'));
      const puedeInvitar=!!c.telefono_verificado&&!!c.telefono;
      const preparar=async()=>{
        if(invitacionesBeneficiosPreparadas.has(c.id))return invitacionesBeneficiosPreparadas.get(c.id);
        const r=await api('/rest/v1/rpc/cliente_beneficio_enlace_crear_cliente',{method:'POST',datos:{cliente:c.id}});
        if(r.ya_activo){invitacionesBeneficiosPreparadas.delete(c.id);await cargarClientes();aviso('Este cliente ya participa en beneficios.');return null;}
        const url=location.origin+'/beneficios.html#'+r.token;
        const mensaje='Hola, '+(c.nombre||'')+' 👋\n\nSi gustas, puedes participar voluntariamente en nuestros beneficios, promociones y detalles de cumpleaños 🎁\n\nSolo te pediremos el día y mes de tu cumpleaños. No necesitas crear cuenta ni contraseña.\n\n👉 '+url+'\n\nEs opcional y puedes dejar de participar cuando quieras.';
        const preparada={mensaje,url};invitacionesBeneficiosPreparadas.set(c.id,preparada);return preparada;
      };
      const invitar=nodo('button','📲 Invitar por WhatsApp','secundario');invitar.type='button';invitar.disabled=!puedeInvitar;
      const copiar=nodo('button','📋 Copiar mensaje','secundario');copiar.type='button';copiar.disabled=!puedeInvitar;
      if(!c.telefono_verificado){invitar.title='Primero confirma que el teléfono del cliente sea correcto.';copiar.title=invitar.title;}
      invitar.onclick=()=>tarea(async()=>{
        const preparada=await preparar();if(!preparada)return;
        const tel=String(c.telefono||'').replace(/\D/g,'');const numero=tel.length===10?'52'+tel:tel;
        const a=nodo('a');a.href='https://api.whatsapp.com/send?phone='+numero+'&text='+encodeURIComponent(preparada.mensaje);a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('data-contacto-cliente','');a.click();
        aviso('Invitación lista. Pulsa Enviar en WhatsApp.');
      });
      copiar.onclick=()=>tarea(async()=>{
        const preparada=await preparar();if(!preparada)return;
        try{await navigator.clipboard.writeText(preparada.mensaje);aviso('Mensaje de invitación copiado. Pégalo en el WhatsApp correcto.');}
        catch{
          const area=nodo('textarea');area.value=preparada.mensaje;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();aviso('Mensaje de invitación copiado. Pégalo en el WhatsApp correcto.');
        }
      });
      card.append(invitar,copiar);
    }
    zona.append(card);
  }
}
async function cargarPromociones(){
  campanas=await api('/rest/v1/rpc/cliente_campanas_listar',{method:'POST',datos:{}});
  pintarPromociones();
  if(campanaSeleccionada)await pintarDetallePromocion();
}
function textoCampanaCompartible(c){
  let mensaje=String(c.mensaje||'').replace('{nombre}','').replace(/Hola,\s*👋/,'Hola 👋').replace(/Hola,\s+/,'Hola ');
  if(c.vigencia_hasta){
    const fecha=new Date(c.vigencia_hasta+'T12:00:00');
    mensaje=mensaje.replace('{vigencia}',fecha.toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}));
  }else mensaje=mensaje.replace('{vigencia}','');
  return mensaje.replace(/\s+/g,' ').replace(/\s+([.,])/g,'$1').trim();
}
async function copiarCampana(c){
  const mensaje=textoCampanaCompartible(c);
  try{await navigator.clipboard.writeText(mensaje);}
  catch{
    const area=nodo('textarea');area.value=mensaje;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();
  }
  aviso('Mensaje de la promoción copiado.');
}
function compartirCampanaWhatsApp(c){
  const a=nodo('a');a.href='https://wa.me/?text='+encodeURIComponent(textoCampanaCompartible(c));a.target='_blank';a.rel='noopener noreferrer';a.click();
}
function pintarPromociones(){
  const zona=el('lista-promociones');if(!zona)return;zona.replaceChildren();
  if(!campanas.length){zona.append(nodo('p','Todavía no hay promociones creadas.','nota'));return;}
  for(const c of campanas){
    const card=nodo('article',undefined,'tarjeta');
    card.append(nodo('h3',c.titulo),nodo('p',(c.negocio_filtro?'Clientes que ya compraron en '+c.negocio_filtro+' · ':'')+'Mínimo completados: '+c.minimo_completados+(c.vigencia_hasta?' · Vigencia: '+c.vigencia_hasta:'')),nodo('p','Marcados como enviados: '+Number(c.enviados||0),'nota'));
    const copiar=nodo('button','📋 Copiar mensaje','secundario');copiar.type='button';copiar.onclick=()=>tarea(()=>copiarCampana(c));
    const compartir=nodo('button','📲 Compartir por WhatsApp','secundario');compartir.type='button';compartir.onclick=()=>compartirCampanaWhatsApp(c);
    const abrir=nodo('button','👥 Ver clientes elegibles','secundario');abrir.type='button';abrir.onclick=()=>{campanaSeleccionada=c.id;tarea(pintarDetallePromocion);};
    card.append(copiar,compartir,abrir);zona.append(card);
  }
}
async function pintarDetallePromocion(){
  const zona=el('detalle-promocion');if(!zona||!campanaSeleccionada)return;
  const c=campanas.find(x=>x.id===campanaSeleccionada);if(!c)return;
  const lista=await api('/rest/v1/rpc/cliente_campana_elegibles',{method:'POST',datos:{campana:campanaSeleccionada}});
  zona.hidden=false;zona.replaceChildren(nodo('h2',c.titulo),nodo('p',c.mensaje,'detalle-texto'),nodo('p','Clientes elegibles: '+lista.length,'nota'));
  if(!lista.length){zona.append(nodo('p','No hay clientes elegibles con los filtros actuales.','aviso'));return;}
  for(const cl of lista){
    const card=nodo('article',undefined,'tarjeta');
    card.append(nodo('strong',cl.nombre||'Cliente'),nodo('p','📱 '+cl.telefono+' · '+Number(cl.pedidos_completados||0)+' pedidos completados'));
    if(cl.enviado_en)card.append(nodo('p','✅ Marcado como enviado '+new Date(cl.enviado_en).toLocaleString('es-MX'),'nota'));
    const abrir=nodo('button',cl.enviado_en?'📲 Abrir WhatsApp otra vez':'📲 Preparar WhatsApp','secundario');abrir.type='button';
    abrir.onclick=()=>tarea(async()=>{
      const r=await api('/rest/v1/rpc/cliente_campana_preparar',{method:'POST',datos:{campana:c.id,cliente:cl.id}});
      const tel=String(r.telefono||'').replace(/\D/g,'');const numero=tel.length===10?'52'+tel:tel;
      const a=nodo('a');a.href='https://api.whatsapp.com/send?phone='+numero+'&text='+encodeURIComponent(r.mensaje);a.target='_blank';a.rel='noopener noreferrer';a.click();
      aviso('Mensaje preparado. Después de enviarlo, marca el registro como enviado.');
    });
    const enviado=nodo('button','✅ Marcar como enviado');enviado.type='button';enviado.disabled=!!cl.enviado_en;
    enviado.onclick=()=>tarea(async()=>{await api('/rest/v1/rpc/cliente_campana_marcar_enviado',{method:'POST',datos:{campana:c.id,cliente:cl.id}});await cargarPromociones();aviso('Envío registrado.');});
    card.append(abrir,enviado);zona.append(card);
  }
}
function pintarRiders(){const zona=el('lista-riders');zona.replaceChildren();for(const r of riders){const card=nodo('article',undefined,'tarjeta');const trabajo=pedidos.find(p=>p.repartidor_id===r.id&&['propuesto','asignado','recogido'].includes(p.estado));card.append(nodo('h3',r.nombre),nodo('p',trabajo?'Con trabajo activo':r.disponible?'Disponible':'Fuera de servicio'));const disponible=nodo('button',r.disponible?'Marcar fuera de servicio':'Marcar disponible','secundario');disponible.disabled=!!trabajo;disponible.onclick=()=>tarea(async()=>{await api('/rest/v1/rpc/piloto_repartidor_guardar',{method:'POST',datos:{repartidor:r.id,nombre:r.nombre,disponible:!r.disponible}});await cargarOperacion();});card.append(disponible,nodo('p',r.telefono?'📞 +'+r.telefono:'Sin WhatsApp registrado'));const editar=nodo('button','✏️ Editar nombre y WhatsApp','secundario');editar.onclick=()=>{el('rider-id').value=r.id;el('rider-nombre').value=r.nombre;el('rider-telefono').value=r.telefono||'';el('rider-nombre').closest('details').open=true;el('rider-nombre').focus();};card.append(editar);if(trabajo){card.append(nodo('strong',trabajo.folio),nodo('p',estadosPedido[trabajo.estado]),nodo('p',trabajo.detalle,'detalle-texto'));const actuar=(label,accion,datos={})=>{const b=nodo('button',label);b.onclick=()=>tarea(async()=>{await api('/rest/v1/rpc/piloto_pedido_operar',{method:'POST',datos:{pedido:trabajo.id,version:trabajo.revision,accion,datos:typeof datos==='function'?datos():datos}});await cargarOperacion();aviso('Simulación administrativa registrada.');});card.append(b);};if(document.body?.dataset?.simulador==='true'&&trabajo.estado==='propuesto'){actuar('👍 Aceptar · simulación','aceptar_reparto');actuar('✋ Rechazar · simulación','rechazar_reparto');}if(document.body?.dataset?.simulador==='true'&&trabajo.estado==='asignado')actuar('📦 Ya recogí · simulación','recoger');if(document.body?.dataset?.simulador==='true'&&trabajo.estado==='recogido'){const check=entrada(card,'efectivo-'+trabajo.id,'Confirmo entrega y recepción del efectivo completo','checkbox');check.hidden=trabajo.pago!=='efectivo';actuar('✅ Ya entregué · simulación','entregar',()=>({efectivo_recibido:check.checked}));}}zona.append(card);}}
function pintarResumen(){const hoy=diaOperacion(Date.now()),entregados=pedidos.filter(p=>p.entregado_en&&diaOperacion(p.entregado_en)===hoy),cobrados=pedidos.filter(p=>(p.pago_verificado||p.efectivo_recibido)&&p.estado!=='cancelado'),canceladosConPago=pedidos.filter(p=>p.estado==='cancelado'&&(p.pago_verificado||p.efectivo_recibido));const zona=el('resumen-operacion');zona.replaceChildren(nodo('p','Día de operación: '+hoy+' · hora de Comalapa'));const grid=nodo('div',undefined,'metricas-operacion');for(const [label,valor]of [['Solicitudes recibidas hoy',pedidos.filter(p=>diaOperacion(p.creado_en)===hoy).length],['Entregadas hoy',entregados.length],['En proceso',pedidos.filter(p=>!['entregado','cancelado'].includes(p.estado)).length],['Canceladas con pago por resolver',canceladosConPago.length],['Productos cobrados · acumulado',dineroOperacion(cobrados.reduce((s,p)=>s+p.productos_centavos,0))],['Servicios cobrados · acumulado',dineroOperacion(cobrados.reduce((s,p)=>s+p.servicio_centavos,0))]]){const c=nodo('div',undefined,'tarjeta');c.append(nodo('p',label),nodo('strong',valor,'importe-operacion'));grid.append(c);}zona.append(grid,nodo('p','Los cobros son registros manuales del piloto. No descuentan costos, pagos al repartidor ni devoluciones.','nota'));for(const p of entregados)zona.append(nodo('p',p.folio+' · '+dineroOperacion(totalPedido(p))));}
el('crear-ejemplo').onclick=()=>tarea(async()=>{if(!ejemploPendiente)ejemploPendiente={clave:crypto.randomUUID(),solicitud:{tipo:'mandadito',entrega:'domicilio',pago:'efectivo',cliente:'Cliente ficticio de prueba',direccion:'Dirección ficticia, no realizar entregas',detalle:'Comprar pan de prueba y recoger queso en una segunda parada. No es un pedido real.'}};const p=await api('/rest/v1/rpc/piloto_pedido_crear',{method:'POST',datos:ejemploPendiente});ejemploPendiente=null;pedidoSeleccionado=p.id;await cargarOperacion();aviso('Solicitud guardada con folio '+p.folio);});
el('nuevo-rider').onsubmit=e=>{e.preventDefault();tarea(async()=>{const id=el('rider-id').value;await api('/rest/v1/rpc/piloto_repartidor_contacto_guardar',{method:'POST',datos:{repartidor:id||null,nombre:el('rider-nombre').value.trim(),telefono:el('rider-telefono').value,disponible:id?riders.find(r=>r.id===id).disponible:true}});el('nuevo-rider').reset();await cargarOperacion();});};
el('filtro-pedidos').onchange=()=>tarea(async()=>{await seleccionarPrimeroVisible();});
el('login').onsubmit=e=>{e.preventDefault();tarea(async()=>{cuenta=await api('/auth/v1/token?grant_type=password',{method:'POST',datos:{email:el('correo').value.trim(),password:el('clave').value}});el('clave').value='';sessionStorage.setItem('exhibicionPilotoSesion',JSON.stringify(cuenta));mostrar();await cargarOperacion();aviso('Recepción conectada.');});};
el('recargar').onclick=()=>tarea(async()=>{await cargarOperacion();aviso('Solicitudes actualizadas desde Supabase.');});
el('salir').onclick=()=>tarea(async()=>{try{await api('/auth/v1/logout',{method:'POST'})}finally{cuenta=null;sessionStorage.removeItem('exhibicionPilotoSesion');pedidos=[];riders=[];pedidoSeleccionado=null;el('detalle-pedido').replaceChildren();el('lista-pedidos').replaceChildren();el('lista-riders').replaceChildren();mostrar();aviso('Sesión cerrada.');}});
try{const s=JSON.parse(sessionStorage.getItem('exhibicionPilotoSesion'));if(s?.expires_at*1000>Date.now())cuenta=s;}catch{}mostrar();activarPanel('operacion',document.body?.dataset?.simulador==='true'?'vista-riders':'vista-solicitudes');if(cuenta)tarea(cargarOperacion);




async function seleccionarPrimeroVisible(){const f=el('filtro-pedidos').value;const lista=pedidos.filter(p=>coincideFiltroPedido(p,f));if(!lista.some(p=>p.id===pedidoSeleccionado))pedidoSeleccionado=lista[0]?.id||null;pintarLista();await pintarDetalle();}


function fechaRecibida(p,corta=false){if(!p.creado_en)return '';return new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',...(corta?{}:{day:'2-digit',month:'short',year:'numeric'}),hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(p.creado_en));}
function cerrado(p){return ['entregado','cancelado'].includes(p.estado);}
function coincideFiltroPedido(p,f){if(vistaHistorial){const fecha=el('fecha-historial').value;return diaOperacion(p.creado_en)===fecha;}if(diaOperacion(p.creado_en)!==diaOperacion(Date.now()))return false;return f==='todas'||(f==='whatsapp'?p.requiere_whatsapp&&!p.whatsapp_confirmado&&!cerrado(p):f==='activas'?!cerrado(p):p.estado===f);}
function claveEnlace(tipo,p){return 'mensaje-v26:'+tipo+':'+p.id+':'+(tipo==='cliente'?p.revision:p.repartidor_id);}
async function enlaceListo(tipo,p){const clave=claveEnlace(tipo,p);if(enlacesListos.has(clave))return enlacesListos.get(clave);const trabajo=(async()=>{let c;try{c=JSON.parse(sessionStorage.getItem(clave));}catch{}if(c&&c.vence>Date.now()&&/^[a-f0-9]{64}$/.test(c.token))return c.token;const r=await api('/rest/v1/rpc/'+(tipo==='cliente'?'piloto_confirmacion_crear':'piloto_reparto_enlace_crear'),{method:'POST',datos:{pedido:p.id,version:p.revision}});try{sessionStorage.setItem(clave,JSON.stringify({token:r.token,vence:Date.now()+(tipo==='cliente'?23:47)*3600000}));}catch{}return r.token;})();enlacesListos.set(clave,trabajo);try{return await trabajo;}catch(e){enlacesListos.delete(clave);throw e;}}
function borrarEnlaceReparto(id){const prefijo='mensaje-v26:repartidor:'+id+':';for(const k of [...enlacesListos.keys()])if(k.startsWith(prefijo))enlacesListos.delete(k);try{for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k.startsWith(prefijo))sessionStorage.removeItem(k);}}catch{}}
async function mensajeClienteListo(p){const token=await enlaceListo('cliente',p);return mensajeCotizacion(p).replace('Confírmanos tu respuesta por WhatsApp para continuar.','👉 Acepta o rechaza tu cotización aquí:\n'+location.origin+'/panel/confirmar-pedido.html#'+token);}
async function abrirRepartidor(p,r,ventana=null){if(window.ContactosPrueba){await window.ContactosPrueba.publicacion;r={...r,telefono:window.ContactosPrueba.destino(r.telefono)};}const token=await enlaceListo('repartidor',p);const texto=mensajeRepartidor(p).replace('Responde por este chat. Recepción registrará tu respuesta.','👉 Acepta o rechaza y registra tu avance aquí:\n'+location.origin+'/panel/mi-reparto.html#'+token+'\n📦 Usa el mismo enlace para marcar Recogido y Entregado.');const movil=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');const url=(movil?'https://api.whatsapp.com/send?':'https://web.whatsapp.com/send?')+'phone='+r.telefono+'&text='+encodeURIComponent(texto);if(ventana&&!ventana.closed)ventana.location.href=url;else{const a=nodo('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();}return texto;}
async function copiarMensaje(campo){try{await navigator.clipboard.writeText(campo.value);aviso('Mensaje copiado. Pégalo en el chat del cliente.');}catch{campo.focus();campo.select();aviso('Seleccionamos el mensaje completo para que puedas copiarlo.');}}
function prepararEnvioRepartidor(zona,p,r){const opciones=nodo('details');opciones.append(nodo('summary','Reenviar mensaje al repartidor'));const b=nodo('button','📲 Reenviar WhatsApp al repartidor');b.onclick=()=>{const ventana=window.open('about:blank','_blank');tarea(async()=>{try{await abrirRepartidor(p,r,ventana);aviso('Mensaje listo con su enlace. Pulsa Enviar en WhatsApp.');}catch(e){if(ventana&&!ventana.closed)ventana.close();throw e;}});};opciones.append(b);zona.append(opciones);}
document.addEventListener('input',e=>{if(e.target.closest?.('#panel')&&!e.target.readOnly&&!['fecha-historial','filtro-pedidos'].includes(e.target.id))edicionPendiente=true;});
document.addEventListener('change',e=>{if(e.target.id==='repartidor-pedido')edicionPendiente=true;});
let consultandoAvances=false,ultimaFirmaEquipo=null;
async function actualizarAvances(){if(!cuenta||trabajando||document.hidden||consultandoAvances)return;consultandoAvances=true;try{await api('/rest/v1/rpc/piloto_cierre_diario_operador',{method:'POST',datos:{}});const sello=await api('/rest/v1/rpc/piloto_operacion_sello',{method:'POST',datos:{}}),dia=diaOperacion(Date.now());const cambio=sello.equipo!==ultimaFirmaEquipo||Number(sello.cantidad)!==pedidos.length||Number(sello.version)!==pedidos.reduce((n,p)=>n+Number(p.revision),0);if(!cambio&&ultimoDiaOperacion===dia)return;if(trabajando)return;if(edicionPendiente){configuracionPago=await api('/rest/v1/rpc/piloto_config_pago_leer',{method:'POST',datos:{}});const r=await api('/rest/v1/rpc/piloto_operacion_listar',{method:'POST',datos:{}});pedidos=r.pedidos;riders=r.repartidores;pintarLista();pintarRiders();pintarResumen();actualizarDisponibilidadSelect();aviso('🟢 Lista y repartidores actualizados. Conservamos tu edición; al terminar pulsa Actualizar para renovar el detalle.');}else await tarea(async()=>{await cargarOperacion();aviso('🟢 Pedidos y repartidores actualizados automáticamente.');});ultimoDiaOperacion=dia;ultimaFirmaEquipo=sello.equipo;}catch(e){aviso(e.message);}finally{consultandoAvances=false;}}
setInterval(actualizarAvances,5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)actualizarAvances();});window.addEventListener('focus',actualizarAvances);
function datosTransferencia(p){const c=configuracionPago;if(p.pago!=='transferencia'||!c?.numero)return [];return ['','🏦 *Datos para transferencia*',...(c.prueba?['🧪 DATOS FICTICIOS · NO REALICES PAGOS']:[]),'Banco: '+c.banco,'Cuenta / tarjeta / CLABE: '+c.numero,'Titular: '+c.titular,p.pago_al_recibir?'Cuando llegue tu pedido, comparte tu comprobante (captura o PDF) para verificar el pago antes de entregar.':'Comparte tu comprobante (captura o PDF) para verificar el pago y continuar con tu pedido.','Recepción comprobará que el dinero llegó a la cuenta.'];}
function pintarConfiguracionPago(){const c=configuracionPago;if(!c||!el('pago-banco'))return;el('pago-banco').value=c.banco||'';el('pago-numero').value=c.numero||'';el('pago-titular').value=c.titular||'';el('pago-prueba').checked=c.prueba!==false;}
el('configurar-pago').onsubmit=e=>{e.preventDefault();tarea(async()=>{configuracionPago=await api('/rest/v1/rpc/piloto_config_pago_guardar',{method:'POST',datos:{configuracion:{banco:el('pago-banco').value.trim(),numero:el('pago-numero').value.trim(),titular:el('pago-titular').value.trim(),prueba:el('pago-prueba').checked}}});edicionPendiente=false;aviso('Datos de transferencia guardados. Se incluirán en las nuevas cotizaciones que copies.');});};
el('abrir-historial').onclick=()=>tarea(async()=>{vistaHistorial=true;el('fecha-historial').hidden=false;el('etiqueta-fecha-historial').hidden=false;el('revisar-antiguos').hidden=false;el('filtro-pedidos').disabled=true;el('fecha-historial').min=diaOperacion(Date.now()-59*86400000);el('fecha-historial').value=el('fecha-historial').value||diaOperacion(Date.now());el('titulo-bandeja').textContent='🗓️ Historial por fecha';activarPanel('operacion','vista-solicitudes');marcarRecepcion(el('abrir-historial'));await seleccionarPrimeroVisible();});
el('fecha-historial').onchange=()=>tarea(seleccionarPrimeroVisible);

el('revisar-antiguos').onclick=()=>{el('fecha-historial').min='';el('fecha-historial').value=diaOperacion(Date.now()-60*86400000);tarea(seleccionarPrimeroVisible);aviso('Revisión de historial anterior a 60 días. No se borran datos desde esta pantalla.');};

function pintarContadores(){const hoy=diaOperacion(Date.now());for(const b of document.querySelectorAll('[data-filtro-recepcion]')){b.dataset.tituloBase=b.dataset.tituloBase||b.textContent;const f=b.dataset.filtroRecepcion;const n=pedidos.filter(p=>{if(diaOperacion(p.creado_en)!==hoy)return false;return f==='activas'?!cerrado(p):f==='whatsapp'?p.requiere_whatsapp&&!p.whatsapp_confirmado&&!cerrado(p):p.estado===f;}).length;b.textContent=b.dataset.tituloBase+' · '+n;}}
function actualizarDisponibilidadSelect(){const select=el('repartidor-pedido');if(!select)return;const valor=select.value;select.replaceChildren(nodo('option','Selecciona un repartidor'));select.firstChild.value='';for(const r of riders){const ocupado=pedidos.some(p=>p.repartidor_id===r.id&&['propuesto','asignado','recogido'].includes(p.estado)),o=nodo('option',r.nombre+(ocupado?' · ocupado':r.disponible?' · disponible':' · fuera de servicio'));o.value=r.id;o.disabled=ocupado||!r.disponible;select.append(o);}select.value=valor;}

if(el('abrir-clientes'))el('abrir-clientes').addEventListener('click',()=>tarea(cargarClientes));
if(el('recargar-clientes'))el('recargar-clientes').onclick=()=>tarea(async()=>{await cargarClientes();aviso('Clientes actualizados.');});
if(el('buscar-clientes'))el('buscar-clientes').oninput=pintarClientes;

setInterval(pintarAlertasEntrega,30000);

if(el('abrir-promociones'))el('abrir-promociones').addEventListener('click',()=>tarea(cargarPromociones));
if(el('recargar-promociones'))el('recargar-promociones').onclick=()=>tarea(cargarPromociones);
if(el('form-promocion'))el('form-promocion').onsubmit=e=>{e.preventDefault();tarea(async()=>{
  const datos={titulo:el('promo-titulo').value.trim(),mensaje:el('promo-mensaje').value.trim(),negocio_filtro:el('promo-negocio').value.trim(),minimo_completados:Number(el('promo-minimo').value||0),vigencia_hasta:el('promo-vigencia').value||null};
  const c=await api('/rest/v1/rpc/cliente_campana_guardar',{method:'POST',datos:{datos}});
  campanaSeleccionada=c.id;el('form-promocion').reset();el('promo-minimo').value='0';await cargarPromociones();aviso('Promoción creada.');
});};
