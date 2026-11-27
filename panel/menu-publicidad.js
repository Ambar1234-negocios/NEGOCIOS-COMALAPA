'use strict';
let basePublicidadMenu=null,inicialPublicidadMenu='';
const camposPublicidad=['promo-activa-editor','promo-tipo-editor','promo-nombre-editor','promo-precio-editor','promo-inicio-editor','promo-fin-editor'];
function opcionesPrecioPropio(){return leerOpcionesMenu().gruposOpciones.flatMap(g=>g.opciones.filter(o=>o.tipoPrecio==='propio'));}
function valoresPromoEditor(){return {alcance:el('promo-alcance').value,activa:el('promo-activa-editor').checked,tipo:el('promo-tipo-editor').value,etiqueta:el('promo-nombre-editor').value.trim(),precio:el('promo-precio-editor').value===''?null:Number(el('promo-precio-editor').value),inicio:el('promo-inicio-editor').value,fin:el('promo-fin-editor').value};}
function cargarPromoEditor(){const alcance=el('promo-alcance').value,propias=(basePublicidadMenu?.gruposOpciones||[]).flatMap(g=>g.opciones.filter(o=>o.tipoPrecio==='propio'));const pr=(alcance==='producto'?basePublicidadMenu?.promocion:alcance==='todas'?null:propias.find(o=>o.id===alcance)?.promocion)||{};el('promo-activa-editor').checked=pr.activa===true;el('promo-tipo-editor').value=pr.tipo==='2x1'?'2x1':'precio';el('promo-nombre-editor').value=pr.etiqueta||'';el('promo-precio-editor').value=pr.precio??'';el('promo-inicio-editor').value=pr.inicio||'';el('promo-fin-editor').value=pr.fin||'';inicialPublicidadMenu=JSON.stringify(valoresPromoEditor());estadoCamposPublicidad();}
function sincronizarAlcancePromo(){if(!basePublicidadMenu)return;const s=el('promo-alcance'),propias=opcionesPrecioPropio(),opciones=propias.length?[['todas','Todas las presentaciones'],...propias.map(o=>[o.id,o.nombre||'Presentación sin nombre'])]:[['producto','Todo el producto']];const firma=JSON.stringify(opciones);if(s.dataset?.firma===firma)return;const anterior=s.value;s.replaceChildren();for(const[v,t]of opciones){const o=nodo('option',t);o.value=v;s.append(o);}if(s.dataset)s.dataset.firma=firma;s.value=opciones.some(o=>o[0]===anterior)?anterior:opciones[0][0];if(s.value!==anterior)cargarPromoEditor();}
function prepararPublicidadMenu(p){prepararTendenciasProducto(menuCompleto.original?.productos?.find(x=>x.id===p.id)||p);basePublicidadMenu=structuredClone(menuCompleto.original?.productos?.find(x=>x.id===p.id)||{...p,promocion:undefined,gruposOpciones:(p.gruposOpciones||[]).map(g=>({...g,opciones:g.opciones.map(o=>({...o,promocion:undefined}))}))});el('editar-carrusel').checked=!p.esNuevo&&(menuCompleto.slug==='restaurante-shangai'?basePublicidadMenu.enCarrusel===true:basePublicidadMenu.enCarrusel!==false);el('publicidad-producto').open=false;const s=el('promo-alcance');if(s.dataset)delete s.dataset.firma;s.value='';sincronizarAlcancePromo();const activa=(basePublicidadMenu.gruposOpciones||[]).flatMap(g=>g.opciones).find(o=>o.tipoPrecio==='propio'&&o.promocion?.activa);if(activa)s.value=activa.id;cargarPromoEditor();el('plan-publicidad').textContent=['destacado','premium'].includes(menuCompleto.plan)?'La promoción se publica al guardar el producto.':'Para activar promociones, asigna el Plan Estándar o Plan Premium a este negocio.';}
function estadoCamposPublicidad(){const activa=el('promo-activa-editor').checked,precio=activa&&el('promo-tipo-editor').value==='precio';for(const id of ['promo-nombre-editor','promo-inicio-editor','promo-fin-editor'])el(id).required=activa;el('promo-precio-editor').required=precio;el('promo-precio-editor').disabled=!precio;}
function leerPublicidadMenu(){sincronizarAlcancePromo();const config={enCarrusel:menuCompleto?.slug==='esenciales-decants'?false:el('editar-carrusel').checked},pr=valoresPromoEditor();if(JSON.stringify(pr)!==inicialPublicidadMenu){if(pr.activa){if(!['destacado','premium'].includes(menuCompleto.plan))throw Error('Este negocio necesita Plan Estándar o Plan Premium para activar promociones.');if(!pr.etiqueta||!pr.inicio||!pr.fin||pr.inicio>pr.fin)throw Error('Completa el nombre y las fechas de la promoción.');const precios=pr.alcance==='producto'?[Number(el('editar-precio').value)]:opcionesPrecioPropio().filter(o=>pr.alcance==='todas'||o.id===pr.alcance).map(o=>o.precio);if(pr.tipo==='precio'&&(pr.precio===null||pr.precio<0||!precios.length||precios.some(p=>pr.precio>=p)))throw Error('El precio promocional debe ser menor al precio normal de cada presentación elegida.');}config.promocion=pr;}return config;}
el('promo-alcance').onchange=cargarPromoEditor;
for(const id of camposPublicidad)el(id).addEventListener('input',estadoCamposPublicidad);
el('editar-producto').addEventListener('change',e=>{if(e.target.id?.startsWith('op-t-'))sincronizarAlcancePromo();});

