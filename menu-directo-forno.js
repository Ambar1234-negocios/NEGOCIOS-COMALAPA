/* Vista exclusiva de Forno Mexa: catálogo compartido, pedidos directos por WhatsApp. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(v/100);
let datos={cliente:'',pago:'',mesa:''},ultimo=null,renderId=0;
const numero=v=>{let n=String(v||'').replace(/\D/g,'');if(n.length===10)n='52'+n;else if(/^521\d{10}$/.test(n))n='52'+n.slice(3);return /^\d{11,15}$/.test(n)?n:'';};
document.addEventListener('input',e=>{const k=e.target.dataset.directoCampo;if(['cliente','pago','mesa'].includes(k))datos[k]=e.target.value;});
document.addEventListener('change',e=>{const k=e.target.dataset.directoCampo;if(['cliente','pago','mesa'].includes(k))datos[k]=e.target.value;});
const lugar=modo=>modo==='recoger'?'Para llevar':'Para comer aquí';
function resumen(p,total,selector,modo='mesa'){
 ultimo={pedido:p,total,modo};
 const grupo='directo-modo-'+(++renderId);
 const modalidades=`<fieldset class="directo-modalidad"><legend>¿Cómo lo quieres?</legend><div>${[['mesa','Para comer aquí'],['recoger','Para llevar']].map(([v,t])=>`<label><input type="radio" name="${grupo}" data-modo-entrega value="${v}" ${modo===v?'checked':''}><span>${t}</span></label>`).join('')}</div></fieldset>`;
 return `<h4>Tu pedido · Forno Mexa</h4>${modalidades}${p.lineas.map(l=>`<div class="pedido-linea"><div><strong>${l.cantidad} × ${esc(l.producto.nombre)}</strong>${(l.opciones||[]).map(o=>`<p>${esc(o.grupoNombre||'Opción')}: ${esc(o.nombre)}</p>`).join('')}${(l.extras||[]).map(x=>`<p>Extra: ${esc(x.nombre)}</p>`).join('')}${l.nota?`<p>Indicación: ${esc(l.nota)}</p>`:''}</div><div class="pedido-controles"><button type="button" data-pedido-accion="editar" data-linea="${esc(l.id)}">Editar</button><button type="button" data-pedido-accion="quitar" data-linea="${esc(l.id)}">Quitar</button></div></div>`).join('')}<p class="pedido-total">Total de productos: ${money(total)}</p><section class="pedido-checkout directo-checkout"><h4>${lugar(modo)}</h4><label>Tu nombre<input data-directo-campo="cliente" maxlength="120" autocomplete="given-name" value="${esc(datos.cliente)}" required></label>${modo==='mesa'?`<label>Mesa (opcional)<input data-directo-campo="mesa" maxlength="30" value="${esc(datos.mesa)}" placeholder="Por ejemplo: 2"></label>`:''}<label>¿Cómo prefieres pagar?<select data-directo-campo="pago"><option value="">Selecciona</option>${['Efectivo','Transferencia'].map(v=>`<option ${datos.pago===v?'selected':''}>${v}</option>`).join('')}</select></label><small>El negocio confirma disponibilidad, precio final y formas de pago. Esto no realiza un cobro.</small><p>Se abrirá el WhatsApp de Forno Mexa. Pulsa Enviar para compartir tu pedido y espera su confirmación.</p><button type="button" data-pedido-accion="enviar">Continuar por WhatsApp</button><p role="status" data-directo-estado></p></section>`;
}
function enviar({negocio,origen,total,modalidad='mesa'}){
 const host=origen.closest('.pedido-resumen-modal')||document.getElementById('comida-pedido');const status=host?.querySelector('[data-directo-estado]');const decir=t=>{if(status)status.textContent=t;};
 if(negocio?.slug!=='forno-mexa'||!ultimo||ultimo.pedido.lineas.some(l=>l.negocio?.slug!=='forno-mexa')){decir('Revisa el pedido de Forno Mexa.');return;}
 const cliente=datos.cliente.trim();if(!cliente||cliente.length>120||!['Efectivo','Transferencia'].includes(datos.pago)){decir('Escribe tu nombre y elige una forma de pago.');host?.querySelector(!cliente?'[data-directo-campo="cliente"]':'[data-directo-campo="pago"]')?.focus();return;}
 const telefono=numero(negocio.whatsapp);if(!telefono){decir('El negocio debe confirmar su WhatsApp antes de recibir pedidos.');return;}
 const texto=ultimo.pedido.lineas.map(l=>`${l.cantidad} × ${l.producto.nombre}${(l.opciones||[]).map(o=>'\n  '+(o.grupoNombre||'Opción')+': '+o.nombre).join('')}${(l.extras||[]).map(x=>'\n  Extra: '+x.nombre+(Number.isInteger(x.cantidad)?' × '+x.cantidad:'')).join('')}${l.nota?'\n  Indicación: '+l.nota:''}`).join('\n\n');
 const mensaje='Hola, quiero hacer este pedido en Forno Mexa:\n👤 '+cliente+'\n🍽️ '+lugar(modalidad)+(modalidad==='mesa'&&datos.mesa.trim()?' · Mesa '+datos.mesa.trim():'')+'\n\n'+texto+'\n\nTotal de productos: '+money(total)+'\nPago: '+datos.pago+' (por confirmar con el negocio).\n¿Me confirman disponibilidad y preparación?';
 if(mensaje.length>6000){decir('El pedido es muy largo para WhatsApp. Reduce las indicaciones.');return;}
 const a=document.createElement('a');a.href='https://api.whatsapp.com/send?phone='+telefono+'&text='+encodeURIComponent(mensaje);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Abrir mi pedido en WhatsApp';if(status)status.replaceChildren(a);a.click();
}
window.MesasExhibicion={mesa:()=>'',resumen,enviar};
document.addEventListener('DOMContentLoaded',async()=>{const root=document.getElementById('menu-local');try{
 const r=await fetch('negocios.json',{cache:'no-cache'});if(!r.ok)throw Error('Catálogo no disponible');
 const perfiles=await window.SitioPublicado.leer('negocios',await r.json());const negocio=perfiles.find(n=>n.slug==='forno-mexa'&&n.activo!==false);if(!negocio)throw Error('Negocio no disponible');
 const [n]=await window.MenuPublicado.aplicar([negocio]);if(n?.slug!=='forno-mexa'||n.categoria!=='comida')throw Error('Menú no disponible');
 root.innerHTML=window.ComidaExhibicion.menu(n);window.ComidaExhibicion.conectar(n);
 }catch(e){root.replaceChildren(document.createTextNode('No pudimos cargar el menú. Revisa tu conexión y vuelve a intentarlo.'));}});
})();
