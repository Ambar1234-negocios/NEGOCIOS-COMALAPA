/* Vista exclusiva de Forno Mexa: catálogo compartido, pedidos directos por WhatsApp. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v/100);
const esGenerico=location.pathname.endsWith('/menu-negocio.html');
const slug=esGenerico?new URLSearchParams(location.search).get('negocio')||'':'forno-mexa';
let datos={cliente:'',pago:'',mesa:'',direccion:''},ultimo=null,renderId=0;
const numero=v=>{let n=String(v||'').replace(/\D/g,'');if(n.length===10)n='52'+n;else if(/^521\d{10}$/.test(n))n='52'+n.slice(3);return /^\d{11,15}$/.test(n)?n:'';};
document.addEventListener('input',e=>{const k=e.target.dataset.directoCampo;if(['cliente','pago','mesa','direccion'].includes(k))datos[k]=e.target.value;});
document.addEventListener('change',e=>{const k=e.target.dataset.directoCampo;if(['cliente','pago','mesa','direccion'].includes(k))datos[k]=e.target.value;});
const comida=n=>n?.categoria==='comida';
const propia=n=>n?.delivery===true&&['gratis','propio'].includes(n.tipoDelivery);
const modalidad=(n,m)=>comida(n)?(m==='recoger'?'recoger':'mesa'):(m==='domicilio'&&propia(n)?'domicilio':'recoger');
const lugar=(modo,n)=>comida(n)?(modo==='recoger'?'Para llevar':'Para comer aquí'):(modo==='domicilio'?'Entrega del negocio':'Pasar a recoger');
const pagos=n=>['Efectivo','Transferencia',...(n?.slug==='esenciales-decants'?['Tarjeta al recibir']:[])];
function resumen(p,total,selector,modo='mesa',cuponHtml='',cuponTexto=''){
 modo=modalidad(p.negocio,modo);ultimo={pedido:p,total,modo,cuponTexto};
 const grupo='directo-modo-'+(++renderId);
 const modalidades=`<fieldset class="directo-modalidad"><legend>¿Cómo lo quieres?</legend><div>${(comida(p.negocio)?[['mesa','Para comer aquí'],['recoger','Para llevar']]:[['recoger','Pasar a recoger'],...(propia(p.negocio)?[['domicilio','Entrega del negocio']]:[])]).map(([v,t])=>`<label><input type="radio" name="${grupo}" data-modo-entrega value="${v}" ${modo===v?'checked':''}><span>${t}</span></label>`).join('')}</div></fieldset>`;
 return `<h4>Tu pedido · ${esc(p.negocio?.nombre||'Mi negocio')}</h4>${modalidades}${p.lineas.map(l=>`<div class="pedido-linea"><div><strong>${l.cantidad} × ${esc(l.producto.nombre)}</strong>${(l.opciones||[]).map(o=>`<p>${esc(o.grupoNombre||'Opción')}: ${esc(o.nombre)}</p>`).join('')}${(l.extras||[]).map(x=>`<p>Extra: ${esc(x.nombre)}</p>`).join('')}${l.nota?`<p>Indicación: ${esc(l.nota)}</p>`:''}</div><div class="pedido-controles"><button type="button" data-pedido-accion="editar" data-linea="${esc(l.id)}">Editar</button><button type="button" data-pedido-accion="quitar" data-linea="${esc(l.id)}">Quitar</button></div></div>`).join('')}${cuponHtml}<p class="pedido-total">Total de productos: ${money(total)}</p><section class="pedido-checkout directo-checkout"><h4>${lugar(modo,p.negocio)}</h4><label>Tu nombre<input data-directo-campo="cliente" maxlength="120" autocomplete="given-name" value="${esc(datos.cliente)}" required></label>${modo==='domicilio'?`<label>Dirección de entrega<textarea data-directo-campo="direccion" maxlength="500" required>${esc(datos.direccion)}</textarea></label><p>${p.negocio.tipoDelivery==='gratis'?'Envío gratis dentro de Comalapa. Consulta horarios de entrega.':'Costo, zona y horario de entrega por confirmar con el negocio.'}</p>`:''}${modo==='mesa'?`<label>Mesa (opcional)<input data-directo-campo="mesa" maxlength="30" value="${esc(datos.mesa)}" placeholder="Por ejemplo: 2"></label>`:''}<label>¿Cómo prefieres pagar?<select data-directo-campo="pago"><option value="">Selecciona</option>${pagos(p.negocio).map(v=>`<option ${datos.pago===v?'selected':''}>${v}</option>`).join('')}</select></label><small>El negocio confirma disponibilidad, precio final y formas de pago. Esto no realiza un cobro.</small><p>Se abrirá el WhatsApp de ${esc(p.negocio?.nombre||'este negocio')}. Pulsa Enviar para compartir tu pedido y espera su confirmación.</p><button type="button" data-pedido-accion="enviar">Continuar por WhatsApp</button><p role="status" data-directo-estado></p></section>`;
}
function enviar({negocio,origen,total,modalidad='mesa'}){
 const host=origen.closest('.pedido-resumen-modal')||document.getElementById('comida-pedido');const status=host?.querySelector('[data-directo-estado]');const decir=t=>{if(status)status.textContent=t;};
 if(negocio?.slug!==slug||!ultimo||ultimo.pedido.lineas.some(l=>l.negocio?.slug!==slug)){decir('Revisa que el pedido corresponda a este negocio.');return;}
 modalidad=window.MenuDirectoExhibicion.modalidad(negocio,modalidad);
 if(modalidad==='domicilio'&&!datos.direccion.trim()){decir('Escribe la dirección de entrega.');host?.querySelector('[data-directo-campo="direccion"]')?.focus();return;}
 const cliente=datos.cliente.trim();if(!cliente||cliente.length>120||!pagos(negocio).includes(datos.pago)){decir('Escribe tu nombre y elige una forma de pago.');host?.querySelector(!cliente?'[data-directo-campo="cliente"]':'[data-directo-campo="pago"]')?.focus();return;}
 const telefono=numero(negocio.whatsapp);if(!telefono){decir('El negocio debe confirmar su WhatsApp antes de recibir pedidos.');return;}
 const texto=ultimo.pedido.lineas.map(l=>`${l.cantidad} × ${l.producto.nombre}${(l.opciones||[]).map(o=>'\n  '+(o.grupoNombre||'Opción')+': '+o.nombre).join('')}${(l.extras||[]).map(x=>'\n  Extra: '+x.nombre+(Number.isInteger(x.cantidad)?' × '+x.cantidad:'')).join('')}${l.nota?'\n  Indicación: '+l.nota:''}`).join('\n\n');
 const mensaje='Hola, quiero hacer este pedido en '+negocio.nombre+':\n👤 '+cliente+'\n'+(comida(negocio)?'🍽️ ':'🛍️ ')+lugar(modalidad,negocio)+(modalidad==='mesa'&&datos.mesa.trim()?' · Mesa '+datos.mesa.trim():'')+(modalidad==='domicilio'?'\nDirección: '+datos.direccion.trim()+(negocio.tipoDelivery==='gratis'?'\nEnvío gratis dentro de Comalapa. Consulta horarios de entrega.':''):'')+'\n\n'+texto+(ultimo.cuponTexto?'\n\n'+ultimo.cuponTexto:'')+'\n\nTotal de productos: '+money(total)+'\nPago: '+datos.pago+' (por confirmar con el negocio).\n¿Me confirman disponibilidad y horario?';
 if(mensaje.length>6000){decir('El pedido es muy largo para WhatsApp. Reduce las indicaciones.');return;}
 const a=document.createElement('a');a.href='https://api.whatsapp.com/send?phone='+telefono+'&text='+encodeURIComponent(mensaje);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Abrir mi pedido en WhatsApp';if(status)status.replaceChildren(a);a.click();
}
window.MenuDirectoExhibicion={resumen,enviar,modalidad};
window.MesasExhibicion={mesa:()=>'',resumen,enviar};
document.addEventListener('DOMContentLoaded',async()=>{const root=document.getElementById('menu-local');try{
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Falta el negocio');
 const r=await fetch('negocios.json',{cache:'no-cache'});if(!r.ok)throw Error('Catálogo no disponible');
 const perfiles=await window.SitioPublicado.leer('negocios',await r.json());const negocio=perfiles.find(n=>n.slug===slug&&n.activo!==false);if(!negocio)throw Error('Negocio no disponible');
 const [publicado]=await window.MenuPublicado.aplicar([negocio]);const n={...publicado};if(n?.slug!==slug||n.tipoCatalogo==='digital')throw Error('Menú no disponible');
 if(!comida(n))document.querySelector('header>span').textContent='Consulta el catálogo y pide al negocio por WhatsApp';
 document.title=(comida(n)?'Menú':'Catálogo')+' · '+n.nombre;document.querySelector('header h1').textContent=n.nombre;document.getElementById('nombre-pie').textContent=(comida(n)?'Menú de ':'Catálogo de ')+n.nombre;
 const logo=document.querySelector('.local-logo');const ruta=String(n.logo||'');if(/^imagenes\/[a-zA-Z0-9_./-]+\.(webp|png|jpe?g)$/i.test(ruta)&&!ruta.includes('..')||/^https:\/\/gyvoyzxsgckpfkagzjtf\.supabase\.co\/storage\/v1\/object\/public\//.test(ruta)){logo.src=ruta;logo.alt='Logo de '+n.nombre;logo.hidden=false;}else logo.hidden=true;
 root.innerHTML=window.ComidaExhibicion.menu(n);window.ComidaExhibicion.conectar(n);
 }catch(e){root.replaceChildren(document.createTextNode('No pudimos cargar el menú. Revisa tu conexión y vuelve a intentarlo.'));}});
})();
