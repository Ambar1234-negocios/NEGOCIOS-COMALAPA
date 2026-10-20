'use strict';
async function iniciarPantalla(){await api('/rest/v1/rpc/piloto_admin_listar',{method:'POST',datos:{}});await cargarPantalla();}
el('login').onsubmit=e=>{e.preventDefault();tarea(async()=>{cuenta=await api('/auth/v1/token?grant_type=password',{method:'POST',datos:{email:el('correo').value.trim(),password:el('clave').value}});el('clave').value='';sessionStorage.setItem('exhibicionPilotoSesion',JSON.stringify(cuenta));mostrar();await iniciarPantalla();});};
el('salir').onclick=()=>tarea(async()=>{try{await api('/auth/v1/logout',{method:'POST'})}finally{cuenta=null;sessionStorage.removeItem('exhibicionPilotoSesion');mostrar();aviso('Sesión cerrada.');}});
try{const s=JSON.parse(sessionStorage.getItem('exhibicionPilotoSesion'));if(s?.expires_at*1000>Date.now())cuenta=s;}catch{}mostrar();if(cuenta)tarea(iniciarPantalla);
