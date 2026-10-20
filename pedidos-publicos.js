/* Registro de solicitudes: no confirma pedidos ni pagos; WhatsApp se coteja en recepción. */
(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co',KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
const nodo=(t,texto)=>{const e=document.createElement(t);if(texto!==undefined)e.textContent=texto;return e;};
const campo=(f,id,titulo,tipo='text')=>{const l=nodo('label',titulo),i=nodo(tipo==='textarea'?'textarea':'input');l.htmlFor=id;i.id=id;if(tipo!=='textarea')i.type=tipo;f.append(l,i);return i;};
let abierto=false;
function abrir({solicitud,numero,mensaje}){
 if(abierto)return;abierto=true;
 const d=nodo('dialog');d.className='comida-visor pedido-datos-web';const cerrar=nodo('button','Cerrar ×');cerrar.type='button';cerrar.className='comida-visor-cerrar';cerrar.onclick=()=>d.close();
 const f=nodo('form'),nombre=campo(f,'cliente-pedido-publico','Tu nombre');nombre.required=true;nombre.maxLength=120;nombre.autocomplete='name';
 const telefono=campo(f,'telefono-pedido-publico','Teléfono de contacto (opcional)','tel');telefono.maxLength=20;telefono.autocomplete='tel';
 const direccion=campo(f,'direccion-pedido-publico',solicitud.entrega==='recoger'?'Dirección no necesaria: pasarás a recoger':'Dirección y referencias para entregar','textarea');direccion.value=solicitud.direccion||'';direccion.required=solicitud.entrega!=='recoger';direccion.disabled=solicitud.entrega==='recoger';direccion.maxLength=500;
 const aviso=nodo('p','Guardaremos tu solicitud y abriremos WhatsApp con un folio. En WhatsApp pulsa Enviar; recepción confirmará disponibilidad, entrega y total.');
 const estado=nodo('p');estado.setAttribute('role','status');const enviar=nodo('button','Guardar solicitud y continuar a WhatsApp');enviar.type='submit';const continuar=nodo('a','📲 Abrir WhatsApp con mi folio');continuar.className='enlace-boton';continuar.hidden=true;continuar.target='_blank';continuar.rel='noopener noreferrer';
 const otro=nodo('button','Crear otra solicitud igual');otro.type='button';otro.hidden=true;otro.onclick=()=>{pendiente=null;sessionStorage.removeItem(llave);continuar.hidden=true;otro.hidden=true;estado.textContent='Puedes iniciar una solicitud nueva; tendrá un folio diferente.';bloquear();};
 const llave='exhibicionPedidoPendiente:'+JSON.stringify(solicitud);let pendiente=null,trabajando=false;
 try{pendiente=JSON.parse(sessionStorage.getItem(llave));}catch{}
 function bloquear(){for(const e of [nombre,telefono,direccion])e.disabled=!!pendiente||trabajando;enviar.disabled=trabajando;enviar.textContent=pendiente?.resultado?'Volver a abrir WhatsApp con este folio':pendiente?'Reintentar el mismo envío':'Guardar solicitud y continuar a WhatsApp';if(!pendiente&&!trabajando)direccion.disabled=solicitud.entrega==='recoger';}
 function recibo(r){estado.textContent='🧾 Folio: '+r.folio+'. Tu solicitud está en espera hasta que recepción reciba tu WhatsApp. El envío aún no está confirmado.';continuar.href='https://api.whatsapp.com/send?phone='+numero+'&text='+encodeURIComponent('🧾 Folio: '+r.folio+'\n👤 Cliente: '+pendiente.solicitud.cliente+'\n'+(pendiente.solicitud.telefono?'📞 Contacto: '+pendiente.solicitud.telefono+'\n':'')+'\n'+mensaje);continuar.hidden=false;otro.hidden=false;}
 if(pendiente){nombre.value=pendiente.solicitud.cliente;telefono.value=pendiente.solicitud.telefono||'';direccion.value=pendiente.solicitud.direccion||'';if(pendiente.resultado)recibo(pendiente.resultado);}
 f.append(aviso,estado,enviar,continuar,otro);d.append(cerrar,nodo('h2','Confirmar datos de mi solicitud'),f);document.body.append(d);bloquear();d.addEventListener('close',()=>{abierto=false;d.remove();},{once:true});d.showModal();
 f.onsubmit=async e=>{e.preventDefault();if(trabajando)return;
  if(pendiente?.resultado){recibo(pendiente.resultado);window.open(continuar.href,'_blank','noopener,noreferrer');return;}
  if(!pendiente){pendiente={clave:crypto.randomUUID(),solicitud:{...solicitud,cliente:nombre.value.trim(),telefono:telefono.value.trim(),direccion:solicitud.entrega==='recoger'?'':direccion.value.trim()}};if(!pendiente.solicitud.cliente||solicitud.entrega!=='recoger'&&!pendiente.solicitud.direccion){pendiente=null;estado.textContent='Escribe tu nombre y la dirección de entrega.';return;}sessionStorage.setItem(llave,JSON.stringify(pendiente));}
  trabajando=true;bloquear();estado.textContent='Guardando tu solicitud…';
  try{const r=await fetch(BASE+'/rest/v1/rpc/pedido_publico_crear',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(pendiente)});const resultado=await r.json();if(!r.ok){const error=Error(resultado.message||'No se pudo guardar. Reintenta.');error.http=r.status;throw error;}pendiente.resultado=resultado;sessionStorage.setItem(llave,JSON.stringify(pendiente));recibo(resultado);window.open(continuar.href,'_blank','noopener,noreferrer');}
  catch(error){estado.textContent=error.message;if(error.http>=400&&error.http<500&&![408,429].includes(error.http)){pendiente=null;sessionStorage.removeItem(llave);}}
  finally{trabajando=false;bloquear();}
 };
}
window.PedidosExhibicion={abrir};})();
