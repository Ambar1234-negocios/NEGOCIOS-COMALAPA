'use strict';
const botonesRecepcion=document.querySelectorAll('[data-filtro-recepcion],[data-seccion-recepcion]');
function marcarRecepcion(activo){el('abrir-historial')?.setAttribute('aria-pressed',String(activo===el('abrir-historial')));botonesRecepcion.forEach(b=>b.setAttribute('aria-pressed',String(b===activo)));}
botonesRecepcion.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.filtroRecepcion){vistaHistorial=false;el('revisar-antiguos').hidden=true;el('filtro-pedidos').disabled=false;el('fecha-historial').hidden=true;el('titulo-bandeja').textContent='📥 Bandeja de solicitudes';tarea(async()=>{el('filtro-pedidos').value=b.dataset.filtroRecepcion;activarPanel('operacion','vista-solicitudes');await seleccionarPrimeroVisible();marcarRecepcion(b);});}else{activarPanel('operacion',b.dataset.seccionRecepcion);marcarRecepcion(b);}}));
if(botonesRecepcion.length)marcarRecepcion(botonesRecepcion[0]);
