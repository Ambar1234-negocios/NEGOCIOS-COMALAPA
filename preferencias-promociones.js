(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co';
const KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
const estado=document.getElementById('preferencias-estado');
const acciones=document.getElementById('preferencias-acciones');
const baja=document.getElementById('preferencias-baja');
const volver=document.getElementById('preferencias-volver');
const token=location.hash.slice(1).trim().toLowerCase();
async function rpc(nombre,datos){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);
  try{
    const r=await fetch(BASE+'/rest/v1/rpc/'+nombre,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(datos),cache:'no-store',signal:c.signal});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(j.message||'No se pudo completar la solicitud.');
    return j;
  }finally{clearTimeout(t);}
}
async function cargar(){
  if(!/^[a-f0-9]{64}$/.test(token)){estado.textContent='Este enlace no es válido.';return;}
  try{
    const r=await rpc('cliente_promocion_preferencia_consultar',{token});
    if(!r.valido){estado.textContent='Este enlace venció o ya no está disponible.';return;}
    if(r.baja_promociones){estado.textContent='✅ Ya no estás recibiendo promociones.';return;}
    estado.textContent=(r.nombre?'Hola, '+r.nombre+'. ':'')+'Tú decides si quieres seguir recibiendo promociones.';
    acciones.hidden=false;
  }catch(e){estado.textContent=e.message;}
}
baja?.addEventListener('click',async()=>{
  baja.disabled=true;baja.textContent='Guardando…';
  try{
    await rpc('cliente_promocion_preferencia_baja',{token});
    acciones.hidden=true;
    estado.textContent='✅ Listo. Ya no recibirás mensajes promocionales. Tu historial de pedidos y tus beneficios se conservan.';
  }catch(e){
    estado.textContent=e.message;baja.disabled=false;baja.textContent='Dejar de recibir promociones';
  }
});
volver?.addEventListener('click',()=>{location.href='index.html';});
cargar();
})();