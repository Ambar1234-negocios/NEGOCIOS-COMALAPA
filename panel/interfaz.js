'use strict';
function activarPanel(grupo,id){document.querySelectorAll('[data-grupo="'+grupo+'"]').forEach(n=>n.hidden=n.id!==id);document.querySelectorAll('[data-ir][data-navega="'+grupo+'"]').forEach(b=>{const activo=b.dataset.ir===id;b.classList.toggle('activa',activo);b.setAttribute('aria-pressed',String(activo));});}
document.querySelectorAll('[data-ir]').forEach(b=>b.addEventListener('click',()=>activarPanel(b.dataset.navega,b.dataset.ir)));
function estadoServicio(perfil,ahora=new Date()){
 if(!perfil)return{clase:'neutro',titulo:'Selecciona un negocio',detalle:''};
 const pausa=perfil.cerrado_temporalmente&&(!perfil.cierre_hasta||Date.parse(perfil.cierre_hasta)>ahora.getTime());
 if(pausa)return{clase:'cerrado',titulo:perfil.cierre_hasta?'Pausado hasta '+new Date(perfil.cierre_hasta).toLocaleString('es-MX',{timeZone:'America/Mexico_City',dateStyle:'medium',timeStyle:'short'}):'Cerrado temporalmente',detalle:perfil.motivo_cierre||'El dueño pausó el servicio.'};
 const partes=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(ahora).map(p=>[p.type,p.value]));
 const nombres=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'],dia=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(partes.weekday),minuto=Number(partes.hour)*60+Number(partes.minute),horarios=perfil.datos?.horarios;
 if(!horarios||!Object.keys(horarios).length)return{clase:'neutro',titulo:'Horario por configurar',detalle:'Define los días en que atiendes.'};
 const min=t=>{if(!/^\d{2}:\d{2}$/.test(t||''))return NaN;return Number(t.slice(0,2))*60+Number(t.slice(3));};
 const intervalos=[];for(let d=-1;d<=7;d++){const h=horarios[nombres[(dia+d+7)%7]];if(h?.modo!=='abierto')continue;for(const t of h.turnos||[]){const a=min(t.inicio),b=min(t.fin);if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)continue;intervalos.push({inicio:d*1440+a,fin:d*1440+b+(b<a?1440:0),dia:nombres[(dia+d+7)%7],hora:t.inicio});}}
 const abierto=intervalos.some(t=>t.inicio<=minuto&&minuto<t.fin);if(abierto)return{clase:'abierto',titulo:'Abierto según horario',detalle:'El servicio está dentro de su horario de atención.'};
 const siguiente=intervalos.filter(t=>t.inicio>minuto).sort((a,b)=>a.inicio-b.inicio)[0];return{clase:'cerrado',titulo:'Cerrado por horario',detalle:siguiente?'Próxima apertura: '+siguiente.dia+' a las '+siguiente.hora:'No hay días de venta programados.'};
}
function pintarEstadoServicio(perfil,id){const zona=document.getElementById(id);if(!zona)return;const e=estadoServicio(perfil);zona.className='estado-servicio '+e.clase;zona.replaceChildren();const punto=document.createElement('span'),titulo=document.createElement('strong'),detalle=document.createElement('p');punto.className='indicador';punto.setAttribute('aria-hidden','true');titulo.textContent=e.titulo;detalle.textContent=e.detalle;zona.append(punto,titulo,detalle);}
activarPanel('dueno','operacion');activarPanel('admin','revision-negocio');
