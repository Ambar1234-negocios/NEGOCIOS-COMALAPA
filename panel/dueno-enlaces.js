/* Two public links for the business returned by the existing authorized owner RPC. */
(()=>{'use strict';
const original=qrDueno;
qrDueno=function(){original();const zona=el('vista-compartir');let extra=el('enlace-exclusivo-dueno');if(!menuCompleto){extra?.remove();return;}const n=menuCompleto.borrador,slug=menuCompleto.slug;if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return;
zona.querySelector('h2').textContent='Compartir mi negocio';zona.querySelector('label[for="liga-dueno"]').textContent='Perfil en Exhibición';
zona.querySelector('p').textContent='Perfil en Exhibición: comparte tu espacio dentro del directorio, con sus opciones de contacto y entrega.';
extra?.remove();if(n.tipoCatalogo==='digital')return;
extra=nodo('section');extra.id='enlace-exclusivo-dueno';extra.style.marginTop='2rem';extra.style.borderTop='1px solid #91aab5';extra.style.paddingTop='1rem';
const titulo=(n.categoria==='comida'?'Menú':'Catálogo')+' exclusivo';extra.append(nodo('h2',titulo),nodo('p','Solo aparece tu negocio. Los pedidos van directamente a tu WhatsApp. Usa este enlace también para tu tarjeta NFC.'));
const u=new URL(slug==='forno-mexa'?'/menu-forno.html':'/menu-negocio.html',location.origin);if(slug!=='forno-mexa')u.searchParams.set('negocio',slug);
const label=nodo('label','Enlace exclusivo para compartir o grabar en NFC');label.htmlFor='liga-exclusiva-dueno';const input=nodo('input');input.id=label.htmlFor;input.readOnly=true;input.value=u.href;extra.append(label,input);
const qr=qrcode(0,'M');qr.addData(u.href);qr.make();const caja=nodo('div');caja.style.maxWidth='320px';caja.style.background='#fff';caja.style.padding='12px';caja.innerHTML=qr.createSvgTag({cellSize:6,margin:24,scalable:true});caja.querySelector('svg').setAttribute('aria-label','QR exclusivo de '+n.nombre);
const acciones=nodo('div',undefined,'acciones-dueno');const copiar=nodo('button','Copiar enlace exclusivo');copiar.type='button';copiar.onclick=()=>tarea(async()=>{await navigator.clipboard.writeText(u.href);aviso('Enlace exclusivo copiado.');});
const abrir=nodo('a','Ver catálogo exclusivo','enlace-boton');abrir.href=u.href;abrir.target='_blank';abrir.rel='noopener noreferrer';
const compartir=nodo('a','Compartir por WhatsApp','enlace-boton');compartir.href='https://wa.me/?text='+encodeURIComponent(titulo+' de '+n.nombre+': '+u.href);compartir.target='_blank';compartir.rel='noopener noreferrer';
const descargar=nodo('button','Descargar QR exclusivo');descargar.type='button';descargar.onclick=()=>{const blob=new Blob([new XMLSerializer().serializeToString(caja.querySelector('svg'))],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=nodo('a');a.href=url;a.download=slug+'-exclusivo.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};acciones.append(copiar,abrir,compartir,descargar);extra.append(acciones,caja);zona.append(extra);
};
if(menuCompleto)qrDueno();
})();
