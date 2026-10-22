/* Formularios de servicios: el destinatario queda fijado al abrir cada solicitud. */
(() => {
  'use strict';
  const esquemas={
    mandaditos:{titulo:'Solicitar mandadito',campos:[
      ['servicio','¿Qué necesitas?',['Comprar algo','Recoger algo','Pagar algo','Otra cosa'],true],
      ['detalle','¿Qué necesitas comprar o recoger?','textarea',true],
      ['cantidad','Cantidad o medidas','text',false,'Ejemplo: 2 kilos, 3 piezas'],
      ['establecimiento','Establecimiento o lugar','text',false],
      ['titular','¿A nombre de quién está?','text',false],
      ['pagado','¿Ya está pagado?',['No estoy seguro','Sí','No'],false],
      ['pendiente','Monto pendiente','text',false,'Ejemplo: $250'],
      ['comprobante','¿Cómo quieres recibir tu comprobante?',['Por WhatsApp — foto del comprobante','En físico, a mi domicilio'],false],
      ['destino','Dirección de entrega','textarea',false,'Ejemplo: Barrio Las Limas, frente a la agencia municipal'],
      ['horario','¿En cuánto tiempo lo necesitas?','text',false,'Ejemplo: Lo antes posible o en una hora'],
      ['pago','¿Cómo pagarás el servicio?',['Efectivo','Transferencia'],true],
      ['otro','Otros detalles','textarea',false]]},
    paqueteria:{titulo:'Solicitar paquetería',campos:[
      ['servicio','¿Qué necesitas?',['Enviar un paquete','Recibir un paquete','Cotizar un servicio','Consultar un envío en curso'],true],
      ['compania','¿Por qué paquetería prefieres enviarlo?',['Recomiéndenme una','Estafeta','FedEx','J&T Express México'],false],
      ['origen','¿De dónde sale el paquete?','text',true,'Ciudad o lugar de origen; por ejemplo: Comitán o Estados Unidos'],
      ['destino','¿A dónde debe llegar?','text',true,'Ciudad, colonia o punto de entrega'],
      ['detalle','¿Qué contiene o qué necesitas consultar?','textarea',true],
      ['cantidad','Cantidad de paquetes','number',false],
      ['medidas','Tamaño y peso aproximados','text',false,'Si los conoces'],
      ['guia','Número de guía o referencia','text',false,'Si ya tienes uno'],
      ['fecha','Fecha deseada','text',false],
      ['otro','Otros detalles','textarea',false]]},
    compra:{titulo:'Consultar compra',campos:[
      ['enlace','Enlace del producto','url',true,'Pega aquí el enlace del producto'],
      ['cantidad','Cantidad','number',true],
      ['detalle','Talla, color o detalles','textarea',false],
      ['pago','¿Cómo prefieres pagar?',['Transferencia','Efectivo'],true]]}
  };
  const avisoPagoPrevio='Para depósitos, recargas y pagos de servicios (luz, Telmex y otros recibos), primero pasamos a tu domicilio a recoger el dinero. Después realizamos el pago o depósito. No se adelanta dinero.';
  const requiereRecogerDinero=datos=>datos.servicio==='Pagar algo'||(datos.paradas||[]).some(p=>p.servicio==='Pagar algo');
  const limpiar=v=>String(v||'').trim();
  function etiqueta(tipo,servicio,key,base){
    if(tipo==='paqueteria'&&key==='detalle')return ({'Enviar un paquete':'¿Qué vas a enviar?','Recibir un paquete':'¿Qué paquete esperas recibir?','Cotizar un servicio':'¿Qué necesitas cotizar?','Consultar un envío en curso':'¿Qué necesitas saber de tu envío?'})[servicio]||base;
    if(tipo!=='mandaditos')return base;
    const textos={
      'Comprar algo':{detalle:'¿Qué necesitas comprar?',establecimiento:'¿En qué negocio?',cantidad:'Cantidad o presupuesto'},
      'Recoger algo':{detalle:'¿Qué necesitas recoger?',establecimiento:'¿Dónde lo recogemos?',cantidad:'Cantidad o presupuesto'},
      'Pagar algo':{detalle:'¿Qué servicio o pago necesitas realizar?',establecimiento:'¿Dónde se realiza el pago?',cantidad:'Monto a pagar'},
      'Otra cosa':{detalle:'¿En qué te ayudamos?',establecimiento:'¿Dónde necesitas el servicio?',cantidad:'Cantidad o presupuesto'}
    };
    return textos[servicio]?.[key]||base;
  }
  const pesos=v=>{const t=limpiar(v);return t&&!t.startsWith('$')?'$'+t:t;};
  function resumenEncargo(p){
    const servicio=p.servicio,detalle=limpiar(p.detalle);
    const inicio=servicio==='Comprar algo'?'Necesito comprar: ':servicio==='Recoger algo'?'Necesito recoger: ':servicio==='Pagar algo'?'Necesito pagar: ':'Necesito ayuda con: ';
    const lineas=[inicio+detalle];
    const agregar=(label,v)=>{if(limpiar(v))lineas.push(label+limpiar(v));};
    if(servicio==='Comprar algo'){agregar('\u{1f6d2} Cantidad o presupuesto: ',p.cantidad);agregar('\u{1f4cd} Dónde comprar: ',p.establecimiento);}
    if(servicio==='Recoger algo'){agregar('\u{1f4cd} Recoger en: ',p.establecimiento);agregar('\u{1f464} A nombre de: ',p.titular);agregar('\u{1f9fe} ¿Ya está pagado?: ',p.pagado);if(p.pagado==='No')agregar('\u{1f4b5} Monto pendiente: ',pesos(p.pendiente));}
    if(servicio==='Pagar algo'){agregar('\u{1f4b5} Monto a pagar: ',pesos(p.cantidad));agregar('\u{1f4cd} Lugar de pago: ',p.establecimiento);agregar('\u{1f4c4} Comprobante: ',p.comprobante);}
    if(servicio==='Otra cosa')agregar('\u{1f4cd} Dónde necesitamos ir: ',p.establecimiento);
    return lineas.join('\n');
  }
  function mensajeMandadito(datos){
    const paradas=Array.isArray(datos.paradas)?datos.paradas:[];
    const partes=[paradas.length?'Hola, necesito estos mandaditos:':'Hola, '+resumenEncargo(datos).replace(/^Necesito/,'necesito')];
    if(paradas.length)partes.push('Pedido principal\n'+resumenEncargo(datos),...paradas.map((p,i)=>'Parada '+(i+2)+'\n'+resumenEncargo(p)));
    const entrega=[];
    if(limpiar(datos.destino))entrega.push((requiereRecogerDinero(datos)?'🏠 Dirección para recoger el dinero: ':'\u{1f3e0} Entregar en: ')+limpiar(datos.destino));
    if(limpiar(datos.horario))entrega.push('\u{1f550} Lo necesito: '+limpiar(datos.horario));
    if(limpiar(datos.otro))entrega.push('\u{1f4dd} Indicaciones: '+limpiar(datos.otro));
    entrega.push(datos.pago==='Transferencia'?'\u{1f4b3} Pagaré por transferencia.':'\u{1f4b5} Pagaré el servicio en efectivo.');partes.push(entrega.join('\n'));
    if(requiereRecogerDinero(datos))partes.push('🟠 '+avisoPagoPrevio);
    partes.push(datos.pago==='Transferencia'?'¿Me confirmas disponibilidad, costo total y los datos para transferir?':'¿Me confirmas disponibilidad y el costo total?');
    return partes.join('\n\n');
  }
  function mensajeAyuda(nombre){return `Hola, quiero solicitar una compra en ${nombre}, pero no sé cómo compartir el enlace del producto. ¿Me pueden ayudar por WhatsApp?`;}
  function mensaje(tipo,nombre,datos){
    const e=esquemas[tipo];if(!e)throw Error('Servicio no reconocido.');
    if(tipo==='mandaditos')return mensajeMandadito(datos);
    const encabezado=tipo==='compra'?`Hola, quiero solicitar una compra en ${nombre}.`:tipo==='paqueteria'?'Hola, quiero solicitar un servicio de paquetería.':'Hola, quiero solicitar un mandadito.';
    const adicionales=tipo==='mandaditos'&&Array.isArray(datos.paradas)?datos.paradas:[];
    const comunes=['destino','horario','pago','otro'];
    const lineas=e.campos.filter(([k])=>!adicionales.length||!comunes.includes(k)).filter(([k])=>limpiar(datos[k])).map(([k,label])=>`${etiqueta(tipo,datos.servicio,k,label).replace(/^¿|\?$/g,'')}: ${limpiar(datos[k])}`);
    const textoParadas=adicionales.map((p,i)=>'Parada '+(i+2)+'\n'+[['servicio','Servicio'],['detalle',etiqueta('mandaditos',p.servicio,'detalle','Detalle')],['cantidad',etiqueta('mandaditos',p.servicio,'cantidad','Cantidad')],['establecimiento',etiqueta('mandaditos',p.servicio,'establecimiento','Lugar')]].filter(([k])=>limpiar(p[k])).map(([k,label])=>label.replace(/^¿|\?$/g,'')+': '+limpiar(p[k])).join('\n')).join('\n\n');
    const entregaComun=adicionales.length?e.campos.filter(([k])=>comunes.includes(k)&&limpiar(datos[k])).map(([k,label])=>label+': '+limpiar(datos[k])).join('\n'):'';
    return encabezado+'\n\n'+(adicionales.length?'Pedido principal\n':'')+lineas.join('\n')+(textoParadas?'\n\n'+textoParadas:'')+(entregaComun?'\n\nEntrega y pago de la solicitud\n'+entregaComun:'')+'\n\n'+(tipo==='compra'?'¿Me confirman disponibilidad, costo total y entrega?':tipo==='paqueteria'?'¿Me confirman si pueden realizar este servicio, el costo y el tiempo estimado?':'¿Me confirman disponibilidad y costo de la compra y del servicio?')+(tipo==='mandaditos'&&datos.pago==='Transferencia'?'\nPagaré por transferencia, sin comisión extra por esta forma de pago. Compártanme los datos de pago y confírmenme el total.':'');
  }
  function abrir(tipo,numero,nombre,origen){
    const e=esquemas[tipo];const destino=window.ContactosExhibicion?.numero(numero);
    if(!e||!destino){alert('Este servicio aún no tiene un WhatsApp configurado.');return;}
    document.querySelector('.servicios-pedido')?.close();
    const d=document.createElement('dialog');d.className='servicios-pedido';d.setAttribute('aria-label',e.titulo+(tipo==='compra'?' en '+nombre:''));
    const cerrar=document.createElement('button');cerrar.type='button';cerrar.className='servicios-cerrar';cerrar.textContent='Cerrar ×';cerrar.onclick=()=>d.close();
    const titulo=document.createElement('h2');titulo.textContent=e.titulo+(tipo==='compra'?' en '+nombre:'');
    const ayuda=document.createElement('p');ayuda.textContent='Completa tu solicitud. Al continuar se abrirá WhatsApp; el servicio se confirma por ese medio.';
    if(tipo==='mandaditos')ayuda.textContent='Cuéntanos qué necesitas para atenderte más rápido y llevar tu pedido al lugar correcto.';
    let condicionesCompra;
    if(tipo==='compra'){
      ayuda.textContent='Con gusto te cotizamos. Comparte el enlace y te confirmamos el total por WhatsApp.';
      const pagoCompleto=document.createElement('strong');pagoCompleto.className='servicios-pago-completo';pagoCompleto.textContent='Para realizar la compra se requiere el pago completo del total acordado. No se realizan pedidos para pagar al recibir.';ayuda.append(pagoCompleto);
      const beneficio=document.createElement('span');beneficio.className='servicios-beneficio';beneficio.textContent='✓ Entrega a domicilio incluida dentro de la ciudad de Comalapa.';ayuda.append(beneficio);
      const condiciones=document.createElement('details');condiciones.className='servicios-condiciones-compra';
      const resumen=document.createElement('summary');resumen.textContent='¿Qué incluye la cotización?';
      const costos=document.createElement('ul');
      for(const detalle of ['Tu producto.','El envío que cobre la tienda, cuando no sea gratis.','El traslado de Comitán a Comalapa, que se cobra aparte aunque la tienda dé envío gratis.']){const item=document.createElement('li');item.textContent=detalle;costos.append(item);}
      const devoluciones=document.createElement('p');devoluciones.textContent='Si compramos desde nuestra cuenta, una devolución aceptada por la tienda incluye gestión y traslado sin costo extra. Si compras desde tu cuenta, cotizamos la devolución aparte. Los cambios que requieran otro traslado tienen costo adicional.';
      condiciones.append(resumen,costos,devoluciones);
      condicionesCompra=condiciones;
    }
    const form=document.createElement('form');const etiquetas={};let elegirLugar,tituloLugar;let paradas=[];let contadorParadas=0;let actualizarEntrega=()=>{};
    if(condicionesCompra)form.append(condicionesCompra);
    function adaptarEncargo(campos,labels,preferencia){
      const servicio=campos.servicio.value,comprar=servicio==='Comprar algo',recoger=servicio==='Recoger algo',pagar=servicio==='Pagar algo';
      const visibles={cantidad:comprar||pagar,titular:recoger,pagado:recoger,pendiente:recoger&&campos.pagado.value==='No',comprobante:pagar};
      if(preferencia){preferencia.parentElement.hidden=!comprar&&!pagar;preferencia.disabled=!comprar&&!pagar;
        const opciones=comprar?['Indicar un lugar','Donde esté disponible']:['Indicar un lugar','Necesito que me orienten'];
        Array.from(preferencia.children).forEach((o,i)=>{o.textContent=opciones[i];o.value=opciones[i];});
        preferencia.parentElement.children[0].textContent=comprar?'¿Dónde comprar?':'¿Dónde realizar el pago?';
      }
      for(const [key,input] of Object.entries(campos)){
        const visible=key in visibles?visibles[key]:true;
        const lugarLibre=key==='establecimiento'&&preferencia&&!preferencia.disabled&&preferencia.value!=='Indicar un lugar';
        input.disabled=!visible||!!lugarLibre;input.parentElement.hidden=input.disabled;
        input.required=key==='servicio'||key==='detalle'||(key==='establecimiento'&&recoger);
        if(input.disabled)input.setCustomValidity('');
        if(labels[key])labels[key].textContent=etiqueta('mandaditos',servicio,key,({servicio:'¿Qué necesitas?',titular:'¿A nombre de quién está?',pagado:'¿Ya está pagado?',pendiente:'Monto pendiente',recibo:'¿Necesitamos recoger tu recibo?',origenRecibo:'¿Dónde recogemos tu recibo?',comprobante:'¿Cómo quieres recibir tu comprobante?'})[key]||key)+(input.required?' *':' (opcional)');
      }
      campos.establecimiento.placeholder=recoger?'Negocio o dirección de recogida':comprar?'Nombre del negocio':'Lugar o dirección';
      campos.cantidad.placeholder=pagar?'$ Monto del recibo':'Ejemplo: 2 kilos o $200 de carne';
    }
    function bloqueParadas(){
      const zona=document.createElement('section');zona.className='servicios-paradas';
      const titulo=document.createElement('h3');titulo.textContent='¿Necesitas algo más?';
      const ayuda=document.createElement('p');ayuda.className='servicios-ayuda';ayuda.textContent='Agrega otra compra o recogida, por ejemplo tacos y después pan. Todo se envía en una sola solicitud.';
      const lista=document.createElement('div');const agregar=document.createElement('button');agregar.type='button';agregar.className='servicios-agregar-parada';agregar.textContent='+ Agregar otra parada';
      const nota=document.createElement('small');nota.className='servicios-ayuda';nota.textContent='El costo de las paradas adicionales se confirma por WhatsApp.';
      ayuda.hidden=true;nota.hidden=true;
      const refrescar=()=>{actualizarEntrega();ayuda.hidden=paradas.length===0;nota.hidden=paradas.length===0;paradas.forEach((p,i)=>p.titulo.textContent='Parada '+(i+2));agregar.disabled=paradas.length>=4;nota.textContent=paradas.length>=4?'Puedes incluir hasta 5 paradas en esta solicitud. El costo se confirma por WhatsApp.':'El costo de las paradas adicionales se confirma por WhatsApp.';};
      agregar.onclick=()=>{
        if(paradas.length>=4)return;const id=++contadorParadas;const tarjeta=document.createElement('fieldset');tarjeta.className='servicios-parada';const leyenda=document.createElement('legend');tarjeta.append(leyenda);const campos={},labels={};
        for(const [key,text,t,required,placeholder] of esquemas.mandaditos.campos.filter(([k])=>['servicio','detalle','cantidad','establecimiento','titular','pagado','pendiente','comprobante'].includes(k))){
          const label=document.createElement('label'),span=document.createElement('span');labels[key]=span;const input=document.createElement(Array.isArray(t)?'select':t==='textarea'?'textarea':'input');input.name='parada-'+id+'-'+key;input.required=required;
          if(Array.isArray(t)){for(const texto of t){const opt=document.createElement('option');opt.value=texto;opt.textContent=texto;input.append(opt);}}else if(t==='textarea'){input.rows=2;input.maxLength=500;}else{input.type='text';input.maxLength=300;}
          if(placeholder)input.placeholder=placeholder;campos[key]=input;label.append(span,input);tarjeta.append(label);
        }
        const preferencia=document.createElement('select');preferencia.name='parada-'+id+'-preferenciaLugar';const lugarLabel=document.createElement('label');const lugarTitulo=document.createElement('span');
        for(const valor of ['Indicar un lugar','Donde esté disponible']){const o=document.createElement('option');o.value=valor;o.textContent=valor;preferencia.append(o);}lugarLabel.append(lugarTitulo,preferencia);tarjeta.append(lugarLabel);
        const actualizar=()=>{adaptarEncargo(campos,labels,preferencia);actualizarEntrega();};for(const key of ['servicio','pagado','comprobante'])campos[key].addEventListener('change',actualizar);preferencia.addEventListener('change',actualizar);actualizar();
        const quitar=document.createElement('button');quitar.type='button';quitar.className='servicios-quitar-parada';quitar.textContent='Quitar parada';
        const parada={tarjeta,titulo:leyenda,campos,preferencia};quitar.onclick=()=>{paradas=paradas.filter(p=>p!==parada);tarjeta.remove();refrescar();};tarjeta.append(quitar);paradas.push(parada);lista.append(tarjeta);refrescar();campos.detalle.focus();
      };
      zona.append(titulo,agregar,lista,ayuda,nota);return zona;
    }
    for(const [key,text,t,required,placeholder] of e.campos){
      const label=document.createElement('label');const span=document.createElement('span');span.textContent=text+(required?' *':' (opcional)');
      const campo=document.createElement(Array.isArray(t)?'select':t==='textarea'?'textarea':'input');campo.name=key;campo.required=required;
      if(Array.isArray(t)){for(const name of t){const opt=document.createElement('option');opt.value=name;opt.textContent=name;campo.append(opt);}}
      else if(t==='textarea'){campo.rows=2;campo.maxLength=500;}
      else{campo.type=t;campo.maxLength=300;if(t==='number'){campo.min=1;campo.max=99;campo.step=1;campo.value='1';}}
      if(placeholder)campo.placeholder=placeholder;
      etiquetas[key]=span;
      label.append(span,campo);
      if(tipo==='mandaditos'&&key==='establecimiento'){
        const opcionLabel=document.createElement('label');const opcionTitulo=document.createElement('span');opcionTitulo.textContent='¿Dónde comprar?';tituloLugar=opcionTitulo;
        elegirLugar=document.createElement('select');elegirLugar.name='preferenciaLugar';
        for(const texto of ['Indicar un lugar','Donde esté disponible']){const opt=document.createElement('option');opt.value=texto;opt.textContent=texto;elegirLugar.append(opt);}
        opcionLabel.append(opcionTitulo,elegirLugar);form.append(opcionLabel);

      }
      form.append(label);
      if(tipo==='mandaditos'&&key==='destino'){const nota=document.createElement('small');nota.className='servicios-ayuda';nota.textContent='Si prefieres, comparte tu dirección o ubicación después por WhatsApp.';label.append(nota);}
      if(tipo==='compra'&&key==='enlace'){
        const ayudaEnlace=document.createElement('button');ayudaEnlace.type='button';ayudaEnlace.className='servicios-ayuda-enlace';ayudaEnlace.textContent='No sé cómo hacerlo';
        ayudaEnlace.onclick=()=>{window.open('https://wa.me/'+destino+'?text='+encodeURIComponent(mensajeAyuda(nombre)),'_blank','noopener,noreferrer');d.close();};
        form.append(ayudaEnlace);
      }
    }
    if(tipo==='mandaditos'){
      const actualizarPreguntas=()=>{
        const temas={'Comprar algo':'comprar','Recoger algo':'recoger','Pagar algo':'pagar','Otra cosa':'otro'};
        d.setAttribute('data-mandadito',temas[form.elements.servicio.value]||'otro');

        const keys=['servicio','detalle','cantidad','establecimiento','titular','pagado','pendiente','comprobante'];
        adaptarEncargo(Object.fromEntries(keys.map(k=>[k,form.elements[k]])),etiquetas,elegirLugar);
        const soloPago=form.elements.servicio.value==='Pagar algo'&&paradas.length===0;
        const recogerDinero=form.elements.servicio.value==='Pagar algo'||paradas.some(p=>p.campos.servicio.value==='Pagar algo');
        const destinoCampo=form.elements.destino;destinoCampo.disabled=false;destinoCampo.parentElement.hidden=false;destinoCampo.required=recogerDinero;
        etiquetas.destino.textContent=(recogerDinero?'¿En qué domicilio recogemos el dinero?':soloPago?'¿Dónde entregamos tu comprobante?':'¿Dónde lo entregamos?')+(recogerDinero?' *':' (opcional)');
      };
      for(const key of ['servicio','pagado','comprobante'])form.elements[key].addEventListener('change',actualizarPreguntas);
      elegirLugar.addEventListener('change',actualizarPreguntas);actualizarPreguntas();
      actualizarEntrega=actualizarPreguntas;
    }
    if(tipo==='mandaditos'){const aviso=document.createElement('p');aviso.className='servicios-aviso-transferencia';const actualizar=()=>{aviso.hidden=false;aviso.textContent=form.elements.pago.value==='Transferencia'?'✓ Agiliza tu pedido pagando por transferencia. Sin comisión extra.':'✨ Aprovecha y paga por transferencia sin comisión.';};form.elements.pago.addEventListener('change',actualizar);actualizar();form.elements.pago.parentElement.append(aviso);}
    if(tipo==='compra'){
      const aviso=document.createElement('p');aviso.className='servicios-beneficio';
      const actualizarPago=()=>{aviso.textContent=form.elements.pago.value==='Transferencia'?'✓ Después de cotizar y confirmar el total, te compartimos los datos para transferir. En cuanto confirmemos tu pago completo, podremos realizar la compra.':'Después de cotizar y aceptar el total, acordamos contigo el horario y la forma de recibir el efectivo. Realizamos la compra cuando recibamos el pago completo.';};
      form.elements.pago.addEventListener('change',actualizarPago);actualizarPago();form.elements.pago.parentElement.append(aviso);
    }
    if(tipo==='paqueteria'){
      const campos=form.elements;
      const nota=document.createElement('small');nota.className='servicios-ayuda';nota.textContent='Describe el contenido, especialmente si son alimentos, líquidos o artículos delicados. El encargado confirmará si la compañía los admite y cómo deben empacarse.';campos.detalle.parentElement.append(nota);
      const actualizarPaquete=()=>{
        const servicio=campos.servicio.value,consulta=servicio==='Consultar un envío en curso';
        for(const [key,base,,required] of e.campos){
          const campo=campos[key];
          const ocultar=(key==='compania'&&servicio!=='Enviar un paquete')||(key==='guia'&&servicio!=='Recibir un paquete'&&!consulta)||(consulta&&['origen','destino','cantidad','medidas','fecha'].includes(key));
          campo.disabled=ocultar;campo.parentElement.hidden=ocultar;campo.required=required&&!ocultar;campo.setCustomValidity('');
          etiquetas[key].textContent=etiqueta(tipo,servicio,key,base)+(campo.required?' *':' (opcional)');
        }
        nota.hidden=consulta;
      };
      campos.servicio.addEventListener('change',actualizarPaquete);actualizarPaquete();
    }
    const error=document.createElement('p');error.setAttribute('role','alert');
    const enviar=document.createElement('button');enviar.type='submit';enviar.className='servicios-enviar';enviar.textContent=tipo==='compra'?'Consultar compra por WhatsApp':tipo==='paqueteria'?'Solicitar cotización por WhatsApp':'Solicitar mandadito por WhatsApp';
    if(tipo==='mandaditos'){const aviso=document.createElement('p');aviso.className='servicios-aviso-pago-previo';aviso.setAttribute('role','note');aviso.style.cssText='padding:14px 16px;border:1px solid #e8b956;border-left:5px solid #c87509;border-radius:12px;background:#fff4d8;color:#633c08;line-height:1.5';const titulo=document.createElement('strong');titulo.textContent='🟠 Pagos, depósitos y recargas';aviso.append(titulo,document.createElement('br'),document.createTextNode(avisoPagoPrevio));form.append(aviso);}form.append(error,enviar);if(tipo==='mandaditos')form.append(bloqueParadas());form.addEventListener('submit',ev=>{
      ev.preventDefault();const datos={};for(const [k] of e.campos)datos[k]=form.elements[k].disabled?'':limpiar(form.elements[k].value);if(tipo==='mandaditos'&&!elegirLugar.disabled&&elegirLugar.value!=='Indicar un lugar')datos.establecimiento=elegirLugar.value;
      for(const [key,,t,required] of e.campos){const campo=form.elements[key];campo.setCustomValidity('');if(campo.required&&!campo.disabled&&!datos[key])campo.setCustomValidity('Completa este campo.');if(t==='url'&&datos[key]){try{const url=new URL(datos[key]);if(!['http:','https:'].includes(url.protocol))throw Error();}catch{campo.setCustomValidity('Pega un enlace válido que empiece con https:// o http://.');}}}
      if(tipo==='mandaditos'){datos.paradas=paradas.map(p=>Object.fromEntries(Object.entries(p.campos).map(([k,input])=>{input.setCustomValidity('');const valor=input.disabled?'':limpiar(input.value);if(input.required&&!input.disabled&&!valor)input.setCustomValidity('Escribe qué necesitas en esta parada.');return [k,valor];})));datos.paradas.forEach((dato,i)=>{const pref=paradas[i].preferencia;if(!pref.disabled&&pref.value!=='Indicar un lugar')dato.establecimiento=pref.value;});}
      if(!form.reportValidity())return;
      const texto=mensaje(tipo,nombre,datos);if(texto.length>6000){error.textContent='La solicitud es demasiado larga. Reduce los detalles.';return;}
      window.open('https://api.whatsapp.com/send?phone='+destino+'&text='+encodeURIComponent(texto),'_blank','noopener,noreferrer');
      d.close();
    });
    form.addEventListener('input',ev=>ev.target.setCustomValidity?.(''));
    d.append(cerrar,titulo,ayuda,form);const overflow=document.body.style.overflow;
    d.addEventListener('close',()=>{document.body.style.overflow=overflow;d.remove();if(origen?.isConnected)origen.focus({preventScroll:true});},{once:true});
    d.addEventListener('click',ev=>{const r=d.getBoundingClientRect();if(ev.target===d&&(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom))d.close();});
    document.body.append(d);d.showModal();document.body.style.overflow='hidden';
  }
  window.ServiciosPedidos={abrir,mensaje,mensajeAyuda};
})();
