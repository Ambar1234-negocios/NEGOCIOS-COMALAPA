/* Catálogo de Sayer: usa el mismo editor y autorización del dueño. */
'use strict';
const esSayer=()=>menuCompleto?.slug==='el-titan-de-las-pinturas';
const pintarSayerOriginal=pintarMenuCompleto;
pintarMenuCompleto=function(){
 if(esSayer())menuCompleto.borrador.productos.sort((a,b)=>(a.ordenCatalogo??0)-(b.ordenCatalogo??0));
 pintarSayerOriginal();if(!esSayer())return;
 const ayuda=document.querySelector('#vista-menu>.aviso')||document.querySelector('#panel>.aviso');if(ayuda)ayuda.textContent='Edita cada tarjeta, selecciona su categoría o crea otra en el selector. Guarda y publica. Ordena con un número: los menores aparecen primero; los empates conservan su orden.';
 const filtro=el('categoria-menu');if(filtro?.parentElement)filtro.parentElement.hidden=false;
 const ps=menuCompleto.borrador.productos.filter(p=>!p.eliminado),q=el('buscar-menu').value.trim().toLocaleLowerCase('es'),categoria=filtro.value;
 const visibles=ps.filter(p=>(!q||p.nombre.toLocaleLowerCase('es').includes(q))&&(!categoria||categoriaProducto(p)===categoria));
 for(const grupo of el('lista-completa').querySelectorAll('.grupo-menu')){
  const nombre=grupo.querySelector('h3').textContent;
  const lista=visibles.filter(p=>categoriaProducto(p)===nombre);
  for(const [j,fila]of [...grupo.querySelectorAll('.fila-menu')].entries()){
   const p=lista[j];fila.querySelector('.precio-menu').textContent=Number.isFinite(p.precio)&&p.precio>0?dineroMenu(p.precio):'Consultar precio';
   const label=nodo('label','Orden del producto'),input=nodo('input');input.type='number';input.min=0;input.max=10000;input.step=1;input.value=p.ordenCatalogo??0;input.setAttribute('aria-label','Orden de '+p.nombre);label.append(input);
   const guardar=nodo('button','Guardar orden','secundario');guardar.type='button';guardar.onclick=()=>tarea(async()=>{if(!input.reportValidity()||input.value==='')throw Error('Escribe un orden entre 0 y 10000.');await api('/rest/v1/rpc/sayer_producto_ordenar',{method:'POST',datos:{negocio:menuCompleto.slug,version:menuCompleto.revision,producto:p.id,posicion:Number(input.value)}});await cargarMenuCompleto();aviso('Orden publicado.');});fila.querySelector('.acciones-menu').append(label,guardar);
  }
 }
};
const configurarSayerOriginal=configurarCatalogoVisual;
configurarCatalogoVisual=function(){const promo=el('publicidad-producto');if(promo)promo.parentElement.hidden=false;configurarSayerOriginal();
 const etiquetaFicha=document.querySelector('label[for="ficha-activa"]');if(etiquetaFicha)etiquetaFicha.textContent=esSayer()?'Usar galería y ficha técnica':'Usar galería y pestañas';
 for(let i=0;i<5;i++){const l=document.querySelector('label[for="ficha-titulo-'+i+'"]');if(l)l.textContent=(esSayer()?'Título de información ':'Nombre de pestaña ')+(i+1);}
 if(!esSayer())return;
 const h=document.querySelector('body>header h1');if(h){h.textContent='Mi catálogo · Sayer';if(h.nextElementSibling)h.nextElementSibling.textContent='Productos, categorías y fichas técnicas de tu negocio.';}
 const tab=document.querySelector('[data-vista="menu"]');if(tab)tab.textContent='Catálogo';
 for(const foto of document.querySelectorAll('#lista-completa .mini-menu'))if(foto.tagName!=='IMG')foto.textContent='Sin foto';
 el('editar-precio').required=false;document.querySelector('label[for="editar-precio"]').textContent='Precio (opcional; vacío o 0 se oculta)';
 for(const id of ['opciones-completas','extras-completos']){const z=el(id);if(z&&!productoEditado?.[id==='opciones-completas'?'gruposOpciones':'extras']?.length)z.hidden=true;}
 const publicidad=el('publicidad-producto');if(publicidad)publicidad.parentElement.hidden=true;
 const selector=el('seccion-elegida');if(selector){for(const nombre of ['Pintura automotriz','Pintura para casa','Herramientas','Madera y metal','Impermeabilizantes','Detallado automotriz']){if(![...selector.options].some(o=>o.value===nombre)){const o=nodo('option',nombre);o.value=nombre;selector.insertBefore(o,selector.lastElementChild);}}}
};
// El guardado existente admite 0; representa ausencia de precio en Sayer.
el('editar-producto').addEventListener('submit',()=>{if(esSayer()&&el('editar-precio').value==='')el('editar-precio').value='0';},true);
const previaSayerOriginal=actualizarPreviaProducto;
actualizarPreviaProducto=function(){previaSayerOriginal();if(!esSayer())return;if(!(Number(el('editar-precio').value)>0)){const precio=el('previa-producto').querySelector('.precio-menu');if(precio)precio.textContent='Consultar precio';}if(productoEditado?.soloInformativo){const estado=el('previa-producto').querySelector('.chip-menu');if(estado)estado.textContent='Ficha informativa';}};

