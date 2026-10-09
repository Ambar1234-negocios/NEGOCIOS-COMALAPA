/* Precios en centavos. Vigencia según la fecha de Comalapa. */
(() => {
  'use strict';
  const centavos=v=>Math.round(Number(v)*100);
  const fecha=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function validaFecha(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v;}
  const hora=()=>new Intl.DateTimeFormat('en-GB',{timeZone:'America/Mexico_City',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
  const validaHora=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v||'');
  const etiqueta=p=>String(p?.etiqueta||'').trim()||(p?.tipo==='2x1'?'2×1':'PROMOCIÓN');
  function vigente(p,precio,dia=fecha(),reloj=hora()){
    if(!p||p.activa!==true||!['precio','2x1'].includes(p.tipo)||!validaFecha(p.inicio)||!validaFecha(p.fin)||p.fin<p.inicio||dia<p.inicio||dia>p.fin)return null;
    if(p.tipo==='precio'&&(!Number.isFinite(p.precio)||p.precio<0||centavos(p.precio)>=centavos(precio)))return null;
    if(p.horaInicio||p.horaFin){if(!validaHora(p.horaInicio)||!validaHora(p.horaFin)||p.horaInicio===p.horaFin)return null;const dentro=p.horaInicio<p.horaFin?reloj>=p.horaInicio&&reloj<p.horaFin:reloj>=p.horaInicio||reloj<p.horaFin;if(!dentro)return null;}
    return p;
  }
  function calcular(l,dia=fecha()){
    const p=l.producto,os=l.opciones||[],propia=os.find(o=>o.tipoPrecio==='propio');
    const precio=propia?propia.precio:p.precio;
    const promo=vigente(propia?propia.promocion:p.promocion,precio,dia);
    const base=centavos(precio),especial=promo?.tipo==='precio'?centavos(promo.precio):base;
    const adicionales=os.filter(o=>o.tipoPrecio!=='propio').reduce((s,o)=>s+centavos(o.precio),0)+(l.extras||[]).reduce((s,e)=>s+centavos(e.precio),0);
    const gratis=promo?.tipo==='2x1'?Math.floor(l.cantidad/2):0;
    return {unitario:especial+adicionales,total:especial*(l.cantidad-gratis)+adicionales*l.cantidad,anterior:base+adicionales,gratis,promo,etiqueta:promo?etiqueta(promo):''};
  }
  function validar(p,precio){
    if(!p?.activa)return;
    if((p.horaInicio||p.horaFin)&&(!validaHora(p.horaInicio)||!validaHora(p.horaFin)||p.horaInicio===p.horaFin))throw Error('Escribe ambas horas y usa un horario distinto de inicio y fin. Deja ambas vacías para todo el día.');
    if(String(p.etiqueta||'').length>60)throw Error('El texto de promoción admite hasta 60 caracteres.');
    if(!['precio','2x1'].includes(p.tipo))throw Error('Elige el tipo de promoción.');
    if(!validaFecha(p.inicio)||!validaFecha(p.fin)||p.fin<p.inicio)throw Error('Revisa las fechas de la promoción.');
    if(p.tipo==='precio'&&(!Number.isFinite(p.precio)||p.precio<0||centavos(p.precio)>=centavos(precio)))throw Error('El precio promocional debe ser menor al precio normal y no negativo.');
  }
  function textoOpcion(o,formatear){const promo=vigente(o.promocion,o.precio);if(o.tipoPrecio!=='propio'||!promo)return null;return promo.tipo==='precio'?formatear(centavos(promo.precio))+' · '+etiqueta(promo):formatear(centavos(o.precio))+' · '+etiqueta(promo);}
  window.PromosProductos={centavos,fecha,hora,etiqueta,vigente,calcular,validar,textoOpcion};
})();
