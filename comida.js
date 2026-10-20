/* Menú y pedido: los precios se calculan en centavos; comida agrupada por negocio; servicios digitales separados. */
(() => {
  'use strict';
  const escapar = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const imagen = v => typeof v === 'string' && /^imagenes\/[^?#<>"\x00-\x1f]+\.(webp|png|jpe?g)$/i.test(v) && !v.includes('..') && !v.includes('\\') ? v : '';
  const dinero = centavos => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(centavos / 100);
  function productos(n) { return (Array.isArray(n.productos) ? n.productos : []).filter(p => p && typeof p.id === 'string' && typeof p.nombre === 'string' && p.nombre.trim() && Number.isFinite(p.precio) && p.precio >= 0 && p.precio <= 100000 && p.disponible !== false); }
  const digital = n => n?.tipoCatalogo === 'digital';
  const duracion = p => (Number.isInteger(p.duracionMeses)&&p.duracionMeses>0?p.duracionMeses:1);
  const dispositivos = p => (Number.isInteger(p.dispositivos)&&p.dispositivos>0?p.dispositivos:1);
  const condiciones = p => `Duración: ${duracion(p)} ${duracion(p)===1?'mes':'meses'} · Uso: ${dispositivos(p)} ${dispositivos(p)===1?'dispositivo':'dispositivos'}`;
  function informacionDigital(p) {
    return `<details class="digital-aviso"><summary>Información del servicio · Ver detalles</summary><div><p>Recibe tus datos de acceso por WhatsApp. Confirma la disponibilidad antes de realizar tu pedido.</p>${/netflix/i.test(p.nombre)?'<p>Netflix se entrega como un perfil dentro de una cuenta. Si aparece un aviso de verificación del hogar, escríbenos por WhatsApp para revisar tu caso. Las verificaciones dependen de Netflix; cuando corresponda un cambio de acceso, se conserva la vigencia restante contratada.</p>':''}<p>Puedes contactarnos por WhatsApp por cualquier duda o detalle.</p></div></details>`;
  }
  function foto(p, esDigital=false) { const ruta=imagen(p.foto); return ruta ? `<img src="${escapar(ruta)}" alt="${escapar(p.nombre)}" loading="lazy" onerror="this.hidden=true">` : `<div class="comida-sin-foto" aria-hidden="true">${esDigital?'📺':'🍽️'}</div>`; }
  function etiquetas(p){
    const propias=grupos(p).flatMap(g=>g.opciones.filter(o=>o.tipoPrecio==='propio'));
    const ofertas=propias.length?propias.filter(o=>PromosProductos.vigente(o.promocion,o.precio)).map(o=>({nombre:o.nombre,precio:o.precio,promo:o.promocion})):PromosProductos.vigente(p.promocion,p.precio)?[{nombre:'',precio:p.precio,promo:p.promocion}]:[];
    return ofertas.map(o=>'<p class="pedido-promo"><span class="promo-etiqueta">'+escapar(PromosProductos.etiqueta(o.promo))+'</span> '+escapar(o.nombre)+(o.promo.tipo==='precio'?' · <del>'+dinero(centavos(o.precio))+'</del> '+dinero(centavos(o.promo.precio)):' · Dos iguales por '+dinero(centavos(o.precio)))+'</p>').join('');
  }
  function menu(n) {
    if (!productos(n).length) return '';
    const tarjetas=ps=>ps.map(p=>`<article class="comida-producto" data-producto-id="${escapar(p.id)}">${imagen(p.foto) ? `<button type="button" class="comida-ampliar" data-ver-producto="${escapar(p.id)}" aria-label="Ampliar foto de ${escapar(p.nombre)}">${foto(p,digital(n))}<span>Ver foto e información</span></button>` : foto(p,digital(n))}<h5>${escapar(p.nombre)}</h5>${etiquetas(p)}<p>${dinero(Math.round(p.precio*100))}</p>${digital(n)?`<p class="digital-condiciones">${escapar(condiciones(p))}</p>`:""}<button type="button" data-agregar-producto="${escapar(p.id)}">Agregar al pedido</button></article>`).join('');
    const lista=productos(n);const nombres=[...new Set(lista.map(p=>String(p.seccion||'').trim()||'Otros productos'))];
    const contenido=digital(n)?nombres.map(nombre=>`<section class="digital-seccion"><h5>${escapar(nombre)}</h5><div class="comida-grid">${tarjetas(lista.filter(p=>(String(p.seccion||'').trim()||'Otros productos')===nombre))}</div></section>`).join(''):lista.some(p=>String(p.seccion||'').trim())?nombres.map(nombre=>{const ps=lista.filter(p=>(String(p.seccion||'').trim()||'Otros productos')===nombre);return `<details class="comida-seccion"><summary>${escapar(nombre)} <small>${ps.length} ${ps.length===1?'producto':'productos'}</small></summary><div class="comida-grid">${tarjetas(ps)}</div></details>`;}).join(''): `<div class="comida-grid">${tarjetas(lista)}</div>`;
    return `<section class="comida-menu" aria-label="${digital(n)?'Catálogo de servicios':'Menú y productos'}"><h4>${digital(n)?'Catálogo de servicios':'Menú / Productos'}</h4><p>${digital(n)?'Elige tu servicio. Entrega y soporte por WhatsApp. Precios en MXN.':'Precios en MXN. Disponibilidad y entrega por confirmar.'}</p>${contenido}${digital(n)&&Array.isArray(n.metodosPago)&&n.metodosPago.length?`<section class="digital-pagos"><h4>Métodos de pago</h4><ul>${n.metodosPago.filter(x=>typeof x==='string').map(x=>`<li>${escapar(x)}</li>`).join('')}</ul><p>Pide los datos de pago por WhatsApp.</p></section>`:''}<div id="comida-pedido"></div></section>`;
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
  function mismaPreparacion(a,b) {return (a.negocio?.id||pedido.negocio?.id)===(b.negocio?.id||pedido.negocio?.id) && a.producto.id===b.producto.id && a.nota===b.nota && firmaOpciones(a)===firmaOpciones(b) && a.extras.map(x=>x.id).sort().join('|')===b.extras.map(x=>x.id).sort().join('|');}
  const esComida=n=>n?.categoria==='comida'&&!digital(n);
  const dueno=l=>l.negocio||pedido.negocio;
  function gruposPedido(){
    const mapa=new Map();for(const l of pedido.lineas){const n=dueno(l);if(!n)continue;if(!mapa.has(n.id))mapa.set(n.id,{negocio:n,lineas:[]});mapa.get(n.id).lineas.push(l);}return [...mapa.values()];
  }
  function normalizarPedido(){
    for(const l of pedido.lineas)if(!l.negocio)l.negocio=pedido.negocio;
    pedido.negocio=pedido.lineas[0]?.negocio||null;
    if(!pedido.lineas.length){pagoPedido='';nombrePedido='';entregaPedido='';modoEntrega='domicilio';}
    if(gruposPedido().length>1)modoEntrega='domicilio';
  }
  function incorporar(n,nueva,linea){
    if(pedido.lineas.length&&pedido.negocio?.id!==n.id&&!(esComida(n)&&pedido.lineas.every(l=>esComida(dueno(l)))))return 'Los servicios digitales y los pedidos de comida se realizan por separado.';
    for(const l of pedido.lineas)if(!l.negocio)l.negocio=pedido.negocio;
    nueva.negocio=n;
    const otra=pedido.lineas.find(l=>l.id!==linea?.id&&mismaPreparacion(l,nueva));
    if(otra&&otra.cantidad+nueva.cantidad>99)return 'Esta preparación supera el máximo de 99 unidades.';
    if(linea)pedido.lineas=pedido.lineas.filter(l=>l.id!==linea.id);
    if(otra)otra.cantidad+=nueva.cantidad;else pedido.lineas.push(nueva);
    normalizarPedido();return '';
  }
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
  let pagoPedido='';
  let nombrePedido='';
  let entregaPedido='';
  let modoEntrega='domicilio';
  const opcionesPago=n=>digital(n)?['Transferencia','Depósito']:modoEntrega==='recoger'?['Transferencia']:['Efectivo','Transferencia'];
  function avisoPago(n,pago){
    if(pago==='Transferencia')return '\u2705 Aprovecha y paga por transferencia sin comisión.';
    if(pago==='Depósito')return 'Puedes depositar en OXXO, Farmacias del Ahorro o BBVA. Solicita los datos por WhatsApp. El establecimiento puede cobrar su propia comisión por el depósito.';
    return '\u2705 Aprovecha y paga por transferencia sin comisión.';
  }
  function selectorEntrega(){
    const varios=gruposPedido().length>1;
    return `<section class="pedido-pago"><label>¿Cómo quieres recibirlo?<select data-modo-entrega><option value="domicilio" ${modoEntrega==='domicilio'?'selected':''}>A domicilio</option><option value="recoger" ${modoEntrega==='recoger'?'selected':''} ${varios?'disabled':''}>Pasar a recoger · Sin envío</option></select></label>${varios?'<p>Para pasar a recoger, realiza un pedido por negocio. El pedido combinado se entrega a domicilio.</p>':modoEntrega==='recoger'?'<p class="pedido-pago-aviso">Recoge en el negocio sin pagar envío. Para confirmar la preparación se requiere el pago completo por transferencia. El negocio te confirma disponibilidad, total, datos de pago y hora de recogida por WhatsApp.</p>':'<p>Entrega: se confirma al solicitar.</p>'}</section>`;
  }
  function selectorPago(n){
    const opciones=opcionesPago(n);if(!opciones.includes(pagoPedido))pagoPedido='';
    return `<section class="pedido-pago"><label>¿Cómo prefieres pagar?<select data-pago-pedido aria-label="Forma de pago del pedido"><option value="">Elige una opción</option>${opciones.map(p=>`<option value="${escapar(p)}" ${pagoPedido===p?'selected':''}>${escapar(p==='Transferencia'?'Transferencia bancaria':p)}</option>`).join('')}</select></label><p class="pedido-pago-aviso" role="status">${escapar(avisoPago(n,pagoPedido))}</p>${digital(n)?'<small>Transferencias mediante BBVA o Banamex. Los datos de pago se comparten por WhatsApp.</small>':''}</section>`;
  }
  function textoPago(pago){return pago==='Transferencia'?'\u{1f4b3} Pagaré por transferencia bancaria.':pago==='Depósito'?'\u{1f3ea} Pagaré mediante depósito.':'\u{1f4b5} Pagaré en efectivo.';}
  document.addEventListener('change',e=>{
    if(e.target.matches?.('[data-modo-entrega]')&&pedido.negocio&&!digital(pedido.negocio)){if(e.target.value==='recoger'&&gruposPedido().length>1)return;modoEntrega=e.target.value==='recoger'?'recoger':'domicilio';if(modoEntrega==='recoger')pagoPedido='Transferencia';pintarPedido();return;}
    if(!e.target.matches?.('[data-pago-pedido]')||!pedido.negocio)return;
    pagoPedido=opcionesPago(pedido.negocio).includes(e.target.value)?e.target.value:'';
    document.querySelectorAll('[data-pago-pedido]').forEach(select=>select.value=pagoPedido);
    document.querySelectorAll('.pedido-pago-aviso').forEach(aviso=>aviso.textContent=avisoPago(pedido.negocio,pagoPedido));
  });
  document.addEventListener('input',e=>{if(e.target.matches?.('[data-entrega-pedido]'))entregaPedido=e.target.value.slice(0,500);if(e.target.matches?.('[data-cliente-pedido]')){nombrePedido=e.target.value.slice(0,120);document.querySelectorAll('[data-cliente-pedido]').forEach(i=>{if(i!==e.target)i.value=nombrePedido;});}});
  function resumen() {
    if(!pedido.lineas.length)return '<p>Agrega productos para armar tu pedido.</p>';
    const n=pedido.negocio;
    if(digital(n)) return `<h4>Mi pedido · ${escapar(n.nombre)}</h4>${pedido.lineas.map(l=>`<div class="pedido-linea"><div><strong>${l.cantidad} × ${escapar(l.producto.nombre)} — ${dinero(importe(l))}</strong><p>${escapar(condiciones(l.producto))}</p>${l.nota?`<p>${l.producto.nombre.includes(' + ')||l.cantidad>1?'Nombres de los perfiles':'Nombre del perfil'}: ${escapar(l.nota)}</p>`:''}</div><div class="pedido-controles"><button type="button" data-pedido-accion="menos" data-linea="${l.id}" aria-label="Quitar una unidad de ${escapar(l.producto.nombre)}">−</button><span>${l.cantidad}</span><button type="button" data-pedido-accion="mas" data-linea="${l.id}" aria-label="Agregar una unidad de ${escapar(l.producto.nombre)}" ${l.cantidad>=99?'disabled':''}>+</button><button type="button" data-pedido-accion="editar" data-linea="${l.id}">Editar</button><button type="button" data-pedido-accion="quitar" data-linea="${l.id}">Quitar</button></div></div>`).join('')}<p class="pedido-total" role="status">Total: ${dinero(total())}</p><p>Entrega y soporte por WhatsApp.</p>${selectorPago(n)}<div class="comida-acciones"><button type="button" data-pedido-accion="enviar">Realizar pedido</button><button type="button" data-pedido-accion="vaciar">Vaciar pedido</button></div>`;
    const agrupados=gruposPedido();
    return `<h4>${agrupados.length>1?'Mi pedido · Varios negocios':'Mi pedido · '+escapar(n.nombre)}</h4>${agrupados.map(g=>`<section class="pedido-negocio-grupo"><h5>${escapar(g.negocio.nombre)}</h5>${g.lineas.map(l=>`<div class="pedido-linea"><div><strong>${escapar(l.producto.nombre)}</strong><p>${escapar(descripcionOpciones(l))}</p><p>${l.extras.length?l.extras.map(x=>`${escapar(x.nombre)} (${x.precio?'+ '+dinero(centavos(x.precio)):'sin costo'})`).join(' · '):'Sin extras'}</p>${l.nota?`<p class="pedido-nota">Indicación: ${escapar(l.nota)}</p>`:''}<p class="pedido-promo">${escapar(detallePromo(l))}</p><p>${dinero(unitario(l))} por unidad · <strong>${dinero(importe(l))}</strong></p></div><div class="pedido-controles"><button type="button" data-pedido-accion="menos" data-linea="${l.id}" aria-label="Quitar una unidad de ${escapar(l.producto.nombre)}">−</button><span>${l.cantidad}</span><button type="button" data-pedido-accion="mas" data-linea="${l.id}" aria-label="Agregar una unidad de ${escapar(l.producto.nombre)}" ${l.cantidad>=99?'disabled':''}>+</button><button type="button" data-pedido-accion="editar" data-linea="${l.id}">Editar</button><button type="button" data-pedido-accion="quitar" data-linea="${l.id}">Quitar</button></div></div>`).join('')}<p class="pedido-subtotal-negocio">Subtotal: ${dinero(g.lineas.reduce((s,l)=>s+importe(l),0))}</p></section>`).join('')}<p class="pedido-total" role="status">Total de productos: ${dinero(total())}</p><section class="pedido-checkout"><h4>📍 Entrega y pago</h4><p>Completa estos datos y continúa por WhatsApp.</p><label class="pedido-nombre">¿A nombre de quién? <input data-cliente-pedido type="text" autocomplete="name" maxlength="120" required placeholder="Tu nombre" value="${escapar(nombrePedido)}"></label>${selectorEntrega()}${modoEntrega==='domicilio'?`<label class="pedido-entrega">¿Dónde lo entregamos?<textarea required data-entrega-pedido maxlength="500" rows="2" placeholder="Dirección y referencias">${escapar(entregaPedido)}</textarea></label>`:''}${selectorPago(n)}<p class="pedido-checkout-nota">💬 Al continuar se guardará tu solicitud con un folio y se abrirá WhatsApp. Pulsa Enviar en el chat; recepción confirmará disponibilidad y total.</p></section><div class="comida-acciones"><button type="button" data-pedido-accion="enviar">Realizar pedido</button><button type="button" data-pedido-accion="vaciar">Vaciar pedido</button></div><div data-confirmacion-pedido aria-live="polite"></div>`;
  }
  function pintarPedido() {
    const el=document.getElementById('comida-pedido');
    if(el)el.innerHTML=resumen();
    document.querySelectorAll('.pedido-resumen-modal').forEach(e=>e.innerHTML=resumen());
    if(!barra){barra=document.createElement('button');barra.type='button';barra.className='pedido-barra';barra.onclick=()=>verPedido(barra);document.body.append(barra);}
    barra.hidden=!pedido.lineas.length;document.body.classList.toggle('tiene-pedido',Boolean(pedido.lineas.length));
    barra.textContent=`🛒 Ver mi pedido · ${cantidadTotal()} ${cantidadTotal()===1?'producto':'productos'} · ${dinero(total())}`;
  }
  function verPedido(origen) {const d=dialogo('Tu pedido','pedido-dialogo',origen);const el=d.querySelector('.dialogo-contenido');el.classList.add('pedido-resumen-modal');el.innerHTML=resumen();}
  function configurar(n,p,origen,linea=null) {
    const d=dialogo(digital(n)?(linea?'Editar servicio':'Elige tu servicio'):(linea?'Editar preparación':'Personaliza tu pedido'),'pedido-configurar',origen);
    const contenido=d.querySelector('.dialogo-contenido');
    const gs=digital(n)?[]:grupos(p);
    const encabezado=g=>({tamaño:'Elige tu tamaño',sabor:'Elige tu sabor','tipo de carne':'Elige el tipo de carne',presentación:'Elige la presentación'}[String(g.nombre).toLocaleLowerCase('es-MX')]||'Elige: '+g.nombre);
    const secciones=gs.map((g,i)=>`<fieldset class="pedido-extras pedido-grupo" data-grupo="${i}"><legend>${escapar(encabezado(g))}</legend><p>${g.obligatorio?'Obligatorio':'Opcional'} · ${g.seleccion==='multiple'?'Puedes elegir varias':'Elige una opción'}</p>${g.seleccion==='unica'&&!g.obligatorio?`<label><input type="radio" name="grupo-${i}" value="" ${!linea?.opciones?.some(x=>x.grupoId===g.id)?'checked':''}><span>Sin selección</span></label>`:''}${g.opciones.map(x=>`<label><input type="${g.seleccion==='multiple'?'checkbox':'radio'}" name="grupo-${i}" value="${escapar(x.id)}" ${linea?.opciones?.some(e=>e.grupoId===g.id&&e.id===x.id)?'checked':''}><span>${escapar(x.nombre)}</span><strong>${x.tipoPrecio==='propio'?(PromosProductos.textoOpcion(x,dinero)||dinero(centavos(x.precio))+' por unidad'):x.precio?'+ '+dinero(centavos(x.precio)):'Sin costo adicional'}</strong></label>`).join('')||'<p>No hay opciones disponibles.</p>'}</fieldset>`).join('');
    contenido.innerHTML=`${foto(p,digital(n))}<h3>${escapar(p.nombre)}</h3><p>${digital(n)?'Precio':'Precio base'}: ${dinero(centavos(p.precio))}</p>${digital(n)?`<p>${escapar(condiciones(p))}</p>${informacionDigital(p)}`:''}<form>${digital(n)?'':secciones}<fieldset class="pedido-extras pedido-extras-legacy" ${digital(n)?'hidden':''}><legend>Extras (opcionales)</legend>${extras(p).map(x=>`<label><input type="checkbox" value="${escapar(x.id)}" ${linea?.extras.some(e=>e.id===x.id)?'checked':''}><span>${escapar(x.nombre)}</span><strong>${x.precio?'+ '+dinero(centavos(x.precio)):'Sin costo'}</strong></label>`).join('')||'<p>Este producto no tiene extras configurados.</p>'}</fieldset><label class="pedido-campo">${digital(n)?(p.nombre.includes(' + ')?'¿A qué nombre creamos tus perfiles?':'¿A qué nombre creamos tu perfil?'):'Indicaciones (opcional)'}<textarea name="nota" rows="2" maxlength="300" placeholder="${digital(n)?'Por ejemplo: María López':'Por ejemplo: salsa aparte'}">${escapar(linea?.nota||'')}</textarea></label><label class="pedido-campo">Cantidad<input name="cantidad" type="number" min="1" max="99" step="1" required value="${linea?.cantidad||1}"></label><p class="pedido-config-total" role="status"></p><p class="pedido-config-error" role="alert"></p><button type="submit" class="pedido-confirmar">${linea?(digital(n)?'Guardar servicio':'Guardar preparación'):'Agregar al pedido'}</button></form>`;
    const form=contenido.querySelector('form');
    const seleccion=()=> (digital(n)?[]:extras(p)).filter(x=>Array.from(form.querySelectorAll('.pedido-extras-legacy input:checked')).some(el=>el.value===x.id));
    const opciones=()=>gs.flatMap((g,i)=>g.opciones.filter(x=>Array.from(form.querySelectorAll('[data-grupo="'+i+'"] input:checked')).some(el=>el.value===x.id)).map(x=>({...x,grupoId:g.id,grupoNombre:g.nombre})));
    const actualizar=()=>{const q=Number(form.elements.cantidad.value);const calculo=PromosProductos.calcular({producto:p,opciones:opciones(),extras:seleccion(),cantidad:q});form.querySelector('.pedido-config-total').textContent=Number.isInteger(q)&&q>=1&&q<=99?'Subtotal: '+dinero(calculo.total)+(calculo.etiqueta?' · '+calculo.etiqueta:''):'Elige de 1 a 99 unidades.';};form.addEventListener('input',actualizar);actualizar();
    form.addEventListener('submit',e=>{
      e.preventDefault();const q=Number(form.elements.cantidad.value);if(!Number.isInteger(q)||q<1||q>99)return;
      const error=digital(n)?'':validarOpciones(p,opciones());
      if(error){form.querySelector('.pedido-config-error').textContent=error;return;}
      if(pedido.negocio && pedido.negocio.id!==n.id && pedido.lineas.length && !(esComida(n)&&pedido.lineas.every(l=>esComida(dueno(l))))){if(!confirm('Tu pedido es de '+pedido.negocio.nombre+'. ¿Vaciarlo y comenzar uno de '+n.nombre+'?'))return;pedido={negocio:null,lineas:[]};pagoPedido='';}
      const nueva={id:linea?.id||crypto.randomUUID(),producto:p,negocio:n,extras:seleccion(),opciones:opciones(),nota:form.elements.nota.value.trim(),cantidad:q};
      const errorPedido=incorporar(n,nueva,linea);
      if(errorPedido){form.querySelector('.pedido-config-error').textContent=errorPedido;return;}
      d.close();pintarPedido();
    });
  }
  function mensajeDigital(lineas,importeTotal) {
    return `Hola, quiero realizar este pedido:\n\n${lineas.map(l=>`${l.cantidad} × ${l.producto.nombre} — ${dinero(importe(l))}\nDuración: ${duracion(l.producto)} ${duracion(l.producto)===1?'mes':'meses'}\nDispositivos: ${dispositivos(l.producto)}${l.nota?'\n'+(l.producto.nombre.includes(' + ')||l.cantidad>1?'Nombres de los perfiles':'Nombre del perfil')+': '+l.nota:''}`).join('\n\n')}\n\nTotal: ${dinero(importeTotal)}`;
  }
  function mensajeComida(){
    const gs=gruposPedido();
    const textoLinea=l=>`${l.cantidad} × ${l.producto.nombre} — ${dinero(importe(l))}${detallePromo(l)?'\n'+detallePromo(l):''}${l.opciones?.length?'\nOpciones: '+descripcionOpciones(l):''}${l.extras.length?'\nExtras: '+l.extras.map(x=>x.nombre+' ('+dinero(centavos(x.precio))+')').join(', '):''}${l.nota?'\nIndicación: '+l.nota:''}`;
    return (gs.length>1?'Hola, quiero solicitar este pedido de varios negocios:':'Hola, quiero realizar este pedido de '+gs[0].negocio.nombre+':')+'\n\n'+gs.map(g=>'\u{1f37d} '+g.negocio.nombre+'\n'+g.lineas.map(textoLinea).join('\n\n')+'\nSubtotal: '+dinero(g.lineas.reduce((s,l)=>s+importe(l),0))).join('\n\n')+'\n\nTotal de productos: '+dinero(total())+(modoEntrega==='recoger'?'\n\u{1f6cd} Pasaré a recoger en el negocio. Sin cargo de envío.\nConfirmaré el pago completo por transferencia antes de que preparen mi pedido.':entregaPedido?'\n\u{1f3e0} Entregar en: '+entregaPedido:'')+(modoEntrega==='recoger'?'\n¿Me confirman disponibilidad, el total, los datos para transferir y cuándo puedo recogerlo?':'\n¿Me confirman disponibilidad y el total con el servicio de entrega?');
  }
  function whatsapp(n,consulta,origen) {
    if(!consulta&&!pedido.lineas.length)return;
    if(!consulta && (pedido.negocio?.id!==n?.id || pedido.lineas.some(l=>!dueno(l)?.productos?.some(p=>p.id===l.producto.id)|| (gruposPedido().length>1&&!esComida(dueno(l)))))){alert('El pedido no corresponde a este negocio. Revisa tu carrito antes de enviarlo.');return;}
    const contenedor=origen?.closest?.('.pedido-resumen-modal')||document.getElementById('comida-pedido');
    if(!consulta&&!digital(n)&&(!nombrePedido.trim()||modoEntrega!=='recoger'&&!entregaPedido.trim())){const campo=contenedor?.querySelector(!nombrePedido.trim()?'[data-cliente-pedido]':'[data-entrega-pedido]');campo?.focus();campo?.reportValidity();return;}
    if(!consulta&&!opcionesPago(n).includes(pagoPedido)){alert('Elige cómo prefieres pagar antes de realizar el pedido.');return;}
    const numero=String(!consulta&&!digital(n)&&modoEntrega!=='recoger'&&(gruposPedido().length>1||(n.delivery===true&&n.tipoDelivery!=='gratis'))?window.ContactosExhibicion?.actual?.mandaditos?.numero||'':n.whatsapp||'').replace(/\D/g,'');
    const normal=window.ContactosExhibicion?.numero(numero)||(numero.length===10?'52'+numero:numero);
    if(!/^\d{11,15}$/.test(normal)){alert('Este negocio todavía no tiene un WhatsApp válido configurado. Usa su botón de llamada.');return;}
    let mensaje=digital(n)?(consulta?`Hola, estoy viendo el catálogo de ${n.nombre}. Quiero información sobre sus servicios digitales.`:mensajeDigital(pedido.lineas,total())):consulta?`Hola, estoy viendo ${n.nombre} en Exhibición Frontera Comalapa. ¿Qué más tienen disponible hoy?`:mensajeComida();
    if(!consulta)mensaje+='\n\n'+textoPago(pagoPedido)+(pagoPedido==='Transferencia'||pagoPedido==='Depósito'?'\n¿Me confirmas el total y los datos de pago?':'');
    if(mensaje.length>6000){alert('El pedido es demasiado largo para WhatsApp. Reduce las indicaciones o los productos distintos.');return;}
    if(!consulta&&!digital(n)){
      const solicitud={cliente:nombrePedido.trim(),entrega:modoEntrega,pago:pagoPedido==='Transferencia'?'transferencia':'efectivo',direccion:entregaPedido,total_esperado:total(),lineas:pedido.lineas.map(l=>({negocio:dueno(l).slug,producto:l.producto.id,cantidad:l.cantidad,opciones:(l.opciones||[]).map(o=>({grupo:o.grupoId,opcion:o.id})),extras:l.extras.map(x=>x.id),nota:l.nota||''}))};
      const abrir=()=>window.PedidosExhibicion.abrir({solicitud,numero:normal,mensaje,contenedor});
      if(window.PedidosExhibicion?.version===24){abrir();return;}
      const carga=document.createElement('script');carga.src='/pedidos-publicos.js?v=24';carga.onload=abrir;carga.onerror=()=>alert('No se pudo cargar el registro del pedido. Revisa tu conexión y vuelve a intentarlo.');document.head.append(carga);return;
    }
    window.open('https://api.whatsapp.com/send?phone='+normal+'&text='+encodeURIComponent(mensaje),'_blank','noopener,noreferrer');
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-pedido-accion]');if(!b)return;
    const accion=b.dataset.pedidoAccion;const linea=pedido.lineas.find(l=>l.id===b.dataset.linea);
    if(accion==='ver'){verPedido(b);return;}
    if(accion==='enviar'){whatsapp(pedido.negocio,false,b);return;}
    if(accion==='editar'&&linea){configurar(dueno(linea),linea.producto,b,linea);return;}
    if(accion==='vaciar'){if(!confirm('¿Vaciar todo el pedido?'))return;pedido.lineas=[];pagoPedido='';}
    if(linea && (accion==='quitar' || (accion==='menos' && linea.cantidad===1)) && !confirm('¿Quitar del pedido esta preparación de '+linea.producto.nombre+'?')) return;
    if(linea){if(accion==='mas')linea.cantidad=Math.min(99,linea.cantidad+1);if(accion==='menos')linea.cantidad--;if(accion==='quitar')linea.cantidad=0;pedido.lineas=pedido.lineas.filter(l=>l.cantidad>0);}
    normalizarPedido();pintarPedido();
  });

  function abrirFoto(p,origen,esDigital=false) {
    document.getElementById('comida-visor')?.remove();
    const dialog=document.createElement('dialog');dialog.id='comida-visor';dialog.className='comida-visor';
    dialog.setAttribute('aria-labelledby','comida-visor-titulo');
    dialog.innerHTML='<button type="button" class="comida-visor-cerrar" aria-label="Cerrar foto">Cerrar ×</button><h2 id="comida-visor-titulo"></h2><img class="comida-foto-grande"><p class="comida-visor-precio"></p>';
    dialog.querySelector('h2').textContent=p.nombre;
    const img=dialog.querySelector('img');img.src=imagen(p.foto);img.alt=p.nombre;
    img.addEventListener('error',()=>{img.hidden=true;const aviso=document.createElement('p');aviso.textContent='No se pudo cargar la foto.';img.after(aviso);});
    dialog.querySelector('.comida-visor-precio').textContent=dinero(Math.round(p.precio*100));
    if(esDigital) dialog.insertAdjacentHTML('beforeend', informacionDigital(p));
    const ingredientes=typeof p.ingredientes==='string'?p.ingredientes.trim():'';
    if(ingredientes){
      const detalles=document.createElement('details');detalles.className='comida-ingredientes';
      const boton=document.createElement('summary');boton.textContent=esDigital?'Detalles del servicio':'Ingredientes';
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
      if(b.dataset.verProducto){const p=productos(n).find(p=>p.id===b.dataset.verProducto);if(p)abrirFoto(p,b,digital(n));return;}
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
    const tarjetas=items.map(({n,p})=>`<a href="?negocio=${encodeURIComponent(n.slug)}&producto=${encodeURIComponent(p.id)}" class="comida-producto comida-carrusel-producto" data-slug="${escapar(n.slug)}" data-producto="${escapar(p.id)}">${foto(p,digital(n))}<strong>${escapar(p.nombre)}</strong><span>${escapar(n.nombre)} · ${dinero(Math.round(p.precio*100))}</span></a>`).join('');
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
  window.ComidaExhibicion={menu,conectar,carrusel,productos,dinero,imagen,mensajeDigital};
})();

