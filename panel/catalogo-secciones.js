/* Filtros de sección para el editor de catálogos visuales. */
'use strict';
let seccionCatalogoPendiente=null;
function seleccionarSeccionCatalogoAlRecargar(seccion){seccionCatalogoPendiente=seccion||'';}
function pintarSeccionesCatalogo(){
 const visual=esCatalogoVisual(),filtro=el('categoria-menu'),lista=el('lista-completa');
 if(!filtro||!lista)return;
 let nav=el('catalogo-secciones');
 if(!nav){nav=nodo('nav',undefined,'catalogo-secciones');nav.id='catalogo-secciones';nav.setAttribute('aria-label','Editar prendas por sección');nav.append(nodo('p','Editar por sección'));const pista=nodo('div',undefined,'catalogo-secciones-pista');pista.setAttribute('role','group');pista.setAttribute('aria-label','Secciones del catálogo');nav.append(pista);lista.before(nav);}
 nav.hidden=!visual;
 const etiqueta=document.querySelector('label[for="categoria-menu"]');
 for(const control of [filtro,etiqueta].filter(Boolean)){if(control.dataset.ocultoSinPestanas===undefined)control.dataset.ocultoSinPestanas=String(control.hidden);control.hidden=visual?true:control.dataset.ocultoSinPestanas==='true';}
 if(!visual){seccionCatalogoPendiente=null;return;}
 if(seccionCatalogoPendiente!==null){filtro.value=[...filtro.options].some(o=>o.value===seccionCatalogoPendiente)?seccionCatalogoPendiente:'';seccionCatalogoPendiente=null;}
 const prendas=menuCompleto.borrador.productos.filter(p=>!p.eliminado),opciones=[...filtro.options].map(o=>({valor:o.value,nombre:o.value||'Todas',cantidad:o.value?prendas.filter(p=>categoriaProducto(p)===o.value).length:prendas.length}));
 const firma=JSON.stringify([menuCompleto.slug,opciones]),pista=nav.querySelector('.catalogo-secciones-pista');
 if(nav.dataset.firma!==firma){pista.replaceChildren();nav.dataset.firma=firma;for(const opcion of opciones){const b=nodo('button',opcion.nombre+' ('+opcion.cantidad+')','secundario');b.type='button';b.dataset.seccion=opcion.valor;b.onclick=()=>{filtro.value=opcion.valor;el('buscar-menu').value='';filtro.dispatchEvent(new Event('change',{bubbles:true}));b.scrollIntoView({block:'nearest',inline:'nearest'});};pista.append(b);}}
 for(const b of pista.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.seccion===filtro.value));
}
