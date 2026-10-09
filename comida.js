/* Menú y pedido: los precios se calculan en centavos; un negocio por pedido. */
(() => {
  'use strict';
  const escapar = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const imagen = v => typeof v === 'string' && /^imagenes\/[a-zA-Z0-9_./ -]+\.(webp|png|jpe?g)$/i.test(v) && !v.includes('..') ? v : '';
  const dinero = centavos => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(centavos / 100);
  function productos(n) { return (Array.isArray(n.productos) ? n.productos : []).filter(p => p && typeof p.id === 'string' && typeof p.nombre === 'string' && p.nombre.trim() && Number.isFinite(p.precio) && p.precio >= 0 && p.precio <= 100000 && p.disponible !== false); }
  function foto(p) { const ruta=imagen(p.foto); return ruta ? `<img src="${escapar(ruta)}" alt="${escapar(p.nombre)}" loading="lazy" onerror="this.hidden=true">` : '<div class="comida-sin-foto" aria-hidden="true">🍽️</div>'; }
  function etiquetas(p){
    const propias=grupos(p).flatMap(g=>g.opciones.filter(o=>o.tipoPrecio==='propio'));
    const ofertas=propias.length?propias.filter(o=>PromosProductos.vigente(o.promocion,o.precio)).map(o=>({nombre:o.nombre,precio:o.precio,promo:o.promocion})):PromosProductos.vigente(p.promocion,p.precio)?[{nombre:'',precio:p.precio,promo:p.promocion}]:[];
    return ofertas.map(o=>'<p class="pedido-promo"><span class="promo-etiqueta">'+escapar(PromosProductos.etiqueta(o.promo))+'</span> '+escapar(o.nombre)+(o.promo.tipo==='precio'?' · <del>'+dinero(centavos(o.precio))+'</del> '+dinero(centavos(o.promo.precio)):' · Dos iguales por '+dinero(centavos(o.precio)))+'</p>').join('');
  }
  function menu(n) {
    if (!productos(n).length) return '';
    return `<section class="comida-menu" aria-label="Menú y productos"><h4>Menú / Productos</h4><p>Precios en MXN. Disponibilidad y entrega por confirmar.</p><div class="comida-grid">${productos(n).map(p=>`<article class="comida-producto" data-producto-id="${escapar(p.id)}">${imagen(p.foto) ? `<button type="button" class="comida-ampliar" data-ver-producto="${escapar(p.id)}" aria-label="Ampliar foto de ${escapar(p.nombre)}">${foto(p)}<span>Ver foto e información</span></button>` : foto(p)}<h5>${escapar(p.nombre)}</h5>${etiquetas(p)}<p>${dinero(Math.round(p.precio*100))}</p><button type="button" data-agregar-producto="${escapar(p.id)}">Agregar al pedido</button></article>`).join('')}</div><div id="comida-pedido"></div></section>`;
  }
  const centavos = precio => Math.round(Number(precio) * 100);
  function extras(p) {
    const vistos=new Set();
    return (Array.isArray(p.extras)?p.extras:[]).filter(x=>x && typeof x.id==='string' && !vistos.has(x.id) && vistos.add(x.id) && typeof x.nombre==='string' && x.nombre.trim() && Number.isFinite(x.precio) && x.precio>=0 && x.precio<=100000 && x.disponible!==false);
  }
  // Los precios propios aportan solo la diferencia respecto al precio base.
  function grupos(p) {
    const vistos=new Set();
    return (Array.isArray(p.gruposOpciones)?p.gruposOpciones:[]).map(g=>{
      const ids=new Set();
      const opciones=(Array.isArray(g?.opciones)?g.opciones:[]).filter(x=>x && typeof x.id==='string' && !ids.has(x.id) && ids.add(x.id) && typeof x.nombre==='string' && x.nombre.trim() && Number.isFinite(x.precio) && x.precio>=0 && x.precio<=100000 && x.disponible!==false);
      const valido=g && typeof g.id==='string' && !vistos.has(g.id) && typeof g.nombre==='string' && g.nombre.trim() && ['unica','multiple'].includes(g.seleccion);
      if(g?.id)vistos.add(g.id);
      return {...g,opciones,valido};
    });
  }
  const ajuste=(p,opciones)=>(opciones||[]).reduce((s,x)=>s+centavos(x.precio)-(x.tipoPrecio==='propio'?centavos(p.precio):0),0);
  const firmaOpciones=l=>JSON.stringify((l.opciones||[]).map(x=>[x.grupoId,x.id]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const descripcionOpciones=l=>(l.opciones||[]).map(x=>x.grupoNombre+': '+x.nombre).join(' · ');
  function validarOpciones(p,seleccion) {
    const gs=grupos(p);
    if(gs.some(g=>!g.valido))return 'Este producto tiene opciones incompletas. Consulta al negocio.';
    if(gs.filter(g=>g.opciones.some(x=>x.tipoPrecio==='propio')).length>1 || gs.some(g=>g.seleccion==='multiple'&&g.opciones.some(x=>x.tipoPrecio==='propio')))return 'Este producto tiene precios de opciones incompatibles. Consulta al negocio.';
    for(const g of gs){
      const elegidas=seleccion.filter(x=>x.grupoId===g.id);
      if(g.obligatorio&&!elegidas.length)return 'Elige una opción de '+g.nombre+'.';
      if(g.seleccion==='unica'&&elegidas.length>1)return 'Elige solo una opción de '+g.nombre+'.';
    }
    if(centavos(p.precio)+ajuste(p,seleccion)<0)return 'Revisa las opciones de este producto.';
    return '';
  }
  let pedido={negocio:null,lineas:[]};
  const unitario=l=>PromosProductos.calcular(l).unitario;
  const importe=l=>PromosProductos.calcular(l).total;
  const detallePromo=l=>{const c=PromosProductos.calcular(l);return c.promo?'Oferta: '+c.etiqueta+(c.gratis?' · '+c.gratis+' unidad(es) sin costo base':'')+' · Extras y adicionales por cada unidad.':'';};
  const total=()=>pedido.lineas.reduce((s,l)=>s+importe(l),0);
  const cantidadTotal=()=>pedido.lineas.reduce((s,l)=>s+l.cantidad,0);
  function mismaPreparacion(a,b) {return a.producto.id===b.producto.id && a.nota===b.nota && firmaOpciones(a)===firmaOpciones(b) && a.extras.map(x=>x.id).sort().join('|')===b.extras.map(x=>x.id).sort().join('|');}
  let negocioVisible=null;
  let barra;
  function dialogo(titulo,clase,origen) {
    const d=document.createElement('dialog');d.className='comida-visor '+clase;
    const id='titulo-'+crypto.randomUUID();d.setAttribute('aria-labelledby',id);
    d.innerHTML=`<button type="button" class="comida-visor-cerrar">Cerrar ×</button><h2 id="${id}">${escapar(titulo)}</h2><div class="dialogo-contenido"></div>`;
    d.querySelector('button').onclick=()=>d.close();
    const overflow=document.body.style.overflow;
    d.addEventListener('close',()=>{document.body.style.overflow=overflow;d.remove();if(origen?.isConnected)origen.focus({preventScroll:true});},{once:true});
    d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();});
    document.body.append(d);d.showModal();document.body.style.overflow='hidden';return d;
  }
  function resumen() {
    if(!pedido.lineas.length)return '<p>Agrega productos para armar tu pedido.</p>';
    const n=pedido.negocio;
    return `<h4>Mi pedido · ${escapar(n.nombre)}</h4>${pedido.lineas.map(l=>`<div class="pedido-linea"><div><strong>${escapar(l.producto.nombre)}</strong><p>${escapar(descripcionOpciones(l))}</p><p>${l.extras.length?l.extras.map(x=>`${escapar(x.nombre)} (${x.precio?'+ '+dinero(centavos(x.precio)):'sin costo'})`).join(' · '):'Sin extras'}</p>${l.nota?`<p class="pedido-nota">Indicación: ${escapar(l.nota)}</p>`:''}<p class="pedido-promo">${escapar(detallePromo(l))}</p><p>${dinero(unitario(l))} por unidad · <strong>${dinero(importe(l))}</strong></p></div><div class="pedido-controles"><button type="button" data-pedido-accion="menos" data-linea="${l.id}" aria-label="Quitar una unidad de ${escapar(l.producto.nombre)}">−</button><span>${l.cantidad}</span><button type="button" data-pedido-accion="mas" data-linea="${l.id}" aria-label="Agregar una unidad de ${escapar(l.producto.nombre)}" ${l.cantidad>=99?'disabled':''}>+</button><button type="button" data-pedido-accion="editar" data-linea="${l.id}">Editar</button><button type="button" data-pedido-accion="quitar" data-linea="${l.id}">Quitar</button></div></div>`).join('')}<p class="pedido-total" role="status">Total de productos: ${dinero(total())}</p><p>${n.delivery===true?(n.tipoDelivery==='gratis'?'El negocio indica entrega gratis. Confirma cobertura y condiciones.':'Envío por cotizar; no está incluido en el total.'):'Este negocio no tiene reparto habilitado. Consulta opciones directamente con él.'}</p><div class="comida-acciones"><button type="button" data-pedido-accion="enviar">${n.delivery===true&&n.tipoDelivery!=='gratis'?'Pedir con Mandaditos':'Consultar pedido por WhatsApp'}</button><button type="button" data-pedido-accion="vaciar">Vaciar pedido</button></div>`;
  }
  function pintarPedido() {
    const el=document.getElementById('comida-pedido');
    if(el)el.innerHTML=pedido.negocio && negocioVisible && pedido.negocio.id!==negocioVisible.id && pedido.lineas.length?`<p>Tienes un pedido de ${escapar(pedido.negocio.nombre)}.</p><button type="button" data-pedido-accion="ver">Ver mi pedido</button>`:resumen();
    document.querySelectorAll('.pedido-resumen-modal').forEach(e=>e.innerHTML=resumen());
    if(!barra){barra=document.createElement('button');barra.type='button';barra.className='pedido-barra';barra.onclick=()=>verPedido(barra);document.body.append(barra);}
    barra.hidden=!pedido.lineas.length;document.body.classList.toggle('tiene-pedido',Boolean(pedido.lineas.length));
    barra.textContent=`🛒 Ver mi pedido · ${cantidadTotal()} ${cantidadTotal()===1?'producto':'productos'} · ${dinero(total())}`;
  }
  function verPedido(origen) {const d=dialogo('Tu pedido','pedido-dialogo',origen);const el=d.querySelector('.dialogo-contenido');el.classList.add('pedido-resumen-modal');el.innerHTML=resumen();}
  function configurar(n,p,origen,linea=null) {
    const d=dialogo(linea?'Editar preparación':'Personaliza tu pedido','pedido-configurar',origen);
    const contenido=d.querySelector('.dialogo-contenido');
    const gs=grupos(p);
    const encabezado=g=>({tamaño:'Elige tu tamaño',sabor:'Elige tu sabor','tipo de carne':'Elige el tipo de carne',presentación:'Elige la presentación'}[String(g.nombre).toLocaleLowerCase('es-MX')]||'Elige: '+g.nombre);
    const secciones=gs.map((g,i)=>`<fieldset class="pedido-extras pedido-grupo" data-grupo="${i}"><legend>${escapar(encabezado(g))}</legend><p>${g.obligatorio?'Obligatorio':'Opcional'} · ${g.seleccion==='multiple'?'Puedes elegir varias':'Elige una opción'}</p>${g.seleccion==='unica'&&!g.obligatorio?`<label><input type="radio" name="grupo-${i}" value="" ${!linea?.opciones?.some(x=>x.grupoId===g.id)?'checked':''}><span>Sin selección</span></label>`:''}${g.opciones.map(x=>`<label><input type="${g.seleccion==='multiple'?'checkbox':'radio'}" name="grupo-${i}" value="${escapar(x.id)}" ${linea?.opciones?.some(e=>e.grupoId===g.id&&e.id===x.id)?'checked':''}><span>${escapar(x.nombre)}</span><strong>${x.tipoPrecio==='propio'?(PromosProductos.textoOpcion(x,dinero)||dinero(centavos(x.precio))+' por unidad'):x.precio?'+ '+dinero(centavos(x.precio)):'Sin costo adicional'}</strong></label>`).join('')||'<p>No hay opciones disponibles.</p>'}</fieldset>`).join('');
    contenido.innerHTML=`${foto(p)}<h3>${escapar(p.nombre)}</h3><p>Precio base: ${dinero(centavos(p.precio))}</p><form>${secciones}<fieldset class="pedido-extras pedido-extras-legacy"><legend>Extras (opcionales)</legend>${extras(p).map(x=>`<label><input type="checkbox" value="${escapar(x.id)}" ${linea?.extras.some(e=>e.id===x.id)?'checked':''}><span>${escapar(x.nombre)}</span><strong>${x.precio?'+ '+dinero(centavos(x.precio)):'Sin costo'}</strong></label>`).join('')||'<p>Este producto no tiene extras configurados.</p>'}</fieldset><label class="pedido-campo">Indicaciones (opcional)<textarea name="nota" rows="2" maxlength="300" placeholder="Por ejemplo: salsa aparte">${escapar(linea?.nota||'')}</textarea></label><label class="pedido-campo">Cantidad<input name="cantidad" type="number" min="1" max="99" step="1" required value="${linea?.cantidad||1}"></label><p class="pedido-config-total" role="status"></p><p class="pedido-config-error" role="alert"></p><button type="submit" class="pedido-confirmar">${linea?'Guardar preparación':'Agregar al pedido'}</button></form>`;
    const form=contenido.querySelector('form');
    const seleccion=()=>extras(p).filter(x=>Array.from(form.querySelectorAll('.pedido-extras-legacy input:checked')).some(el=>el.value===x.id));
    const opciones=()=>gs.flatMap((g,i)=>g.opciones.filter(x=>Array.from(form.querySelectorAll('[data-grupo="'+i+'"] input:checked')).some(el=>el.value===x.id)).map(x=>({...x,grupoId:g.id,grupoNombre:g.nombre})));
    const actualizar=()=>{const q=Number(form.elements.cantidad.value);const calculo=PromosProductos.calcular({producto:p,opciones:opciones(),extras:seleccion(),cantidad:q});form.querySelector('.pedido-config-total').textContent=Number.isInteger(q)&&q>=1&&q<=99?'Subtotal: '+dinero(calculo.total)+(calculo.etiqueta?' · '+calculo.etiqueta:''):'Elige de 1 a 99 unidades.';};form.addEventListener('input',actualizar);actualizar();
    form.addEventListener('submit',e=>{
      e.preventDefault();const q=Number(form.elements.cantidad.value);if(!Number.isInteger(q)||q<1||q>99)return;
      const error=validarOpciones(p,opciones());
      if(error){form.querySelector('.pedido-config-error').textContent=error;return;}
      if(pedido.negocio && pedido.negocio.id!==n.id && pedido.lineas.length){if(!confirm('Tu pedido es de '+pedido.negocio.nombre+'. ¿Vaciarlo y comenzar uno de '+n.nombre+'?'))return;pedido={negocio:null,lineas:[]};}
      const nueva={id:linea?.id||crypto.randomUUID(),producto:p,extras:seleccion(),opciones:opciones(),nota:form.elements.nota.value.trim(),cantidad:q};
      const otra=pedido.lineas.find(l=>l.id!==linea?.id&&mismaPreparacion(l,nueva));
      if(otra && otra.cantidad+q>99){form.querySelector('.pedido-config-error').textContent='Esta preparación ya tiene '+otra.cantidad+' unidades. El máximo es 99; reduce la cantidad.';return;}
      pedido.negocio=n;
      if(linea)pedido.lineas=pedido.lineas.filter(l=>l.id!==linea.id);
      if(otra)otra.cantidad+=q;else pedido.lineas.push(nueva);
      d.close();pintarPedido();
    });
  }
  function whatsapp(n,consulta) {
    if(!consulta&&!pedido.lineas.length)return;
    const numero=String(!consulta&&n.delivery===true&&n.tipoDelivery!=='gratis'?window.ContactosExhibicion?.actual?.mandaditos?.numero||'':n.whatsapp||'').replace(/\D/g,'');
    const normal=numero.length===10?'52'+numero:numero;
    if(!/^\d{11,15}$/.test(normal)){alert('Este negocio todavía no tiene un WhatsApp válido configurado. Usa su botón de llamada.');return;}
    const mensaje=consulta?`Hola, estoy viendo ${n.nombre} en Exhibición Frontera Comalapa. ¿Qué más tienen disponible hoy?`:`Hola, quiero consultar este pedido de ${n.nombre}:\n\n${pedido.lineas.map(l=>`${l.cantidad} × ${l.producto.nombre} — ${dinero(importe(l))}${detallePromo(l)?'\n'+detallePromo(l):''}${l.opciones?.length?'\nOpciones: '+descripcionOpciones(l):''}${l.extras.length?'\nExtras por unidad: '+l.extras.map(x=>x.nombre+' ('+(x.precio?'+ '+dinero(centavos(x.precio)):'sin costo')+')').join(', '):''}${l.nota?'\nIndicación: '+l.nota:''}`).join('\n\n')}\n\nTotal de productos: ${dinero(total())}\n${n.delivery===true&&n.tipoDelivery!=='gratis'?'Envío por cotizar.\n':''}Por favor confirmen disponibilidad, total final y forma de entrega.\nDirección o punto de entrega: `;
    if(mensaje.length>6000){alert('El pedido es demasiado largo para WhatsApp. Reduce las indicaciones o los productos distintos.');return;}
    window.open('https://wa.me/'+normal+'?text='+encodeURIComponent(mensaje),'_blank','noopener,noreferrer');
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-pedido-accion]');if(!b)return;
    const accion=b.dataset.pedidoAccion;const linea=pedido.lineas.find(l=>l.id===b.dataset.linea);
    if(accion==='ver'){verPedido(b);return;}
    if(accion==='enviar'){whatsapp(pedido.negocio,false);return;}
    if(accion==='editar'&&linea){configurar(pedido.negocio,linea.producto,b,linea);return;}
    if(accion==='vaciar'){if(!confirm('¿Vaciar todo el pedido?'))return;pedido.lineas=[];}
    if(linea && (accion==='quitar' || (accion==='menos' && linea.cantidad===1)) && !confirm('¿Quitar del pedido esta preparación de '+linea.producto.nombre+'?')) return;
    if(linea){if(accion==='mas')linea.cantidad=Math.min(99,linea.cantidad+1);if(accion==='menos')linea.cantidad--;if(accion==='quitar')linea.cantidad=0;pedido.lineas=pedido.lineas.filter(l=>l.cantidad>0);}
    pintarPedido();
  });

  function abrirFoto(p,origen) {
    document.getElementById('comida-visor')?.remove();
    const dialog=document.createElement('dialog');dialog.id='comida-visor';dialog.className='comida-visor';
    dialog.setAttribute('aria-labelledby','comida-visor-titulo');
    dialog.innerHTML='<button type="button" class="comida-visor-cerrar" aria-label="Cerrar foto">Cerrar ×</button><h2 id="comida-visor-titulo"></h2><img class="comida-foto-grande"><p class="comida-visor-precio"></p>';
    dialog.querySelector('h2').textContent=p.nombre;
    const img=dialog.querySelector('img');img.src=imagen(p.foto);img.alt=p.nombre;
    img.addEventListener('error',()=>{img.hidden=true;const aviso=document.createElement('p');aviso.textContent='No se pudo cargar la foto.';img.after(aviso);});
    dialog.querySelector('.comida-visor-precio').textContent=dinero(Math.round(p.precio*100));
    const ingredientes=typeof p.ingredientes==='string'?p.ingredientes.trim():'';
    if(ingredientes){
      const detalles=document.createElement('details');detalles.className='comida-ingredientes';
      const boton=document.createElement('summary');boton.textContent='Ingredientes';
      const texto=document.createElement('p');texto.textContent=ingredientes;detalles.append(boton,texto);dialog.append(detalles);
    }
    const overflow=document.body.style.overflow;
    dialog.addEventListener('close',()=>{document.body.style.overflow=overflow;dialog.remove();if(origen.isConnected)origen.focus({preventScroll:true});},{once:true});
    dialog.querySelector('button').onclick=()=>dialog.close();
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
    document.body.append(dialog);dialog.showModal();document.body.style.overflow='hidden';
  }
  function conectar(n) {
    negocioVisible=n;
    window.MejorasExhibicion?.perfil(n);
    const el=document.querySelector('.comida-menu');pintarPedido();if(!el)return;
    const consulta=document.createElement('button');consulta.type='button';consulta.textContent='Preguntar qué más hay disponible';consulta.onclick=()=>whatsapp(n,true);el.append(consulta);
    el.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.verProducto){const p=productos(n).find(p=>p.id===b.dataset.verProducto);if(p)abrirFoto(p,b);return;}
      if(b.dataset.agregarProducto){const p=productos(n).find(p=>p.id===b.dataset.agregarProducto);if(p)configurar(n,p,b);}
    });
  }
  function carrusel(lista) {
    window.MejorasExhibicion?.ofertas(lista);
    window.__listaOfertasProductos=lista;
    const seccion=document.getElementById('comida-inicio');if(!seccion)return;
    const grupos=lista.filter(n=>n.categoria==='comida' && n.activo!==false).map(n=>productos(n).filter(p=>p.enCarrusel!==false).map(p=>({n,p})));
    const items=[];for(let i=0;grupos.some(g=>g[i]);i++)grupos.forEach(g=>{if(g[i])items.push(g[i]);});
    seccion.hidden=!items.length;if(!items.length)return;
    const tarjetas=items.map(({n,p})=>`<a href="?negocio=${encodeURIComponent(n.slug)}&producto=${encodeURIComponent(p.id)}" class="comida-producto comida-carrusel-producto" data-slug="${escapar(n.slug)}" data-producto="${escapar(p.id)}">${foto(p)}<strong>${escapar(p.nombre)}</strong><span>${escapar(n.nombre)} · ${dinero(Math.round(p.precio*100))}</span></a>`).join('');
    seccion.innerHTML=`<div class="comida-cabecera"><div><h2>¿Qué se te antoja hoy?</h2><p>Descubre el menú de los negocios de aquí.</p></div></div><div class="comida-carrusel" aria-label="Productos de negocios de comida"><div class="comida-carrusel-track">${tarjetas}${tarjetas}</div></div>`;

    const fila=seccion.querySelector('.comida-carrusel');
    const track=seccion.querySelector('.comida-carrusel-track');
    const originales=Array.from(track.querySelectorAll('a')).slice(0,items.length);
    track.querySelectorAll('a').forEach((enlace,i)=>{
      const item=items[i%items.length];
      enlace.addEventListener('click',e=>{
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('comida-abrir',{detail:{slug:item.n.slug,productoId:item.p.id}}));
      });
    });

    let pausa=false;
    let raf=0,ultimo=0,anchoCiclo=0;
    let inicioAleatorio=0;
    if(items.length>1){
      if(globalThis.crypto?.getRandomValues){
        const r=new Uint32Array(1);crypto.getRandomValues(r);inicioAleatorio=r[0]%items.length;
      }else inicioAleatorio=Math.floor(Math.random()*items.length);
    }
    const medir=()=>{
      if(!originales.length)return;
      const clonPrimero=track.querySelectorAll('a')[items.length];
      anchoCiclo=clonPrimero?clonPrimero.offsetLeft-originales[0].offsetLeft:track.scrollWidth/2;
    };
    const colocarInicio=()=>{
      if(!originales.length)return;
      const destino=originales[inicioAleatorio];
      if(destino)fila.scrollLeft=Math.max(0,destino.offsetLeft-originales[0].offsetLeft);
    };
    const animar=tiempo=>{
      if(!ultimo)ultimo=tiempo;
      const dt=Math.min(50,tiempo-ultimo);ultimo=tiempo;
      if(!pausa&&!document.hidden&&anchoCiclo>0){
        fila.scrollLeft+=dt*0.070;
        if(fila.scrollLeft>=anchoCiclo)fila.scrollLeft-=anchoCiclo;
      }
      raf=requestAnimationFrame(animar);
    };
    const pausar=()=>{pausa=true;};
    const reanudar=()=>{pausa=false;};
    fila.addEventListener('mouseenter',pausar);
    fila.addEventListener('mouseleave',reanudar);
    fila.addEventListener('focusin',pausar);
    fila.addEventListener('focusout',e=>{if(!fila.contains(e.relatedTarget))reanudar();});
    let reanudarTouch;
    fila.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'){pausar();clearTimeout(reanudarTouch);}});
    const finTouch=()=>{clearTimeout(reanudarTouch);reanudarTouch=setTimeout(reanudar,700);};
    fila.addEventListener('pointerup',finTouch);fila.addEventListener('pointercancel',finTouch);
    document.addEventListener('visibilitychange',()=>{ultimo=0;});
    addEventListener('resize',()=>{medir();if(anchoCiclo&&fila.scrollLeft>=anchoCiclo)fila.scrollLeft%=anchoCiclo;},{passive:true});
    requestAnimationFrame(()=>{medir();colocarInicio();raf=requestAnimationFrame(animar);});
  }
  setInterval(()=>{
    if(pedido.lineas.length)pintarPedido();
    document.querySelectorAll('.pedido-configurar form').forEach(f=>f.dispatchEvent(new Event('input')));
    if(window.__listaOfertasProductos)window.MejorasExhibicion?.ofertas(window.__listaOfertasProductos);
  },30000);
  window.ComidaExhibicion={menu,conectar,carrusel,productos,dinero,imagen};
})();