// Las fotos pertenecen al producto abierto; la ficha técnica sigue debajo.
const prepararFotosSayerOriginal=prepararFichaAvanzada;
prepararFichaAvanzada=function(p){
 const anterior=el('sayer-fotos-producto'),fotoZona=el('editar-foto')?.closest('.editor-foto');
 if(anterior){const campos=el('ficha-campos');campos.prepend(...anterior.children);anterior.remove();}
 const titulo=fotoZona?.querySelector('h3');if(titulo?.dataset.sayerOriginal)titulo.textContent=titulo.dataset.sayerOriginal;
 prepararFotosSayerOriginal(esSayer()?{...p,fichaAvanzada:{...p.fichaAvanzada,activa:true}}:p);
 if(!esSayer()||!fotoZona)return;
 titulo.dataset.sayerOriginal??=titulo.textContent;titulo.textContent='📷 Fotos de este producto';
 const grupo=nodo('div');grupo.id='sayer-fotos-producto';
 const nota=document.querySelector('#ficha-campos>p'),agregar=el('ficha-agregar'),label=document.querySelector('label[for="ficha-agregar"]'),lista=el('ficha-fotos');
 nota.textContent='Sube hasta 4 fotos del mismo producto: «'+(p.nombre||'Nuevo producto')+'». La primera es la foto principal de su tarjeta; las otras muestran diferentes vistas o detalles de ese mismo producto. No crean productos separados.';
 label.textContent='Elegir fotos de este producto (hasta 4)';
 grupo.append(nota,label,agregar,lista);fotoZona.append(grupo);
 const activar=el('ficha-activa');activar.hidden=true;activar.disabled=true;document.querySelector('label[for="ficha-activa"]').hidden=true;
 el('ficha-editor').querySelector('h3').textContent='Información técnica de este producto';
 pintarFichaFotos();actualizarFotoSimpleFicha();
};
const pintarFotosSayerOriginal=pintarFichaFotos;
pintarFichaFotos=function(){pintarFotosSayerOriginal();if(!esSayer())return;
 for(const [i,fila]of [...el('ficha-fotos').children].entries()){
  fila.querySelector('p').textContent=i===0?'Foto principal de este producto':'Vista adicional '+(i+1)+' del mismo producto';
  fila.querySelector('img').alt=(i===0?'Foto principal':'Vista adicional '+(i+1))+' de '+(productoEditado?.nombre||'este producto');
 }
};

