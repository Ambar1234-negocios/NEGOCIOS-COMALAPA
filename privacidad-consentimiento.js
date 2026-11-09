/* Consentimiento de analítica: las tecnologías necesarias siguen disponibles sin seguimiento opcional. */
(()=>{'use strict';
const CLAVE='exhibicionConsentimientoCookiesV1';
const MEDICION='G-NSLXHCBFQ3';
let analyticsCargada=false;
function cargarAnalytics(){
  if(analyticsCargada)return;
  analyticsCargada=true;
  const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(MEDICION);document.head.append(s);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments);};
  window.gtag('js',new Date());
  window.gtag('config',MEDICION,{anonymize_ip:true});
}
function leer(){
  try{const v=JSON.parse(localStorage.getItem(CLAVE));return v&&typeof v.analytics==='boolean'?v:null;}catch{return null;}
}
function guardar(analytics){
  const v={version:1,analytics,fecha:new Date().toISOString()};
  try{localStorage.setItem(CLAVE,JSON.stringify(v));}catch{}
  if(analytics)cargarAnalytics();
  document.getElementById('consentimiento-cookies')?.remove();
}
function mostrar(){
  if(document.getElementById('consentimiento-cookies'))return;
  const css=document.createElement('style');
  css.textContent='#consentimiento-cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:760px;margin:auto;background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:16px;box-shadow:0 12px 35px rgba(0,0,0,.2);padding:18px;font:inherit}#consentimiento-cookies p{margin:0 0 12px;line-height:1.5}#consentimiento-cookies .acciones{display:flex;gap:10px;flex-wrap:wrap}#consentimiento-cookies button{border:0;border-radius:10px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer}#consentimiento-cookies .aceptar{background:#111827;color:#fff}#consentimiento-cookies .necesarias{background:#e5e7eb;color:#111827}#consentimiento-cookies a{color:inherit;text-decoration:underline}';
  document.head.append(css);
  const b=document.createElement('section');b.id='consentimiento-cookies';b.setAttribute('role','dialog');b.setAttribute('aria-label','Preferencias de cookies y analítica');
  b.innerHTML='<p><strong>Privacidad y analítica</strong></p><p>Usamos almacenamiento necesario para el funcionamiento del sitio. Google Analytics es opcional y solo se carga si lo autorizas. <a href="politica-cookies.html">Ver política de cookies</a>.</p><div class="acciones"><button type="button" class="aceptar">Aceptar analítica</button><button type="button" class="necesarias">Solo necesarias</button></div>';
  b.querySelector('.aceptar').onclick=()=>guardar(true);
  b.querySelector('.necesarias').onclick=()=>guardar(false);
  document.body.append(b);
}
const actual=leer();
if(actual){if(actual.analytics)cargarAnalytics();}
else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mostrar,{once:true});else mostrar();
window.PrivacidadExhibicion={preferencias:()=>leer(),cambiar:()=>{try{localStorage.removeItem(CLAVE);}catch{}mostrar();}};
})();