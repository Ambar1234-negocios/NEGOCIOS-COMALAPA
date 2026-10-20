'use strict';
const botonesRecepcion=document.querySelectorAll('[data-filtro-recepcion],[data-seccion-recepcion]');
function marcarRecepcion(activo){botonesRecepcion.forEach(b=>b.setAttribute('aria-pressed',String(b===activo)));}
botonesRecepcion.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.filtroRecepcion){tarea(async()=>{el('filtro-pedidos').value=b.dataset.filtroRecepcion;activarPanel('operacion','vista-solicitudes');await seleccionarPrimeroVisible();marcarRecepcion(b);});}else{activarPanel('operacion',b.dataset.seccionRecepcion);marcarRecepcion(b);}}));
if(botonesRecepcion.length)marcarRecepcion(botonesRecepcion[0]);
