(() => {
  'use strict';
  const form=document.getElementById('form-negocio');
  const bloque=document.createElement('section');bloque.className='tarjeta-formulario';
  bloque.innerHTML='<h2>Menú / Productos</h2><p class="comida-editor-nota">Configura tus productos y sus precios reales en MXN. La foto, los ingredientes y los extras son opcionales. Los extras se cobran por unidad; las opciones sin costo llevan precio 0. Guarda el negocio y genera negocios.json para publicar.</p><div id="productos-editor"></div><button type="button" id="producto-nuevo">+ Agregar producto</button>';
  form.append(bloque);const lista=bloque.querySelector('#productos-editor');const originales=new WeakMap();
  function refrescarResumen(){
    for(const row of lista.children){
      const nombre=row.querySelector('[data-campo=nombre]')?.value.trim()||'Nuevo producto';
      const activas=Array.from(row.querySelectorAll('[data-promo=activa]')).filter(el=>el.checked).length;
      const h=row.querySelector('.menu-producto-cabecera');h.querySelector('strong').textContent=nombre;h.querySelector('span').textContent=activas?'✓ '+activas+' promoción(es) activada(s)':'Sin promociones activadas';row.classList.toggle('menu-con-promocion',activas>0);
      row.querySelector('.menu-producto-fin').textContent='Fin de la configuración de '+nombre;
      const cab=row.querySelector('.producto-grupos-lista')?.parentElement.querySelector('summary');
      const total=Array.from(row.querySelectorAll('.producto-opcion-editor [data-promo=activa]')).filter(el=>el.checked).length;
      if(cab)cab.textContent='Grupos de opciones · Tamaño, sabor y presentación'+(total?' · ✓ '+total+' con promoción':'');
      for(const g of row.querySelectorAll('.producto-grupo-editor')){const count=Array.from(g.querySelectorAll('[data-promo=activa]')).filter(el=>el.checked).length;g.querySelector('summary').textContent=(g.querySelector('[data-campo=grupo-nombre]').value.trim()||'Nuevo grupo')+(count?' · ✓ '+count+' con promoción':'');}
      for(const o of row.querySelectorAll('.producto-opcion-editor')){const name=o.querySelector('[data-campo=opcion-nombre]').value.trim()||'Nueva opción';o.querySelector('.menu-opcion-cabecera').textContent='Opción: '+name;}
    }
  }
  lista.addEventListener('input',refrescarResumen);lista.addEventListener('click',()=>queueMicrotask(refrescarResumen));
  function campo(parent,texto,tipo,clave,valor){
    const label=document.createElement('label');label.textContent=texto;
    const el=document.createElement(tipo==='textarea'?'textarea':'input');if(tipo!=='textarea')el.type=tipo;else{el.rows=3;el.maxLength=2000;}
    el.dataset.campo=clave;if(tipo==='checkbox')el.checked=valor;else el.value=valor??'';label.append(el);parent.append(label);return el;
  }
  function precio(parent,texto,clave,valor){const el=campo(parent,texto,'number',clave,valor);el.required=true;el.min='0';el.max='100000';el.step='0.01';return el;}
  function extra(parent,x={}){
    const row=document.createElement('div');row.className='producto-extra-editor';row.dataset.id=x.id||'e-'+crypto.randomUUID();originales.set(row,x);
    const n=campo(row,'Nombre del extra u opción','text','extra-nombre',x.nombre);n.required=true;n.maxLength=80;n.placeholder='Ejemplo: queso extra / sin cebolla';
    precio(row,'Precio adicional por unidad (0 si no cuesta)','extra-precio',x.precio??0);
    campo(row,' Disponible','checkbox','extra-disponible',x.disponible!==false);
    const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Quitar opción';quitar.onclick=()=>{if(confirm('¿Quitar esta opción? Se aplica al guardar el negocio.'))row.remove();};row.append(quitar);parent.append(row);
  }
  function selector(parent,texto,clave,valor,opciones){
    const label=document.createElement('label');label.textContent=texto;
    const el=document.createElement('select');el.dataset.campo=clave;
    opciones.forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;el.append(o);});
    el.value=valor;label.append(el);parent.append(label);return el;
  }
  function opcion(parent,x={}){
    const row=document.createElement('div');row.className='producto-opcion-editor';row.dataset.id=x.id||'o-'+crypto.randomUUID();originales.set(row,{...x});
    const cab=document.createElement('h4');cab.className='menu-opcion-cabecera';cab.textContent='Opción: '+(x.nombre||'Nueva opción');row.append(cab);
    const n=campo(row,'Nombre de la opción','text','opcion-nombre',x.nombre);n.required=true;n.maxLength=80;
    selector(row,'Cómo se cobra','opcion-tipo',x.tipoPrecio||'adicional',[['adicional','Se suma al precio base'],['propio','Precio del producto con esta opción']]);
    precio(row,'Precio en MXN (0 para una opción sin costo adicional)','opcion-precio',x.precio??0);
    campo(row,' Disponible','checkbox','opcion-disponible',x.disponible!==false);
    PromosEditor.editor(row,originales.get(row),()=>row.querySelector('[data-campo=opcion-precio]').value,()=>row.querySelector('[data-campo=opcion-tipo]').value==='propio');
    const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Quitar opción';quitar.onclick=()=>{if(confirm('¿Quitar esta opción? Se aplica al guardar.'))row.remove();};row.append(quitar);parent.append(row);
  }
  function grupo(parent,g={}){
    const row=document.createElement('details');row.className='producto-grupo-editor';row.dataset.id=g.id||'g-'+crypto.randomUUID();originales.set(row,g);row.open=!g.id;
    const titulo=document.createElement('summary');titulo.textContent=g.nombre||'Nuevo grupo';row.append(titulo);
    const n=campo(row,'Nombre del grupo (Tamaño, Sabor, Tipo de carne…)','text','grupo-nombre',g.nombre);n.required=true;n.maxLength=80;n.addEventListener('input',()=>titulo.textContent=n.value.trim()||'Nuevo grupo');
    campo(row,' Elección obligatoria','checkbox','grupo-obligatorio',g.obligatorio===true);
    selector(row,'Selección','grupo-seleccion',g.seleccion||'unica',[['unica','Una opción (radio)'],['multiple','Varias opciones (casillas)']]);
    const opciones=document.createElement('div');opciones.className='producto-opciones-lista';row.append(opciones);(Array.isArray(g.opciones)?g.opciones:[]).forEach(x=>opcion(opciones,x));
    const nuevo=document.createElement('button');nuevo.type='button';nuevo.textContent='+ Agregar opción';nuevo.onclick=()=>opcion(opciones);row.append(nuevo);
    const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Quitar grupo';quitar.onclick=()=>{if(confirm('¿Quitar este grupo y sus opciones? Se aplica al guardar.'))row.remove();};row.append(quitar);parent.append(row);
  }
  function agregar(p={}){
    const row=document.createElement('div');row.className='producto-editor';row.dataset.id=p.id||'p-'+crypto.randomUUID();originales.set(row,{...p});
    const cab=document.createElement('header');cab.className='menu-producto-cabecera';cab.innerHTML='<strong></strong><span></span>';row.append(cab);
    const n=campo(row,'Nombre del producto','text','nombre',p.nombre);n.required=true;n.maxLength=100;
    precio(row,'Precio base en MXN','precio',p.precio);
    campo(row,'Ruta de la foto (opcional)','text','foto',p.foto).placeholder='imagenes/negocio/foto-1.webp';
    campo(row,'Ingredientes (opcional)','textarea','ingredientes',p.ingredientes);
    campo(row,' Disponible','checkbox','disponible',p.disponible!==false);campo(row,' Mostrar en el carrusel de comida','checkbox','enCarrusel',p.enCarrusel!==false);
    const detalles=document.createElement('details');detalles.className='producto-extras';const titulo=document.createElement('summary');titulo.textContent='Extras y opciones';detalles.append(titulo);
    const nota=document.createElement('p');nota.textContent='El cliente puede elegir varias opciones. Se suman al precio de cada unidad; las indicaciones escritas no cambian el precio.';detalles.append(nota);
    const extras=document.createElement('div');extras.className='producto-extras-lista';detalles.append(extras);(Array.isArray(p.extras)?p.extras:[]).forEach(x=>extra(extras,x));
    const nuevo=document.createElement('button');nuevo.type='button';nuevo.textContent='+ Agregar extra u opción';nuevo.onclick=()=>extra(extras);detalles.append(nuevo);row.append(detalles);
    const grupos=document.createElement('details');grupos.className='producto-extras';
    const encabezado=document.createElement('summary');encabezado.textContent='Grupos de opciones · Tamaño, sabor y presentación';grupos.append(encabezado);
    const ayuda=document.createElement('p');ayuda.textContent='Los adicionales se suman al precio base. El precio propio lo reemplaza; úsalo en un solo grupo de selección única. Los demás grupos y extras pueden sumar adicionales.';grupos.append(ayuda);
    const listaGrupos=document.createElement('div');listaGrupos.className='producto-grupos-lista';grupos.append(listaGrupos);(Array.isArray(p.gruposOpciones)?p.gruposOpciones:[]).forEach(g=>grupo(listaGrupos,g));
    const nuevoGrupo=document.createElement('button');nuevoGrupo.type='button';nuevoGrupo.textContent='+ Agregar grupo';nuevoGrupo.onclick=()=>grupo(listaGrupos);grupos.append(nuevoGrupo);row.append(grupos);
    PromosEditor.editor(row,originales.get(row),()=>row.querySelector('[data-campo=precio]').value,()=>!Array.from(row.querySelectorAll('[data-campo=opcion-tipo]')).some(el=>el.value==='propio'));
    const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Quitar producto';quitar.onclick=()=>{if(confirm('¿Quitar este producto? Se aplica al guardar el negocio.'))row.remove();};row.append(quitar);const fin=document.createElement('p');fin.className='menu-producto-fin';row.append(fin);lista.append(row);refrescarResumen();
  }
  function leer(){
    return Array.from(lista.children).map(row=>{
      const get=k=>row.querySelector('[data-campo="'+k+'"]');const foto=get('foto').value.trim();
      if(foto&&(!/^imagenes\/[a-zA-Z0-9_./ -]+\.(webp|png|jpe?g)$/i.test(foto)||foto.includes('..')))throw Error('Usa una ruta dentro de imagenes/, con extensión webp, png o jpg.');
      function numero(el){const n=Number(el.value);if(!el.value.trim()||!Number.isFinite(n)||n<0||n>100000)throw Error('Revisa el precio del producto y de sus extras.');return Math.round(n*100)/100;}
      if(!get('nombre').value.trim())throw Error('Cada producto necesita nombre.');
      const extras=Array.from(row.querySelectorAll('.producto-extra-editor')).map(e=>{const n=e.querySelector('[data-campo="extra-nombre"]').value.trim();if(!n)throw Error('Cada extra necesita nombre.');return {...originales.get(e),id:e.dataset.id,nombre:n,precio:numero(e.querySelector('[data-campo="extra-precio"]')),disponible:e.querySelector('[data-campo="extra-disponible"]').checked};});
      const gruposOpciones=Array.from(row.querySelectorAll('.producto-grupo-editor')).map(g=>{
        const getG=k=>g.querySelector('[data-campo="'+k+'"]');const nombre=getG('grupo-nombre').value.trim();
        if(!nombre)throw Error('Cada grupo necesita nombre.');
        const seleccion=getG('grupo-seleccion').value;
        const opciones=Array.from(g.querySelectorAll('.producto-opcion-editor')).map(o=>{
          const getO=k=>o.querySelector('[data-campo="'+k+'"]');const nombre=getO('opcion-nombre').value.trim();
          if(!nombre)throw Error('Cada opción necesita nombre.');
          return {...originales.get(o),...o._leerPromocion(),id:o.dataset.id,nombre,precio:numero(getO('opcion-precio')),tipoPrecio:getO('opcion-tipo').value,disponible:getO('opcion-disponible').checked};
        });
        if(!opciones.length)throw Error('Agrega al menos una opción a '+nombre+'.');
        if(getG('grupo-obligatorio').checked&&!opciones.some(o=>o.disponible))throw Error('El grupo obligatorio '+nombre+' necesita una opción disponible.');
        if(seleccion==='multiple'&&opciones.some(o=>o.tipoPrecio==='propio'))throw Error('Los precios propios requieren selección única en '+nombre+'.');
        return {...originales.get(g),id:g.dataset.id,nombre,obligatorio:getG('grupo-obligatorio').checked,seleccion,opciones};
      });
      if(gruposOpciones.filter(g=>g.opciones.some(o=>o.tipoPrecio==='propio')).length>1)throw Error('Usa precio propio en un solo grupo por producto; los demás deben usar adicionales.');
      return {...originales.get(row),...row._leerPromocion(),id:row.dataset.id,nombre:get('nombre').value.trim(),precio:numero(get('precio')),foto,ingredientes:get('ingredientes').value.trim(),disponible:get('disponible').checked,enCarrusel:get('enCarrusel').checked,extras,...(gruposOpciones.length||originales.get(row)?.gruposOpciones?{gruposOpciones}:{})};
    });
  }
  window.MenuEditor={leer,cargar:ps=>{lista.replaceChildren();(Array.isArray(ps)?ps:[]).forEach(agregar);}};
  bloque.querySelector('#producto-nuevo').onclick=()=>agregar();form.addEventListener('reset',()=>lista.replaceChildren());
  // Revelar el campo inválido aunque su grupo esté plegado.
  bloque.addEventListener('invalid',e=>{let el=e.target.parentElement;while(el&&el!==bloque){if(el.tagName==='DETAILS')el.open=true;el=el.parentElement;}},true);
})();
