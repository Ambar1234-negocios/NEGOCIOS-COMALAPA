'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co',KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD',BUCKET='piloto-negocios';
const el=id=>document.getElementById(id), aviso=t=>el('estado').textContent=t;
let cuenta=null,negocio=null,control=null,productos=[],urls=[],promociones=[],planes=[];
const dias=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const campos={slogan:'Frase corta',descripcion:'Descripción',servicios:'Servicios (separados por coma)',palabrasClave:'Palabras para encontrar el negocio',telefono:'Teléfono',whatsapp:'WhatsApp',direccion:'Dirección',maps:'Enlace de Google Maps',facebook:'Facebook',instagram:'Instagram',tiktok:'TikTok',sitioWeb:'Sitio web',video:'Enlace de video'};
function nodo(tag,texto,clase){const n=document.createElement(tag);if(texto!==undefined)n.textContent=texto;if(clase)n.className=clase;return n;}
function entrada(contenedor,id,label,tipo='text'){const l=nodo('label',label);l.htmlFor=id;const i=document.createElement(tipo==='textarea'?'textarea':'input');i.id=id;if(tipo!=='textarea')i.type=tipo;i.maxLength=tipo==='textarea'?2000:500;contenedor.append(l,i);return i;}
function pesos(v){if(!/^\d+(\.\d{1,2})?$/.test(v))throw Error('Usa un precio positivo con hasta dos decimales.');const n=Math.round(Number(v)*100);if(n>100000000)throw Error('El precio es demasiado alto.');return n;}
async function api(ruta,{method='GET',datos,blob=false}={}){const headers={apikey:KEY,...(cuenta?{Authorization:'Bearer '+cuenta.access_token}:{}),...(datos?{'Content-Type':datos instanceof Blob?datos.type:'application/json'}:{})};if(ruta.startsWith('/rest/'))headers.Prefer='return=representation';const r=await fetch(BASE+ruta,{method,headers,body:datos?(datos instanceof Blob?datos:JSON.stringify(datos)):undefined});if(!r.ok){let d;try{d=await r.json()}catch{}const error=new Error(r.status===401?'La sesión venció. Cierra sesión y vuelve a entrar.':d?.message||d?.msg||d?.error_description||'No se pudo guardar. Revisa tu conexión.');error.estadoHTTP=r.status;throw error;}if(blob)return r.blob();const t=await r.text();return t?JSON.parse(t):null;}
let trabajando=false;
async function tarea(fn){if(trabajando)return;trabajando=true;const originales=Array.from(document.querySelectorAll('button'),b=>[b,b.disabled]);originales.forEach(([b])=>b.disabled=true);try{return await fn()}catch(e){aviso(e.message)}finally{originales.forEach(([b,deshabilitado])=>b.disabled=deshabilitado);trabajando=false;}}
let tokenVistaValidado=null,validacionVista=null;
function cerrarVistaPrivada(){document.body?.classList?.remove('sesion-autorizada');el('panel').hidden=true;el('acceso').hidden=false;}
function mostrar(){
 const token=cuenta?.access_token;el('usuario').textContent=cuenta?'Cuenta: '+cuenta.user.email:'';
 if(!token){tokenVistaValidado=null;validacionVista=null;cerrarVistaPrivada();return;}
 if(token===tokenVistaValidado){el('acceso').hidden=true;el('panel').hidden=false;document.body?.classList?.add('sesion-autorizada');return;}
 cerrarVistaPrivada();if(validacionVista?.token===token)return;
 const requiereMaestro=document.body?.dataset?.acceso==='maestro',requiereRecepcion=document.body?.dataset?.acceso==='recepcion';
 validacionVista={token};
 (async()=>{try{await api('/auth/v1/user');if(requiereMaestro||requiereRecepcion){const permitido=await api('/rest/v1/rpc/'+(requiereRecepcion?'piloto_es_operador':'piloto_es_admin'),{method:'POST',datos:{}});if(permitido!==true)throw Error('Esta cuenta no tiene autorización para este panel.');}if(cuenta?.access_token!==token)return;tokenVistaValidado=token;el('acceso').hidden=true;el('panel').hidden=false;document.body?.classList?.add('sesion-autorizada');}catch(e){if(cuenta?.access_token!==token)return;cerrarVistaPrivada();aviso(e.message);}finally{if(validacionVista?.token===token)validacionVista=null;}})();
}
function liberarFotos(){for(const u of urls)URL.revokeObjectURL(u);urls=[];}
async function fotoPrivada(ruta,img){if(!ruta)return;try{const b=await api('/storage/v1/object/authenticated/'+BUCKET+'/'+ruta,{blob:true});const u=URL.createObjectURL(b);urls.push(u);img.src=u;img.hidden=false;}catch{img.hidden=true;}}
async function comprimir(archivo){if(!archivo||!['image/jpeg','image/png','image/webp'].includes(archivo.type))throw Error('Selecciona una foto JPG, PNG o WebP.');if(archivo.size>12*1024*1024)throw Error('La foto original debe pesar menos de 12 MB.');const img=await createImageBitmap(archivo);try{if(img.width*img.height>40000000)throw Error('La imagen tiene demasiados píxeles. Usa una foto más pequeña.');const escala=Math.min(1,1200/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*escala));c.height=Math.max(1,Math.round(img.height*escala));c.getContext('2d').drawImage(img,0,0,c.width,c.height);const b=await new Promise(ok=>c.toBlob(ok,'image/webp',.78));if(!b||b.size>1048576)throw Error('No pudimos reducir esta foto a menos de 1 MB. Prueba con otra.');return b;}finally{img.close();}}
async function subir(archivo){const b=await comprimir(archivo),ruta=cuenta.user.id+'/'+crypto.randomUUID()+'.webp';await api('/storage/v1/object/'+BUCKET+'/'+ruta,{method:'POST',datos:b});return{ruta,kb:Math.round(b.size/1024)};}
