(() => {
  'use strict';
  const form=document.getElementById('form-negocio');
  const bloque=document.createElement('section');bloque.className='tarjeta-formulario';
  bloque.innerHTML='<h2>Menú / Productos</h2><p class="comida-editor-nota">Configura tus productos y sus precios reales en MXN. La foto, los ingredientes y los extras son opcionales. Los extras se cobran por unidad; las opciones sin costo llevan precio 0. Guarda el negocio y genera negocios.json para publicar.</p><div id="productos-editor"></div><button type="button" id="producto-nuevo">+ Agregar producto</button>';
  form.append(bloque);const lista=bloque.querySelector('#productos-editor');const originales=new WeakMap();
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
  function agregar(p={}){
    const row=document.createElement('div');row.className='producto-editor';row.dataset.id=p.id||'p-'+crypto.randomUUID();originales.set(row,p);
    const n=campo(row,'Nombre del producto','text','nombre',p.nombre);n.required=true;n.maxLength=100;
    precio(row,'Precio base en MXN','precio',p.precio);
    campo(row,'Ruta de la foto (opcional)','text','foto',p.foto).placeholder='imagenes/negocio/foto-1.webp';
    campo(row,'Ingredientes (opcional)','textarea','ingredientes',p.ingredientes);
    campo(row,' Disponible','checkbox','disponible',p.disponible!==false);campo(row,' Mostrar en el carrusel de comida','checkbox','enCarrusel',p.enCarrusel!==false);
    const detalles=document.createElement('details');detalles.className='producto-extras';const titulo=document.createElement('summary');titulo.textContent='Extras y opciones';detalles.append(titulo);
    const nota=document.createElement('p');nota.textContent='El cliente puede elegir varias opciones. Se suman al precio de cada unidad; las indicaciones escritas no cambian el precio.';detalles.append(nota);
    const extras=document.createElement('div');extras.className='producto-extras-lista';detalles.append(extras);(Array.isArray(p.extras)?p.extras:[]).forEach(x=>extra(extras,x));
    const nuevo=document.createElement('button');nuevo.type='button';nuevo.textContent='+ Agregar extra u opción';nuevo.onclick=()=>extra(extras);detalles.append(nuevo);row.append(detalles);
    const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Quitar producto';quitar.onclick=()=>{if(confirm('¿Quitar este producto? Se aplica al guardar el negocio.'))row.remove();};row.append(quitar);lista.append(row);
  }
  function leer(){
    return Array.from(lista.children).map(row=>{
      const get=k=>row.querySelector('[data-campo="'+k+'"]');const foto=get('foto').value.trim();
      if(foto&&(!/^imagenes\/[a-zA-Z0-9_./ -]+\.(webp|png|jpe?g)$/i.test(foto)||foto.includes('..')))throw Error('Usa una ruta dentro de imagenes/, con extensión webp, png o jpg.');
      function numero(el){const n=Number(el.value);if(!el.value.trim()||!Number.isFinite(n)||n<0||n>100000)throw Error('Revisa el precio del producto y de sus extras.');return Math.round(n*100)/100;}
      if(!get('nombre').value.trim())throw Error('Cada producto necesita nombre.');
      const extras=Array.from(row.querySelectorAll('.producto-extra-editor')).map(e=>{const n=e.querySelector('[data-campo="extra-nombre"]').value.trim();if(!n)throw Error('Cada extra necesita nombre.');return {...originales.get(e),id:e.dataset.id,nombre:n,precio:numero(e.querySelector('[data-campo="extra-precio"]')),disponible:e.querySelector('[data-campo="extra-disponible"]').checked};});
      return {...originales.get(row),id:row.dataset.id,nombre:get('nombre').value.trim(),precio:numero(get('precio')),foto,ingredientes:get('ingredientes').value.trim(),disponible:get('disponible').checked,enCarrusel:get('enCarrusel').checked,extras};
    });
  }
  window.MenuEditor={leer,cargar:ps=>{lista.replaceChildren();(Array.isArray(ps)?ps:[]).forEach(agregar);}};
  bloque.querySelector('#producto-nuevo').onclick=()=>agregar();form.addEventListener('reset',()=>lista.replaceChildren());
})();
