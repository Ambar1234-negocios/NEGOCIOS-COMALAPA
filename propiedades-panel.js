/* Editor independiente de propiedades. Comparte el archivo de datos, no el formulario de negocios. */
(() => {
  'use strict';
  const api=window.PropiedadesExhibicion;
  const main=document.querySelector('.contenido-principal');
  if(!main||!api)return;
  const section=document.createElement('section');section.className='seccion-panel';section.dataset.panelSeccion='propiedades';
  const card=document.createElement('section');card.className='tarjeta-formulario';
  const form=document.createElement('form');form.id='form-propiedad';form.className='propiedad-formulario';
  card.append(form);section.append(card);main.append(section);
  const comunes={},campos={},archivos={},vistas={};let original=null;const urls=new Set();
  function grupo(titulo){const fieldset=document.createElement('fieldset');fieldset.className='propiedad-form-grupo';const legend=document.createElement('legend');legend.textContent=titulo;fieldset.append(legend);form.append(fieldset);return fieldset;}
  function campo(parent,dict,key,titulo,tipo='text',opciones=[]){
    const label=document.createElement('label');label.textContent=titulo;
    const el=document.createElement(tipo==='textarea'?'textarea':tipo==='select'?'select':'input');el.id='inmueble-'+key;
    if(tipo==='select')opciones.forEach(text=>{const o=document.createElement('option');o.value=text;o.textContent=text;el.append(o);});
    else if(tipo==='textarea')el.rows=4;
    else{el.type=tipo;if(tipo==='number'){el.min='0';el.step=['habitaciones','banos'].includes(key)?'1':'0.01';}}
    dict[key]=el;label.append(el);parent.append(label);return el;
  }
  function nota(parent,texto){const p=document.createElement('p');p.className='nota-imagenes';p.textContent=texto;parent.append(p);}
  const general=grupo('🏡 Información de la propiedad');
  campo(general,comunes,'nombre','Nombre de la propiedad').required=true;
  const slug=campo(general,comunes,'slug','Nombre de la carpeta');slug.required=true;slug.pattern='[a-z0-9]+(?:-[a-z0-9]+)*';slug.placeholder='Ejemplo: lote-comalapa-01';
  nota(general,'Una carpeta distinta para cada propiedad. Usa letras minúsculas, números y guiones.');
  campo(general,comunes,'descripcion','Descripción de la propiedad','textarea');
  campo(general,campos,'tipo','Tipo de inmueble','select',api.tipos);
  campo(general,campos,'estado','Estado de venta','select',api.estados);
  campo(general,campos,'precio','Precio en MXN (opcional)','number');
  nota(general,'Si dejas el precio vacío se muestra “Precio por consultar”.');
  const medidas=grupo('📐 Medidas y características');
  for(const [key,texto] of [['superficie','Superficie del terreno (m²)'],['construccion','Superficie de construcción (m²)'],['frente','Frente (metros)'],['fondo','Fondo (metros)'],['habitaciones','Habitaciones'],['banos','Baños']])campo(medidas,campos,key,texto,'number');
  nota(medidas,'Deja vacíos los datos que no correspondan; por ejemplo, habitaciones en un lote.');
  const detalles=grupo('📝 Detalles de la propiedad');
  for(const [key,texto] of api.secciones){const bloque=document.createElement('details');const summary=document.createElement('summary');summary.textContent=texto;bloque.append(summary);detalles.append(bloque);campo(bloque,campos,key,texto,'textarea');}
  const documentos=grupo('📄 Régimen y documentación');
  campo(documentos,campos,'regimen','Régimen de propiedad','select',api.regimenes);
  campo(documentos,campos,'documentos','Documentación disponible');
  campo(documentos,campos,'notaDocumentos','Información adicional de los documentos','textarea');
  const contacto=grupo('📞 Contacto, ubicación y recorrido');
  for(const [key,texto] of [['telefono','Teléfono para llamadas'],['whatsapp','WhatsApp para información y citas']]){const el=campo(contacto,comunes,key,texto,'tel');el.pattern='[0-9]{10}';el.maxLength=10;el.inputMode='numeric';el.placeholder='10 dígitos';el.addEventListener('input',()=>el.value=el.value.replace(/\D/g,'').slice(0,10));}
  campo(contacto,comunes,'direccion','Dirección o referencia de la propiedad');
  campo(contacto,comunes,'maps','Enlace de Google Maps','url');campo(contacto,comunes,'video','Enlace del video de la propiedad','url');
  nota(contacto,'El WhatsApp habilita los botones de información, agendar visita y videollamada. Las citas se confirman por mensaje.');
  const imagenes=grupo('🖼 Fotos de la propiedad');
  const ruta=document.createElement('code');ruta.id='inmueble-ruta-fotos';imagenes.append(ruta);
  nota(imagenes,'Coloca los archivos WebP en esta carpeta del proyecto. El panel guarda sus rutas; no mueve los archivos. Portada: banner.webp · Foto principal: logo.webp · Galería: foto-1.webp, foto-2.webp…');
  function rutaFotos(){ruta.textContent='imagenes/'+(comunes.slug.value.trim()||'nombre-de-la-propiedad')+'/';}
  comunes.slug.addEventListener('input',rutaFotos);
  for(const [key,texto] of [['banner','Portada WebP'],['logo','Foto principal WebP'],['galeria','Galería WebP']]){
    const input=campo(imagenes,archivos,key,texto,'file');input.accept='.webp';if(key==='galeria')input.multiple=true;
    const preview=document.createElement('div');preview.className='propiedad-fotos-preview';vistas[key]=preview;imagenes.append(preview);
    input.addEventListener('change',()=>{
      preview.replaceChildren();
      const selected=Array.from(input.files||[]);
      if(selected.length){selected.forEach(file=>{const url=URL.createObjectURL(file);urls.add(url);foto(preview,url,file.name);});}
      else guardadas(key);
    });
  }
  const mostrarGaleria=campo(imagenes,comunes,'mostrarGaleria','Mostrar galería en la ficha','checkbox');
  nota(imagenes,'Si no seleccionas fotos nuevas, se conservan las guardadas.');
  const publicidad=grupo('📢 Publicidad principal');
  campo(publicidad,campos,'enPublicidad','Mostrar en publicidad principal','checkbox');
  campo(publicidad,campos,'temaPublicidad','Color del anuncio','select',['verde','morado','azul','cafe','dorado','blanco']);
  nota(publicidad,'Usa automáticamente el nombre, precio, superficie y foto principal. Se oculta si está vendida o inactiva.');
  const opciones=grupo('⚙ Visibilidad');campo(opciones,comunes,'activo','Propiedad activa en la página','checkbox');
  const actions=document.createElement('div');actions.className='propiedad-form-acciones';
  const ejemplo=document.createElement('button');ejemplo.type='button';ejemplo.textContent='Rellenar ejemplo de lote';
  const guardar=document.createElement('button');guardar.type='submit';guardar.textContent='Guardar propiedad';
  const nuevaBtn=document.createElement('button');nuevaBtn.type='button';nuevaBtn.textContent='Crear otra propiedad';nuevaBtn.onclick=()=>nueva();
  actions.append(ejemplo,guardar,nuevaBtn);form.append(actions);
  const estado=document.createElement('p');estado.role='status';form.append(estado);
  const listado=document.createElement('section');listado.className='tarjeta-listado';section.append(listado);
  function lista(){const datos=JSON.parse(localStorage.getItem('exhibicionNegocios')||'[]');if(!Array.isArray(datos))throw Error('Los perfiles guardados no tienen un formato válido.');return datos;}
  function foto(parent,src,alt){const img=document.createElement('img');img.src=src;img.alt=alt;img.loading='lazy';parent.append(img);}
  function guardadas(key){const fuentes=key==='galeria'?(original?.galeria||[]):original?.[key]?[original[key]]:[];fuentes.forEach(src=>foto(vistas[key],src,'Foto guardada de la propiedad'));}
  function limpiarUrls(){urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();}
  function cargar(n){
    original=n?{...n}:null;const p=n?.propiedad||{};
    Object.entries(comunes).forEach(([key,el])=>{if(el.type==='checkbox')el.checked=key==='activo'?n?.activo!==false:n?.mostrarGaleria!==false;else el.value=n?.[key]||'';});
    Object.entries(campos).forEach(([key,el])=>{if(el.type==='checkbox')el.checked=p[key]===true;else el.value=p[key]??(key==='tipo'?'Lote':key==='estado'?'Disponible':key==='regimen'?'Por confirmar':key==='temaPublicidad'?'verde':'');});
    limpiarUrls();Object.entries(archivos).forEach(([key,el])=>{el.value='';vistas[key].replaceChildren();guardadas(key);});rutaFotos();
    guardar.textContent=n?'Actualizar propiedad':'Guardar propiedad';estado.textContent='';
  }
  function leer(){const p={...(original?.propiedad||{})};Object.entries(campos).forEach(([key,el])=>{p[key]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?'':Number(el.value)):el.value.trim();});return api.validar(p);}
  function abrir(){abrirSeccionPanel('propiedades');document.getElementById('titulo-seccion-panel').textContent=original?'Editar propiedad: '+original.nombre:'Nueva propiedad';renderLista();}
  function nueva(){if(original&&!confirm('¿Abrir una ficha vacía? Los cambios sin guardar de esta propiedad se descartarán.'))return false;cargar(null);abrir();return true;}
  function editar(n){cargar(n);abrir();}
  function renderLista(){
    listado.replaceChildren();const h=document.createElement('h3');h.textContent='Propiedades guardadas';listado.append(h);
    lista().filter(n=>n.propiedad).forEach(n=>{
      const row=document.createElement('article');row.className='promocion-panel';const titulo=document.createElement('h3');titulo.textContent=n.nombre;
      const status=document.createElement('p');status.textContent=n.propiedad.estado+(n.activo===false?' · Inactiva':'');const info=document.createElement('div');info.append(titulo,status);
      const botones=document.createElement('div');botones.className='acciones-negocio';
      const ver=document.createElement('button');ver.type='button';ver.textContent='Ver ficha';ver.onclick=()=>verNegocio(n.slug);
      const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';edit.onclick=()=>editar(n);
      const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Eliminar';quitar.onclick=()=>{if(!confirm('¿Eliminar la propiedad “'+n.nombre+'”?'))return;try{localStorage.setItem('exhibicionNegocios',JSON.stringify(lista().filter(x=>x.id!==n.id)));if(original?.id===n.id)cargar(null);renderLista();mostrarNegociosPanel();actualizarDashboard();}catch(e){estado.textContent='No se pudo eliminar: '+e.message;}};
      botones.append(ver,edit,quitar);row.append(info,botones);listado.append(row);
    });
  }
  ejemplo.onclick=()=>{
    if(!confirm('¿Rellenar esta ficha con un lote de ejemplo? Se reemplazan sus datos de ejemplo, pero no el contacto ni las fotos.'))return;
    const p={tipo:'Lote',estado:'Disponible',precio:200000,superficie:200,frente:10,fondo:20,regimen:'Por confirmar',temaPublicidad:'verde',medidas:'Lote rectangular de ejemplo: 10 metros de frente y 20 de fondo. Superficie: 200 m².',servicios:'Ejemplo: alumbrado público y calles amplias. Confirmar derechos y conexiones de luz y agua y cargos de consumo.',areas:'Ejemplo: áreas verdes y acceso controlado. Características por confirmar.',ubicacion:'Frontera Comalapa. Dirección y referencias pendientes.',pagos:'Ejemplo: contado o pagos. Enganche, plazo, intereses y cuotas por confirmar.',documentos:'Por confirmar',notaDocumentos:'Datos y precio de demostración. Falta revisar la documentación.'};
    Object.entries(campos).forEach(([key,el])=>{if(el.type==='checkbox')el.checked=false;else el.value=p[key]??'';});
    comunes.nombre.value='Lote de 200 m² en Comalapa · EJEMPLO';comunes.slug.value='lote-comalapa-01';comunes.descripcion.value='Ficha de demostración: lote de 10 × 20 metros. Precio e información ficticios; no es una oferta real.';rutaFotos();
  };
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const datos=lista(),nombre=comunes.nombre.value.trim(),slug=comunes.slug.value.trim();
      if(!nombre||!slug||!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))throw Error('Completa el nombre y una carpeta válida.');
      if(datos.some(n=>n.slug===slug&&n.id!==original?.id))throw Error('Esa carpeta ya está usada. Elige una distinta para esta propiedad.');
      if(original&&!datos.some(n=>n.id===original.id))throw Error('La propiedad fue eliminada. Abre Nueva propiedad para crear otra.');
      for(const key of ['maps','video'])if(comunes[key].value&&!/^https?:\/\//i.test(comunes[key].value))throw Error('El enlace de '+key+' debe empezar con https:// o http://.');
      for(const input of Object.values(archivos))if(Array.from(input.files||[]).some(f=>!f.name.toLowerCase().endsWith('.webp')))throw Error('Usa fotos en formato WebP.');
      let id=original?.id||Date.now();while(!original&&datos.some(n=>n.id===id))id++;
      const n={...(original||{}),id,nombre,slug,categoria:'bienesraices',propiedad:leer(),horarios:null,horario:'',productos:[],servicios:[],delivery:false,tipoDelivery:'',verificado:false,plan:original?.plan||'normal',fechaRegistro:original?.fechaRegistro||new Date().toLocaleString()};
      Object.entries(comunes).forEach(([key,el])=>{if(!['nombre','slug'].includes(key))n[key]=el.type==='checkbox'?el.checked:el.value.trim();});
      for(const key of ['banner','logo'])n[key]=archivos[key].files?.length?'imagenes/'+slug+'/'+key+'.webp':original?.[key]||'';
      n.galeria=archivos.galeria.files?.length?Array.from(archivos.galeria.files).map((f,i)=>'imagenes/'+slug+'/foto-'+(i+1)+'.webp'):[...(original?.galeria||[])];
      const index=datos.findIndex(x=>x.id===id);if(index<0)datos.push(n);else datos[index]=n;
      localStorage.setItem('exhibicionNegocios',JSON.stringify(datos));
      cargar(n);abrir();mostrarNegociosPanel();actualizarDashboard();
      estado.textContent='✓ Propiedad guardada. Puedes usar Ver ficha o seguir editando. Para publicarla descarga los archivos pendientes desde Configuración.';
    }catch(error){estado.textContent='No se pudo guardar: '+error.message;}
  });
  form.addEventListener('invalid',event=>{for(let el=event.target.parentElement;el&&el!==form;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;},true);
  window.PropiedadesEditor={nueva,editar,leer,cargar,renderLista};cargar(null);
})();
