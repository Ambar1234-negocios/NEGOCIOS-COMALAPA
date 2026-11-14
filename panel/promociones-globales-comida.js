/* Only the master administrator receives editing controls. RPC checks the role again. */
'use strict';
function pintarControlPromoComida(opciones={}){
 const esAdmin=opciones.esAdmin??(typeof esMaestroRecepcion!=='undefined'&&esMaestroRecepcion);
 const fondo=opciones.fondo??(typeof fondoGlobal!=='undefined'?fondoGlobal:null);
 const destino=el(opciones.contenedor||'vista-promociones');
 let caja=el('control-promo-comida');
 if(!esAdmin){caja?.remove();return;}if(!destino)return;
 if(!caja){caja=nodo('section',undefined,'tarjeta');caja.id='control-promo-comida';destino.prepend(caja);}
 caja.replaceChildren();
 const promociones=fondo?.promociones_comida||[],actual=promociones.find(p=>p.activa);
 caja.append(nodo('h3','🎉 Promoción global de envío de comida'),nodo('p',actual?'Activa: '+actual.titulo+' · '+actual.porcentaje+'% de descuento en envío.':'La promoción global está apagada.'),nodo('p','Aplica a todos los negocios de comida con Mandaditos dentro de Frontera Comalapa. Usa el mismo fondo promocional: si no alcanza para el descuento completo, no se ofrece y se ocultan la franja y los avisos.','nota'));
 if(opciones.mostrarSaldo&&fondo){const dinero=n=>'$'+(Number(n||0)/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});caja.append(nodo('p','Saldo del fondo: '+dinero(fondo.saldo_centavos)+' · Saldo reservado: '+dinero(fondo.reservado_centavos)+' · Disponible: '+dinero(fondo.disponible_centavos)));const enlace=nodo('a','Ver fondo y reponer saldo');enlace.href='recepcion.html';enlace.className='enlace-boton';caja.append(enlace);}
 const crear=nodo('button','＋ Nueva promoción de envío');crear.type='button';caja.append(crear);
 const lista=nodo('div'),editor=nodo('div');caja.append(lista,editor);
 async function guardar(p,datos){await api('/rest/v1/rpc/exhibicion_promocion_comida_guardar',{method:'POST',datos:{promocion:p?.id||null,version:p?.revision||null,datos}});if(typeof edicionPendiente!=='undefined')edicionPendiente=false;if(opciones.recargar)await opciones.recargar();else await cargarOperacion();aviso('Promoción de comida guardada. La web actualiza sus avisos en unos segundos.');}
 function editar(p=null){
  editor.replaceChildren();const form=nodo('form');editor.append(nodo('h4',p?'Editar promoción':'Nueva promoción'),form);
  const titulo=entrada(form,'global-comida-titulo','Nombre de la promoción','text');titulo.required=true;titulo.minLength=3;titulo.maxLength=100;titulo.value=p?.titulo||'';titulo.placeholder='Ej. Semana de envío con descuento';
  const porcentaje=entrada(form,'global-comida-porcentaje','Descuento en el envío (%)','number');porcentaje.min='1';porcentaje.max='100';porcentaje.step='1';porcentaje.required=true;porcentaje.value=String(p?.porcentaje||50);
  const activa=entrada(form,'global-comida-activa','Promoción activa: aplicar descuento a nuevos pedidos','checkbox');activa.checked=p?.activa||false;
  const anuncio=entrada(form,'global-comida-anuncio','Mostrar anuncio en la web: franja y avisos en las tarjetas','checkbox');anuncio.checked=p?.mostrar_anuncio??true;
  form.append(nodo('p','Solo puede haber una promoción global activa. Al activar esta, la anterior se apaga. Ocultar el anuncio conserva el descuento activo. Apagar la promoción detiene nuevos descuentos; los pedidos ya cotizados conservan su reserva hasta vencer.','nota'));
  const guardarBoton=nodo('button','💾 Guardar promoción');form.append(guardarBoton);
  const cancelar=nodo('button','Cerrar edición','secundario');cancelar.type='button';cancelar.onclick=()=>{editor.replaceChildren();if(typeof edicionPendiente!=='undefined')edicionPendiente=false;};form.append(cancelar);
  form.onsubmit=e=>{e.preventDefault();tarea(()=>guardar(p,{titulo:titulo.value.trim(),porcentaje:Number(porcentaje.value),activa:activa.checked,mostrar_anuncio:anuncio.checked}));};titulo.focus();
 }
 crear.onclick=()=>editar();
 for(const p of promociones){
  const fila=nodo('article',undefined,'tarjeta');fila.append(nodo('strong',p.titulo+' · '+p.porcentaje+'% en envío'),nodo('p',(p.activa?'🟢 Activa':'⚪ Apagada')+' · Anuncio '+(p.mostrar_anuncio?'encendido':'oculto')));
  const editarBoton=nodo('button','✏️ Editar','secundario');editarBoton.type='button';editarBoton.onclick=()=>editar(p);fila.append(editarBoton);
  const cambiar=nodo('button',p.activa?'⏸ Apagar promoción':'▶ Activar promoción');cambiar.type='button';cambiar.onclick=()=>tarea(()=>guardar(p,{titulo:p.titulo,porcentaje:p.porcentaje,activa:!p.activa,mostrar_anuncio:p.mostrar_anuncio}));fila.append(cambiar);
  const anuncio=nodo('button',p.mostrar_anuncio?'Ocultar anuncio':'Mostrar anuncio','secundario');anuncio.type='button';anuncio.onclick=()=>tarea(()=>guardar(p,{titulo:p.titulo,porcentaje:p.porcentaje,activa:p.activa,mostrar_anuncio:!p.mostrar_anuncio}));fila.append(anuncio);lista.append(fila);
 }
}
if(typeof fondoGlobal!=='undefined'&&fondoGlobal)pintarControlPromoComida();

