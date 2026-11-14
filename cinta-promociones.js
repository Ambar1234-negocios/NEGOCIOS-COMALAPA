/* Public promotion signs. The server exposes eligibility only, never fund balances. */
(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co',KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
let oferta={porcentaje:0,negocios:[]},firma='',consultando=false,programado=false;
const crear=(tag,texto)=>{const n=document.createElement(tag);if(texto!==undefined)n.textContent=texto;return n;};
// Centralizado para poder trasladarlo a la configuración de la promoción.
const terminosPromocion=porcentaje=>[
 'Aplica solo a pedidos de negocios de comida participantes dentro de Exhibición Frontera Comalapa.',
 'El beneficio es un '+porcentaje+'% de descuento en el costo del servicio a domicilio mediante Mandaditos.',
 'Válido únicamente para entregas dentro de Frontera Comalapa.',
 'Sujeto a disponibilidad del servicio de reparto.',
 'Disponible hasta agotar el fondo promocional.',
 'El descuento se valida al confirmar el pedido.',
 'No aplica al precio de los productos; únicamente al servicio de entrega.',
 'Exhibición puede suspender o finalizar la promoción cuando el fondo se agote.'
];
let modalTerminos,ultimoDisparador;
function abrirTerminos(disparador){
 if(!oferta.porcentaje||!lista().some(n=>envio(n)))return;
 ultimoDisparador=disparador;
 if(!modalTerminos){
  modalTerminos=crear('dialog');modalTerminos.id='promo-terminos';modalTerminos.className='promo-terminos';
  modalTerminos.setAttribute('role','dialog');modalTerminos.setAttribute('aria-modal','true');modalTerminos.setAttribute('aria-labelledby','promo-terminos-titulo');
  const titulo=crear('h2','Términos y condiciones');titulo.id='promo-terminos-titulo';
  const contenido=crear('ul'),cerrar=crear('button','Cerrar');cerrar.type='button';cerrar.autofocus=true;cerrar.className='promo-terminos-cerrar';
  cerrar.onclick=()=>modalTerminos.close();
  modalTerminos.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();cerrar.focus();}});
  modalTerminos.append(titulo,contenido,cerrar);document.body.append(modalTerminos);
  modalTerminos.addEventListener('click',e=>{if(e.target!==modalTerminos)return;const r=modalTerminos.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modalTerminos.close();});
  modalTerminos.addEventListener('close',()=>{if(ultimoDisparador?.isConnected&&!ultimoDisparador.closest('[hidden]'))ultimoDisparador.focus();});
 }
 modalTerminos.querySelector('ul').replaceChildren(...terminosPromocion(oferta.porcentaje).map(t=>crear('li',t)));
 if(!modalTerminos.open)modalTerminos.showModal();
}
const lista=()=>typeof negocios==='undefined'?[]:Object.entries(negocios).flatMap(([categoria,ns])=>ns.map(n=>({...n,categoria:n.categoria||categoria})));
function envio(n){return oferta.porcentaje>0&&oferta.negocios.includes(n?.slug)?oferta.porcentaje+'% de descuento en envío':'';}
function etiqueta(contenedor,texto,producto=false){
 let e=contenedor.querySelector(':scope > .promo-mini');
 if(!texto){e?.remove();return;}
 if(!e){e=crear('span');e.className='promo-mini';if(contenedor.classList.contains('categoria'))contenedor.append(e);else contenedor.prepend(e);}
 const valor='🎉 '+texto;if(e.textContent!==valor)e.textContent=valor;
 e.classList.toggle('producto',producto);
 const titulo=producto?texto:'Descuento en el servicio de Mandaditos para comida dentro de Frontera Comalapa. Sujeto a cotización y saldo promocional disponible; no descuenta productos.';
 if(e.title!==titulo)e.title=titulo;
}
function pintar(){
 const ns=lista(),conOferta=ns.filter(n=>envio(n));
 const categoria=document.querySelector('.categoria[data-categoria="comida"],.categoria[onclick="mostrarCategoria(\'comida\')"]');
 if(categoria)etiqueta(categoria,conOferta.length?oferta.porcentaje+'% en envío':'');
 for(const tarjeta of document.querySelectorAll('[data-promo-negocio]')){
  const n=ns.find(n=>n.slug===tarjeta.dataset.promoNegocio),cuerpo=tarjeta.querySelector('.categoria-negocio-cuerpo');if(!cuerpo)continue;
  etiqueta(cuerpo,envio(n));
 }
 for(const contexto of document.querySelectorAll('[data-promo-contexto]')){
  const valido=oferta.porcentaje>0&&oferta.negocios.includes(contexto.dataset.promoContexto);
  let aviso=contexto.querySelector(':scope > .promo-envio-contexto');
  if(!valido){aviso?.remove();continue;}
  if(!aviso){
   aviso=crear('div');aviso.className='promo-envio-contexto';
   const terminos=crear('button','Términos y condiciones');terminos.type='button';terminos.className='promo-terminos-enlace';
   terminos.setAttribute('aria-haspopup','dialog');terminos.setAttribute('aria-controls','promo-terminos');terminos.onclick=()=>abrirTerminos(terminos);
   aviso.append(crear('strong'),terminos);contexto.append(aviso);
  }
  const texto='🎉 '+oferta.porcentaje+'% de descuento en envío';
  const principal=aviso.querySelector('strong');
  if(principal.textContent!==texto)principal.textContent=texto;
 }
 const textos=[];
 if(conOferta.length)textos.push('🎉 '+oferta.porcentaje+'% de descuento en envío pidiendo desde Exhibición · Solo dentro de Comalapa · Aplican términos y condiciones');
 const nueva=JSON.stringify(textos),cinta=document.getElementById('cinta-promos');if(!cinta)return;
 cinta.hidden=!textos.length;if(!textos.length&&modalTerminos?.open)modalTerminos.close();if(nueva===firma)return;firma=nueva;
 const pista=cinta.querySelector('.cinta-promos-pista');pista.replaceChildren();
 if(!textos.length)return;
 const grupo=crear('span');grupo.className='cinta-promos-grupo';for(let repeticion=0;repeticion<3;repeticion++)for(const t of textos)grupo.append(crear('span',t));
 const copia=grupo.cloneNode(true);copia.setAttribute('aria-hidden','true');pista.append(grupo,copia);
 const enlace=cinta.querySelector('button');enlace.setAttribute('aria-label',oferta.porcentaje+'% de descuento en envío. Ir a Comida');
 enlace.onclick=()=>mostrarCategoria('comida');
}
function programar(){if(programado)return;programado=true;requestAnimationFrame(()=>{programado=false;pintar();});}
async function consultar(){
 if(consultando||document.hidden)return;consultando=true;
 try{const r=await fetch(BASE+'/rest/v1/rpc/exhibicion_promocion_publica',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Promociones no disponibles');const v=await r.json();if(!Number.isInteger(v.porcentaje)||v.porcentaje<0||v.porcentaje>100||!Array.isArray(v.negocios))throw Error('Respuesta inválida');oferta=v;}
 catch{oferta={porcentaje:0,negocios:[]};}finally{consultando=false;pintar();}
}
const observador=new MutationObserver(programar);
for(const selector of ['.grid-categorias','#lista-negocios','#comida-inicio']){const n=document.querySelector(selector);if(n)observador.observe(n,{childList:true,subtree:true});}
if(typeof cargaNegociosPublicados!=='undefined')cargaNegociosPublicados.finally(programar);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)consultar();});
setInterval(consultar,30000);consultar();
})();

