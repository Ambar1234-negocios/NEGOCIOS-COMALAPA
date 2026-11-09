'use strict';
const vistas=['menu','promociones','compartir','ajustes'];
function vistaDueno(v){for(const x of vistas)el('vista-'+x).hidden=x!==v;for(const b of document.querySelectorAll('[data-vista]'))b.setAttribute('aria-current',b.dataset.vista===v?'page':'false');if(v==='compartir')qrDueno();}
for(const b of document.querySelectorAll('[data-vista]'))b.onclick=()=>vistaDueno(b.dataset.vista);
let qrActual='',aparienciasDueno=null;
function qrDueno(){if(!menuCompleto)return;const url=new URL('/',location.origin);url.searchParams.set('negocio',menuCompleto.slug);el('liga-dueno').value=url.href;el('compartir-whatsapp').href='https://wa.me/?text='+encodeURIComponent('Consulta el menú de '+menuCompleto.borrador.nombre+': '+url.href);if(qrActual===url.href)return;const qr=qrcode(0,'M');qr.addData(url.href);qr.make();el('qr-dueno').innerHTML=qr.createSvgTag({cellSize:6,margin:24,scalable:true});el('qr-dueno').prepend(nodo('h3',menuCompleto.borrador.nombre));qrActual=url.href;}
el('copiar-liga').onclick=()=>tarea(async()=>{await navigator.clipboard.writeText(el('liga-dueno').value);aviso('Enlace copiado.');});
el('descargar-qr').onclick=()=>{const svg=el('qr-dueno').querySelector('svg');if(!svg)return;const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=nodo('a');a.href=url;a.download='menu-'+menuCompleto.slug+'-qr.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
el('imprimir-qr').onclick=()=>{vistaDueno('compartir');print();};
el('panel-oscuro').checked=localStorage.getItem('dueno-panel-oscuro')==='si';document.body.classList.toggle('dueno-oscuro',el('panel-oscuro').checked);el('panel-oscuro').onchange=()=>{document.body.classList.toggle('dueno-oscuro',el('panel-oscuro').checked);localStorage.setItem('dueno-panel-oscuro',el('panel-oscuro').checked?'si':'no');};
el('guardar-apariencia-dueno').onclick=()=>tarea(async()=>{if(!menuCompleto)throw Error('Primero abre tu negocio.');await api('/rest/v1/rpc/dueno_apariencia_guardar_v53',{method:'POST',datos:{negocio:menuCompleto.slug,color:el('color-menu-dueno').value,oscuro:el('menu-oscuro-dueno').checked}});aparienciasDueno=null;el('estado-apariencia').textContent='Apariencia publicada. Abre tu menú para verla.';});
const cargaOriginalDueno=cargarMenuCompleto;cargarMenuCompleto=async()=>{await cargaOriginalDueno();qrDueno();if(!aparienciasDueno)aparienciasDueno=await api('/rest/v1/rpc/dueno_apariencias_publicas_v53',{method:'POST',datos:{}});const a=aparienciasDueno.find(x=>x.slug===menuCompleto.slug);el('color-menu-dueno').value=a?.color||'#205747';el('menu-oscuro-dueno').checked=a?.oscuro===true;};
// The server preserves carousel selection for owners. Hide this global administration control.
el('editar-carrusel').hidden=true;document.querySelector('label[for="editar-carrusel"]').hidden=true;el('editar-carrusel').nextElementSibling.hidden=true;
el('crear-cuenta-dueno').onclick=()=>tarea(async()=>{const email=el('correo').value.trim(),password=el('clave').value;if(!el('correo').checkValidity()||!email)throw Error('Escribe tu correo autorizado.');if(password.length<12)throw Error('Elige una contraseña de al menos 12 caracteres.');const r=await api('/auth/v1/signup?redirect_to='+encodeURIComponent(new URL('dueno.html',location.href).href),{method:'POST',datos:{email,password}});el('clave').value='';if(r?.access_token){cuenta=r;sessionStorage.setItem('exhibicionDuenoSesion',JSON.stringify(cuenta));mostrar();await cargarMenuCompleto();}else el('auth-dueno').textContent='Revisa tu correo para confirmar la cuenta. Si ya tenías cuenta, usa Entrar o Recuperar contraseña. Si no llega el correo, avisa al administrador.';});
el('recuperar-dueno').onclick=()=>tarea(async()=>{const email=el('correo').value.trim();if(!email||!el('correo').checkValidity())throw Error('Escribe tu correo.');await api('/auth/v1/recover?redirect_to='+encodeURIComponent(new URL('dueno.html',location.href).href),{method:'POST',datos:{email}});el('auth-dueno').textContent='Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.';});
(async()=>{const h=new URLSearchParams(location.hash.slice(1));if(!h.has('access_token'))return;try{const token=h.get('access_token'),r=await fetch(BASE+'/auth/v1/user',{headers:{apikey:KEY,Authorization:'Bearer '+token}});if(!r.ok)throw Error('El enlace de acceso venció. Solicita otro.');cuenta={access_token:token,refresh_token:h.get('refresh_token'),expires_at:Math.floor(Date.now()/1000)+Number(h.get('expires_in')||3600),user:await r.json()};sessionStorage.setItem('exhibicionDuenoSesion',JSON.stringify(cuenta));const recovery=h.get('type')==='recovery';history.replaceState(null,'',location.pathname+location.search);if(recovery){const d=nodo('dialog'),f=nodo('form'),t=nodo('h2','Elige tu nueva contraseña'),i=nodo('input'),b=nodo('button','Guardar contraseña');i.type='password';i.minLength=12;i.required=true;i.autocomplete='new-password';f.append(t,i,b);f.onsubmit=e=>{e.preventDefault();tarea(async()=>{await api('/auth/v1/user',{method:'PUT',datos:{password:i.value}});i.value='';d.close();d.remove();mostrar();await cargarMenuCompleto();aviso('Contraseña actualizada.');});};d.append(f);document.body.append(d);d.showModal();}else{mostrar();await cargarMenuCompleto();}}catch(e){aviso(e.message);}})();
vistaDueno('menu');


function textoPromoDueno(p){
  let mensaje=String(p.mensaje||'').replace('{nombre}','').replace(/Hola,\s*👋/,'Hola 👋').replace(/Hola,\s+/,'Hola ');
  if(p.vigencia_hasta){
    const fecha=new Date(p.vigencia_hasta+'T12:00:00');
    mensaje=mensaje.replace('{vigencia}',fecha.toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}));
  }else mensaje=mensaje.replace('{vigencia}','');
  return mensaje.replace(/\s+/g,' ').replace(/\s+([.,])/g,'$1').trim();
}
async function copiarPromoDueno(p){
  const mensaje=textoPromoDueno(p);
  try{await navigator.clipboard.writeText(mensaje);}
  catch{
    const area=nodo('textarea');area.value=mensaje;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();
  }
  aviso('Mensaje de la promoción copiado.');
}
function compartirPromoDueno(p){
  const a=nodo('a');a.href='https://wa.me/?text='+encodeURIComponent(textoPromoDueno(p));a.target='_blank';a.rel='noopener noreferrer';a.click();
}
async function cargarPromocionesNegocio(){
  const zona=el('promo-negocio-lista'),activasZona=el('promo-negocio-activas');if(!zona)return;
  const [lista,activas]=await Promise.all([
    api('/rest/v1/rpc/dueno_promociones_listar',{method:'POST',datos:{}}),
    api('/rest/v1/rpc/dueno_promociones_activas_listar',{method:'POST',datos:{}})
  ]);
  zona.replaceChildren();
  if(!lista.length)zona.append(nodo('p','Todavía no has enviado promociones a revisión.','nota'));
  for(const p of lista){
    const card=nodo('article',undefined,'tarjeta');
    const estado=p.estado==='aprobada'?'✅ Aprobada':p.estado==='rechazada'?'🔴 Rechazada':'🟡 Pendiente de revisión';
    card.append(nodo('strong',p.titulo),nodo('p',estado),nodo('p',p.detalle),nodo('small',p.negocio_nombre+(p.vigencia_hasta?' · Hasta '+p.vigencia_hasta:'')));
    if(p.nota_admin)card.append(nodo('p','Nota de Exhibición: '+p.nota_admin,'nota'));
    zona.append(card);
  }
  if(!activasZona)return;
  activasZona.replaceChildren();
  if(!activas.length){activasZona.append(nodo('p','Todavía no hay campañas activas con seguimiento de servicios.','nota'));return;}
  for(const p of activas){
    const card=nodo('article',undefined,'tarjeta');
    const gastado=Number(p.aporte_negocio_gastado_centavos||0),comprometido=Number(p.aporte_negocio_comprometido_centavos||0),tope=p.presupuesto_negocio_centavos;
    const dinero=c=>'$'+new Intl.NumberFormat('es-MX',{minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(c||0)/100);
    card.append(nodo('strong',p.titulo),
      nodo('p','✅ Servicios completados: '+Number(p.usos_completados||0)+' · ⏳ En proceso: '+Number(p.usos_reservados||0)),
      nodo('p','Aporte usado por servicios entregados: '+dinero(gastado)+(tope!=null?' de '+dinero(tope):'')),
      nodo('p','Comprometido contando pedidos en proceso: '+dinero(comprometido),'nota'),
      nodo('small',(p.activa?'🟢 Activa':'🔴 Inactiva')+(p.vigencia_hasta?' · Hasta '+p.vigencia_hasta:'')));
    const copiar=nodo('button','📋 Copiar mensaje','secundario');copiar.type='button';copiar.onclick=()=>tarea(()=>copiarPromoDueno(p));
    const compartir=nodo('button','📲 Compartir por WhatsApp','secundario');compartir.type='button';compartir.onclick=()=>compartirPromoDueno(p);
    card.append(copiar,compartir);
    activasZona.append(card);
  }
}
function actualizarValorPromoNegocio(){
  const tipo=el('promo-negocio-tipo')?.value,zona=el('promo-negocio-valor-zona'),campo=el('promo-negocio-valor');
  if(!zona||!campo)return;const requiere=tipo==='porcentaje'||tipo==='monto';zona.hidden=!requiere;campo.required=requiere;
  if(tipo==='porcentaje'){campo.max='100';campo.placeholder='Ej. 25';}
  else if(tipo==='monto'){campo.removeAttribute('max');campo.placeholder='Ej. 20';}
}
if(el('promo-negocio-tipo')){el('promo-negocio-tipo').onchange=actualizarValorPromoNegocio;actualizarValorPromoNegocio();}
if(el('promo-negocio-form'))el('promo-negocio-form').onsubmit=e=>{e.preventDefault();tarea(async()=>{
  if(!menuCompleto)throw Error('Primero carga tu negocio.');
  const tipo=el('promo-negocio-tipo').value;
  const valor=(tipo==='porcentaje'||tipo==='monto')?Number(el('promo-negocio-valor').value):null;
  await api('/rest/v1/rpc/dueno_promocion_solicitar',{method:'POST',datos:{
    negocio:menuCompleto.slug,tipo,valor,
    titulo:el('promo-negocio-titulo').value.trim(),
    detalle:el('promo-negocio-detalle').value.trim(),
    vigencia_hasta:el('promo-negocio-vigencia').value||null
  }});
  el('promo-negocio-form').reset();actualizarValorPromoNegocio();await cargarPromocionesNegocio();aviso('Promoción enviada a revisión. Exhibición decidirá si se activa como campaña.');
});};
const vistaDuenoOriginal=vistaDueno;
vistaDueno=function(v){vistaDuenoOriginal(v);if(v==='promociones')tarea(cargarPromocionesNegocio);};
