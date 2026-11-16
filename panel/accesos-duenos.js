'use strict';
let permisoPendienteDueno=null, accionPendiente=null;
const gestionar=datos=>api('/functions/v1/gestionar-accesos',{method:'POST',datos});
async function cargarDuenos(){
 const permitido=await api('/rest/v1/rpc/piloto_es_admin',{method:'POST',datos:{}});
 if(permitido!==true){el('lista-duenos').replaceChildren();throw Error('Solo administradores autorizados gestionan accesos.');}
 const [menus,{accesos}]=await Promise.all([api('/rest/v1/piloto_menus_completos?select=slug,original&order=slug.asc'),gestionar({accion:'listar'})]);
 const seleccionado=el('negocio-dueno').value;el('negocio-dueno').replaceChildren();
 for(const m of menus){const o=nodo('option',m.original.nombre||m.slug);o.value=m.slug;el('negocio-dueno').append(o);}
 if(menus.some(x=>x.slug===seleccionado))el('negocio-dueno').value=seleccionado;
 el('lista-duenos').replaceChildren();
 for(const a of accesos){
  const card=nodo('article',undefined,'tarjeta acceso-negocio');
  card.append(nodo('h3',a.nombre),nodo('strong',a.correo),nodo('p','Negocio / slug: '+a.negocio),nodo('p',a.activo?'🟢 Activo':'🔴 Inactivo'),nodo('small','Actualizado: '+(a.actualizado_en?new Date(a.actualizado_en).toLocaleString('es-MX'):'Sin fecha')));
  const acciones=nodo('div',undefined,'acciones-dueno');
  for(const [accion,texto] of [['recuperacion','Enviar recuperación'],['temporal','Asignar contraseña temporal'],['estado',a.activo?'Desactivar acceso':'Reactivar acceso']]){
   const b=nodo('button',texto);b.type='button';b.onclick=()=>abrirAccion(a,accion);acciones.append(b);
  }
  card.append(acciones);el('lista-duenos').append(card);
 }
 if(!accesos.length)el('lista-duenos').append(nodo('p','Todavía no hay accesos de negocios.'));
}
function abrirAccion(a,accion){
 accionPendiente={accion,correo:a.correo,negocio:a.negocio,actualizado_en:a.actualizado_en,activo:!a.activo,confirmado:true};
 el('form-accion').reset();el('zona-temporal').hidden=accion!=='temporal';
 for(const id of ['temporal','temporal-confirmar'])el(id).required=accion==='temporal';
 const titulos={recuperacion:'Enviar recuperación',temporal:'Asignar contraseña temporal',estado:a.activo?'Desactivar acceso':'Reactivar acceso'};
 el('titulo-accion').textContent=titulos[accion];
 const detalle=accion==='estado'?(a.activo?'Sus siguientes consultas y cambios serán rechazados. Conserva su cuenta Auth y los datos del negocio.':'Volverá a poder administrar este negocio con su misma cuenta.'):
 accion==='temporal'?'Cambiará la contraseña de esta cuenta para TODOS sus negocios. Compártela en privado y pide al dueño cambiarla por una personal. No vence automáticamente.':'Supabase enviará un enlace para elegir una nueva contraseña. El dueño debe abrirlo desde su correo.';
 el('detalle-accion').textContent=a.correo+' · '+a.nombre+' ('+a.negocio+'). '+detalle;
 el('resultado-accion').textContent='';el('confirmar-accion').showModal();
}
el('cancelar-accion').onclick=()=>el('confirmar-accion').close();
el('confirmar-accion').addEventListener('close',()=>{accionPendiente=null;el('form-accion').reset();});
el('form-accion').onsubmit=e=>{e.preventDefault();tarea(async()=>{
 if(!accionPendiente)return;
 try{
  const datos={...accionPendiente};
  if(datos.accion==='temporal'){
   if(el('temporal').value!==el('temporal-confirmar').value)throw Error('Las contraseñas no coinciden.');
   datos.password=el('temporal').value;
  }
  const r=await gestionar(datos);el('confirmar-accion').close();aviso(r.mensaje);
  try{await cargarDuenos();}catch{aviso(r.mensaje+' No se pudo actualizar la lista; pulsa Actualizar accesos.');}
 }catch(error){el('resultado-accion').textContent=error.message;throw error;}
});};
el('login').onsubmit=e=>{e.preventDefault();tarea(async()=>{
 cuenta=await api('/auth/v1/token?grant_type=password',{method:'POST',datos:{email:el('correo').value.trim(),password:el('clave').value}});el('clave').value='';
 try{await cargarDuenos();sessionStorage.setItem('exhibicionPilotoSesion',JSON.stringify(cuenta));mostrar();aviso('Accesos de negocios actualizados.');}
 catch(error){cuenta=null;sessionStorage.removeItem('exhibicionPilotoSesion');mostrar();throw error;}
});};
el('form-dueno').onsubmit=e=>{e.preventDefault();permisoPendienteDueno={correo:el('correo-dueno').value.trim(),negocio:el('negocio-dueno').value,activo:el('activo-dueno').value==='true'};el('detalle-acceso-dueno').textContent=(permisoPendienteDueno.activo?'Autorizar a ':'Desactivar a ')+permisoPendienteDueno.correo+' para '+el('negocio-dueno').selectedOptions[0].textContent+'. Se conserva su cuenta y la información del negocio.';el('confirmar-acceso-dueno').showModal();};
el('cancelar-acceso-dueno').onclick=()=>{permisoPendienteDueno=null;el('confirmar-acceso-dueno').close();};
el('guardar-acceso-dueno').onclick=()=>tarea(async()=>{if(!permisoPendienteDueno)return;await api('/rest/v1/rpc/dueno_acceso_guardar_v53',{method:'POST',datos:permisoPendienteDueno});permisoPendienteDueno=null;el('confirmar-acceso-dueno').close();await cargarDuenos();aviso('Permiso guardado. Preparar un acceso no crea una cuenta de Auth.');});
el('recargar').onclick=()=>tarea(cargarDuenos);
el('salir').onclick=()=>tarea(async()=>{try{await api('/auth/v1/logout',{method:'POST'});}finally{cuenta=null;sessionStorage.removeItem('exhibicionPilotoSesion');el('lista-duenos').replaceChildren();mostrar();}});
el('enlace-duenos').value=new URL('dueno.html',location.href).href;
el('copiar-acceso-dueno').onclick=()=>tarea(async()=>{await navigator.clipboard.writeText(el('enlace-duenos').value);aviso('Enlace copiado.');});
try{const s=JSON.parse(sessionStorage.getItem('exhibicionPilotoSesion'));if(s?.expires_at*1000>Date.now())cuenta=s;}catch{}
mostrar();if(cuenta)tarea(cargarDuenos);