function catalogoPuedeMostrarTendencias() {
  const catalogo = menuCompleto?.original || menuCompleto?.borrador;
  if(menuCompleto?.slug==='esenciales-decants')return ['destacado','premium'].includes(menuCompleto.plan);
  return ['visual', 'tecnico', 'digital'].includes(catalogo?.tipoCatalogo) &&
    !catalogo.catalogoServicios && !['comida', 'cat-comida-y-restaurantes'].includes(catalogo.categoria);
}

function prepararTendenciasProducto(producto) {
  const carrusel = el('editar-carrusel');
  const etiqueta = document.querySelector('label[for="editar-carrusel"]');
  const ayuda = carrusel.nextElementSibling;
  const permiteTendencias = catalogoPuedeMostrarTendencias();
  const esComida = menuCompleto?.slug==='esenciales-decants' ? false : !permiteTendencias && !esCatalogoVisual();
  carrusel.hidden = etiqueta.hidden = ayuda.hidden = !esComida;
  let bloque = el('opcion-tendencias');
  if (!bloque) {
    bloque = document.createElement('div');
    bloque.id = 'opcion-tendencias';
    bloque.innerHTML = '<label for="editar-tendencias">Mostrar en Tendencias</label><input id="editar-tendencias" type="checkbox"><p class="nota">Al guardar, este producto podrá aparecer en Tendencias. Puedes marcar hasta tres productos por negocio.</p>';
    ayuda.after(bloque);
  }
  bloque.hidden = !permiteTendencias;
  const control=el('editar-tendencias');
  control.checked = producto.enTendencias === true;
  const decants=menuCompleto?.slug==='esenciales-decants';
  bloque.querySelector('label').textContent=decants?'Agregar a Tendencias':'Mostrar en Tendencias';
  const usados=(menuCompleto.original?.productos||[]).filter(p=>p.id!==producto.id&&!p.eliminado&&p.enTendencias===true).length;
  control.disabled=decants&&usados>=3&&!control.checked;
  bloque.querySelector('p').textContent=decants&&usados>=3?'Ya tienes tres productos en Tendencias. Desmarca uno antes de agregar otro.':'Al guardar, este producto podrá aparecer en Tendencias. Puedes marcar hasta tres productos por negocio.';
}
