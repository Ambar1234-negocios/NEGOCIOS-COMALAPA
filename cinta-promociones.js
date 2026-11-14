/* Public promotion signs. The server exposes eligibility only, never fund balances. */
(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co',KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
let oferta={porcentaje:0,negocios:[]},firma='',consultando=false,programado=false;
const crear=(tag,texto)=>{const n=document.createElement(tag);if(texto!==undefined)n.textContent=texto;return n;};
const lista=()=>typeof negocios==='undefined'?[]:Object.entries(negocios).flatMap(([categoria,ns])=>ns.map(n=>({...n,categoria:n.categoria||categoria})));
function promoProducto(n){
 for(const p of n?.productos||[]){
  if(p.disponible===false)continue;
  const promo=window.PromosProductos?.vigente(p.promocion,p.precio);
  if(!promo)continue;
  if(promo.tipo==='2x1')return '2×1 en productos seleccionados';
  if(promo.tipo==='precio')return 'Productos con precio especial';
 }
 return '';
}
function envio(n){return oferta.porcentaje>0&&oferta.negocios.includes(n?.slug)?oferta.porcentaje+'% en servicio':'';}
function etiqueta(contenedor,texto,producto=false){
 let e=contenedor.querySelector(':scope > .promo-mini');
 if(!texto){e?.remove();return;}
 if(!e){e=crear('span');e.className='promo-mini';contenedor.prepend(e);}
 const valor='🎉 '+texto;if(e.textContent!==valor)e.textContent=valor;
 e.classList.toggle('producto',producto);
 const titulo=producto?texto:'Descuento en el servicio de Mandaditos para comida dentro de Frontera Comalapa. Sujeto a cotización y apoyo disponible; no descuenta productos.';
 if(e.title!==titulo)e.title=titulo;
}
function pintar(){
 const ns=lista(),conOferta=ns.filter(n=>envio(n)),productos=ns.filter(n=>promoProducto(n));
 const categoria=document.querySelector('.categoria[data-categoria="comida"],.categoria[onclick="mostrarCategoria(\'comida\')"]');
 if(categoria)etiqueta(categoria,conOferta.length?oferta.porcentaje+'% en servicio':productos.some(n=>n.categoria==='comida')?'Promociones':'');
 for(const tarjeta of document.querySelectorAll('[data-promo-negocio]')){
  const n=ns.find(n=>n.slug===tarjeta.dataset.promoNegocio),cuerpo=tarjeta.querySelector('.categoria-negocio-cuerpo');if(!cuerpo)continue;
  const servicio=envio(n),producto=promoProducto(n);etiqueta(cuerpo,servicio||producto,!servicio);
 }
 const textos=[];
 if(conOferta.length)textos.push('🎉 '+oferta.porcentaje+'% de descuento en el servicio de Mandaditos al pedir comida','📍 Dentro de Frontera Comalapa · Hasta agotar apoyo promocional','El servicio y la promoción se confirman al cotizar');
 for(const n of productos.slice(0,6))textos.push('✨ '+n.nombre+' · '+promoProducto(n));
 const nueva=JSON.stringify(textos),cinta=document.getElementById('cinta-promos');if(!cinta)return;
 cinta.hidden=!textos.length;if(nueva===firma)return;firma=nueva;
 const pista=cinta.querySelector('.cinta-promos-pista');pista.replaceChildren();
 if(!textos.length)return;
 const grupo=crear('span');grupo.className='cinta-promos-grupo';for(const t of textos)grupo.append(crear('span',t));
 const copia=grupo.cloneNode(true);copia.setAttribute('aria-hidden','true');pista.append(grupo,copia);
 const enlace=cinta.querySelector('a');enlace.setAttribute('aria-label',textos.join('. '));
 enlace.onclick=e=>{e.preventDefault();if(conOferta.length&&typeof mostrarCategoria==='function')mostrarCategoria('comida');else if(productos[0]&&typeof verPerfil==='function'){const n=productos[0],indice=negocios[n.categoria]?.findIndex(x=>x.slug===n.slug);if(indice>=0)verPerfil(n.categoria,indice);}};
}
function programar(){if(programado)return;programado=true;requestAnimationFrame(()=>{programado=false;pintar();});}
async function consultar(){
 if(consultando||document.hidden)return;consultando=true;
 try{const r=await fetch(BASE+'/rest/v1/rpc/exhibicion_promocion_publica',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Promociones no disponibles');const v=await r.json();if(!Number.isInteger(v.porcentaje)||v.porcentaje<0||v.porcentaje>100||!Array.isArray(v.negocios))throw Error('Respuesta inválida');oferta=v;}
 catch{oferta={porcentaje:0,negocios:[]};}finally{consultando=false;pintar();}
}
const cinta=document.getElementById('cinta-promos'),pausa=cinta?.querySelector('button');
pausa?.addEventListener('click',()=>{const pausada=cinta.dataset.pausa!=='true';cinta.dataset.pausa=String(pausada);pausa.setAttribute('aria-pressed',String(pausada));pausa.setAttribute('aria-label',pausada?'Reanudar promociones':'Pausar promociones');pausa.textContent=pausada?'▶':'Ⅱ';});
const observador=new MutationObserver(programar);
for(const selector of ['.grid-categorias','#lista-negocios','#comida-inicio']){const n=document.querySelector(selector);if(n)observador.observe(n,{childList:true,subtree:true});}
if(typeof cargaNegociosPublicados!=='undefined')cargaNegociosPublicados.finally(programar);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)consultar();});
setInterval(consultar,30000);consultar();
})();

