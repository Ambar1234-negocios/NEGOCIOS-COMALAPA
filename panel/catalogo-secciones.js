/* Filtros de sección para el editor de catálogos visuales. */
'use strict';
// La capacidad es independiente del diseño (visual, técnico u otro).
function categoriasDinamicas(){return menuCompleto?.borrador?.categoriasDinamicas===true;}
function categoriasDelEditor(){
 const n=menuCompleto?.borrador||{};
 if(menuCompleto?.slug==='esenciales-decants'||n.nombre==='Esenciales Decants')return n.seccionesCatalogo||['Decants de dama','Decants de caballero'];
 return categoriasDinamicas()?(n.seccionesCatalogo||[]):esCatalogoVisual()?[...seccionesCatalogoVisual,...(n.seccionesCatalogo||[])]:[];
}

function pintarAdministracionCategorias(nav){
 let zona=el('administrar-categorias');
 if(!zona){zona=nodo('details');zona.id='administrar-categorias';nav.after(zona);}
 if(zona.dataset.negocio!==menuCompleto?.slug){zona.open=false;zona.dataset.negocio=menuCompleto?.slug||'';}
 zona.hidden=!categoriasDinamicas();zona.replaceChildren();if(zona.hidden)return;
 zona.append(nodo('summary','Administrar categorías'),nodo('p','Ocultar una categoría oculta sus productos en el catálogo público. Puedes eliminar categorías sin prendas activas o pausadas; las prendas de la papelera se conservan.'));
 const categorias=categoriasDelEditor(),ocultas=menuCompleto.borrador.seccionesOcultas||[];
 const guardar=(accion,seccion,nombre=null,posicion=null)=>tarea(async()=>{
  await api('/rest/v1/rpc/catalogo_seccion_administrar',{method:'POST',datos:{negocio:menuCompleto.slug,version:menuCompleto.revision,accion,seccion,nombre,posicion}});
  await cargarMenuCompleto();aviso('Categorías publicadas.');
 });
 for(const [i,c] of categorias.entries()){
  const fila=nodo('div',undefined,'acciones-seccion'),label=nodo('label','Nombre de categoría'),input=nodo('input');input.value=c;input.maxLength=80;input.setAttribute('aria-label','Nombre de '+c);label.append(input);fila.append(label);
  const boton=(texto,accion,disabled=false)=>{const b=nodo('button',texto,'secundario');b.type='button';b.disabled=disabled;b.onclick=accion;fila.append(b);};
  boton('Renombrar',()=>guardar('renombrar',c,input.value));
  boton('Subir',()=>guardar('ordenar',c,null,i-1),i===0);
  boton('Bajar',()=>guardar('ordenar',c,null,i+1),i===categorias.length-1);
  boton(ocultas.includes(c)?'Mostrar':'Ocultar',()=>guardar(ocultas.includes(c)?'mostrar':'ocultar',c));
  const usada=menuCompleto.borrador.productos.some(p=>!p.eliminado&&(p.seccion||'Otros productos')===c)||menuCompleto.original.productos.some(p=>!p.eliminado&&(p.seccion||'Otros productos')===c);
  boton('Eliminar categoría',()=>{if(confirm('¿Eliminar la categoría vacía «'+c+'»?'))guardar('eliminar',c);},usada);
  zona.append(fila);
 }
}
let seccionCatalogoPendiente=null;
function seleccionarSeccionCatalogoAlRecargar(seccion){seccionCatalogoPendiente=seccion||'';}
function abrirNuevaSeccionCatalogo(){
 if((!esCatalogoVisual()&&!categoriasDinamicas())||trabajando)return;
 let d=el('nueva-seccion-dialogo');
 if(!d){d=nodo('dialog',undefined,'nueva-seccion-dialogo');d.id='nueva-seccion-dialogo';d.setAttribute('aria-labelledby','nueva-seccion-titulo');const form=nodo('form');const titulo=nodo('h2','Nueva sección');titulo.id='nueva-seccion-titulo';form.append(titulo,nodo('p','Crea una categoría para organizar tus productos. Se guardará aunque todavía no tenga productos.'));
 const nombre=entrada(form,'nueva-seccion-nombre','Nombre de la sección');nombre.required=true;nombre.maxLength=80;nombre.placeholder='Ej. Ropa de bebé';
 const error=nodo('p');error.id='nueva-seccion-error';error.setAttribute('role','alert');form.append(error);
 const acciones=nodo('div',undefined,'acciones-seccion'),crear=nodo('button','Crear sección'),cancelar=nodo('button','Cancelar','secundario');crear.type='submit';cancelar.type='button';cancelar.onclick=()=>d.close();acciones.append(crear,cancelar);form.append(acciones);d.append(form);document.body.append(d);
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const nombre=el('nueva-seccion-nombre').value.trim().replace(/\s+/g,' ');if(!nombre){el('nueva-seccion-error').textContent='Escribe el nombre de la sección.';return;}
 const negocio=menuCompleto.slug,version=menuCompleto.revision;
 tarea(async()=>{try{const r=await api('/rest/v1/rpc/'+(categoriasDinamicas()?'catalogo_seccion_administrar':'catalogo_visual_seccion_crear'),{method:'POST',datos:categoriasDinamicas()?{negocio,version,accion:'crear',seccion:nombre}:{negocio,version,nombre}});el('buscar-menu').value='';seleccionarSeccionCatalogoAlRecargar(r.seccion);d.close();await cargarMenuCompleto();aviso(r.creada?'Sección creada. Pulsa Nueva prenda para agregar sus productos.':'Esa sección ya existía. Ya puedes agregarle prendas.');}catch(e){el('nueva-seccion-error').textContent=e.message;throw e;}});
 };
 d.addEventListener('close',()=>el('nueva-seccion-catalogo')?.focus({preventScroll:true}));
 }
 el('nueva-seccion-nombre').value='';el('nueva-seccion-error').textContent='';d.showModal();el('nueva-seccion-nombre').focus();
}
function pintarSeccionesCatalogo(){
 const visual=esCatalogoVisual()||categoriasDinamicas(),filtro=el('categoria-menu'),lista=el('lista-completa');
 if(!filtro||!lista)return;
 let nav=el('catalogo-secciones');
 if(!nav){nav=nodo('nav',undefined,'catalogo-secciones');nav.id='catalogo-secciones';nav.setAttribute('aria-label','Editar prendas por sección');const cabecera=nodo('div',undefined,'catalogo-secciones-cabecera');const nueva=nodo('button','＋ Nueva sección','secundario');nueva.id='nueva-seccion-catalogo';nueva.type='button';nueva.onclick=abrirNuevaSeccionCatalogo;cabecera.append(nodo('p','Editar por sección'),nueva);nav.append(cabecera);const pista=nodo('div',undefined,'catalogo-secciones-pista');pista.setAttribute('role','group');pista.setAttribute('aria-label','Secciones del catálogo');nav.append(pista);lista.before(nav);}
 if(!filtro.dataset.cierraAdministracion){filtro.addEventListener('change',()=>{const zona=el('administrar-categorias');if(zona)zona.open=false;});filtro.dataset.cierraAdministracion='true';}
 nav.hidden=!visual;
 pintarAdministracionCategorias(nav);
 const etiqueta=document.querySelector('label[for="categoria-menu"]');
 for(const control of [filtro,etiqueta].filter(Boolean)){if(control.dataset.ocultoSinPestanas===undefined)control.dataset.ocultoSinPestanas=String(control.hidden);control.hidden=visual?true:control.dataset.ocultoSinPestanas==='true';}
 if(!visual){seccionCatalogoPendiente=null;return;}
 if(seccionCatalogoPendiente!==null){filtro.value=[...filtro.options].some(o=>o.value===seccionCatalogoPendiente)?seccionCatalogoPendiente:'';seccionCatalogoPendiente=null;}
 const prendas=menuCompleto.borrador.productos.filter(p=>!p.eliminado),opciones=[...filtro.options].map(o=>({valor:o.value,nombre:o.value||'Todas',cantidad:o.value?prendas.filter(p=>categoriaProducto(p)===o.value).length:prendas.length}));
 const firma=JSON.stringify([menuCompleto.slug,opciones]),pista=nav.querySelector('.catalogo-secciones-pista');
 if(nav.dataset.firma!==firma){pista.replaceChildren();nav.dataset.firma=firma;for(const opcion of opciones){const b=nodo('button',opcion.nombre+' ('+opcion.cantidad+')','secundario');b.type='button';b.dataset.seccion=opcion.valor;b.onclick=()=>{filtro.value=opcion.valor;el('buscar-menu').value='';filtro.dispatchEvent(new Event('change',{bubbles:true}));b.scrollIntoView({block:'nearest',inline:'nearest'});};pista.append(b);}}
 for(const b of pista.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.seccion===filtro.value));
}

function productoDisponible(p){return p.disponible!==false;}
function estadoProductoMenu(p){
 if(p.soloInformativo===true&&!esCatalogoVisual())return nodo('p','ℹ️ Carta informativa','chip-menu');
 const disponible=productoDisponible(p);
 return nodo('p',disponible?'🟢 Disponible':'🔴 Pausado / Agotado','chip-menu'+(disponible?'':' agotado'));
}
function agregarControlPausaCatalogo(acciones,p){
 if(p.soloInformativo===true&&!esCatalogoVisual()&&!categoriasDinamicas())return;
 const visible=!productoDisponible(p);
 const etiqueta=visible?'Reactivar':'Pausar';
 const boton=nodo('button',etiqueta,'secundario');
 boton.type='button';
 boton.setAttribute('aria-label',etiqueta+' '+p.nombre);
 boton.onclick=()=>tarea(async()=>{
  await api('/rest/v1/rpc/catalogo_producto_visibilidad',{method:'POST',datos:{
   negocio:menuCompleto.slug,version:menuCompleto.revision,producto:p.id,visible
  }});
  await cargarMenuCompleto();
  aviso(visible?'Producto reactivado.':'Producto pausado.');
 });
 acciones.append(boton);
}
