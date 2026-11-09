(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co';
const KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
const estado=document.getElementById('beneficios-estado'),form=document.getElementById('beneficios-form'),dia=document.getElementById('beneficios-dia'),mes=document.getElementById('beneficios-mes');
for(let i=1;i<=31;i++){const o=document.createElement('option');o.value=String(i);o.textContent=String(i);dia.append(o);}
const token=location.hash.slice(1).trim().toLowerCase();
async function rpc(nombre,datos){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(BASE+'/rest/v1/rpc/'+nombre,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(datos),cache:'no-store',signal:controller.signal});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(j.message||'No se pudo completar la solicitud.');
    return j;
  }catch(e){
    if(e.name==='AbortError')throw Error('La conexión tardó demasiado. Estamos verificando si tu registro sí se guardó…');
    throw e;
  }finally{clearTimeout(timeout);}
}
async function cargar(){
  if(!/^[a-f0-9]{64}$/.test(token)){estado.textContent='Esta invitación no es válida.';return;}
  try{
    const r=await rpc('cliente_beneficio_consultar',{token});
    if(!r.valido){estado.textContent='Esta invitación venció, ya fue utilizada o no es válida. Si quieres participar, solicita una nueva invitación a recepción.';return;}
    if(r.ya_activo){estado.textContent='✅ Ya estás participando en nuestros beneficios. No necesitas registrarte otra vez.';return;}
    estado.textContent=(r.nombre?'Hola, '+r.nombre+'. ':'')+'Tu participación es opcional.';
    form.hidden=false;
  }catch(e){estado.textContent=e.message;}
}
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  const boton=form.querySelector('button');boton.disabled=true;boton.textContent='Guardando…';
  try{
    await rpc('cliente_beneficio_aceptar',{token,dia:Number(dia.value),mes:Number(mes.value)});
    form.hidden=true;
    location.hash='';
    estado.textContent='✅ Listo. Tu día y mes de cumpleaños quedaron registrados para beneficios y detalles especiales. Puedes retirar tu consentimiento cuando quieras contactándonos por el medio indicado en el Aviso de Privacidad.';
  }catch(err){
    try{
      const verificacion=await rpc('cliente_beneficio_consultar',{token});
      if(verificacion?.ya_activo){
        form.hidden=true;
        estado.textContent='✅ Listo. Tu participación quedó registrada correctamente.';
        return;
      }
    }catch{}
    estado.textContent=err.message;
    boton.disabled=false;
    boton.textContent='Guardar mi participación';
  }
});
cargar();
})();