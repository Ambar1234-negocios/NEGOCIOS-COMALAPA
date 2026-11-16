'use strict';
(async()=>{
 const base='https://gyvoyzxsgckpfkagzjtf.supabase.co',key='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
 const estado=document.getElementById('recuperacion-estado'),form=document.getElementById('nueva-contrasena'),guardar=document.getElementById('guardar-contrasena');
 const hash=new URLSearchParams(location.hash.slice(1)),query=new URLSearchParams(location.search);
 // Remove credentials from the address bar immediately. Never persist recovery tokens.
 history.replaceState(null,'',location.pathname);
 let token=null,busy=false;
 async function auth(path,method='GET',data){
  const r=await fetch(base+'/auth/v1/'+path,{method,headers:{apikey:key,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  const body=await r.json().catch(()=>null);
  if(!r.ok)throw Error(r.status===429?'Demasiados intentos. Espera unos minutos.':method==='PUT'?'No se pudo cambiar la contraseña. Revisa sus requisitos; si el enlace venció, solicita otro.':'El enlace no es válido o ya venció. Solicita otro desde tu panel.');
  return body;
 }
 try{
  if(hash.has('error')||query.has('error'))throw Error('El enlace venció o ya fue utilizado. Solicita otro desde tu panel.');
  if(query.get('type')==='recovery'&&query.get('token_hash')){
   const session=await auth('verify','POST',{type:'recovery',token_hash:query.get('token_hash')});token=session.access_token;
  }else if(hash.get('type')==='recovery')token=hash.get('access_token');
  if(!token)throw Error('Abre el enlace de recuperación que recibiste por correo. Una sesión normal no habilita esta pantalla.');
  const user=await auth('user'); // Auth verifies the signature and expiry before claims are trusted.
  const part=token.split('.')[1];const claims=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));
  // Implicit email recovery is issued by GoTrue with AMR otp, not recovery.
  // The explicit recovery callback above and Auth-verified token are both required.
  if(claims.sub!==user.id||!Number.isFinite(claims.exp)||claims.exp*1000<=Date.now()||!claims.amr?.some(a=>a.method==='otp'||a.method==='recovery'))throw Error('Este enlace no corresponde a una sesión de recuperación válida. Solicita otro.');
  estado.textContent='Enlace válido para '+user.email+'. Escribe tu nueva contraseña.';form.hidden=false;
 }catch(e){token=null;estado.textContent=e.message;}
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||!token)return;
  const nueva=document.getElementById('nueva'),repetir=document.getElementById('repetir');
  if(nueva.value!==repetir.value){estado.textContent='Las contraseñas no coinciden.';return;}
  if(!form.reportValidity())return;
  busy=true;guardar.disabled=true;
  try{
   await auth('user','PUT',{password:nueva.value});form.reset();form.hidden=true;
   // Close the recovery session; do not replace an administrator's other stored session.
   await auth('logout?scope=local','POST').catch(()=>{});token=null;
   sessionStorage.removeItem('exhibicionDuenoSesion');
   estado.textContent='Contraseña actualizada. Vuelve a Mi negocio e inicia sesión con tu nueva contraseña.';
  }catch(e){estado.textContent=e.message;}finally{busy=false;guardar.disabled=false;}
 };
})();
