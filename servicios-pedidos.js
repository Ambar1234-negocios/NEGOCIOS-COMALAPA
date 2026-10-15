/* Formularios de servicios: el destinatario queda fijado al abrir cada solicitud. */
(() => {
  'use strict';
  const esquemas={
    mandaditos:{titulo:'Solicitar mandadito',campos:[
      ['servicio','¿Qué necesitas?',['Comprar algo','Recoger algo','Pagar algo','Otra cosa'],true],
      ['detalle','¿Qué necesitas comprar o recoger?','textarea',true],
      ['cantidad','Cantidad o medidas','text',false,'Ejemplo: 2 kilos, 3 piezas'],
      ['establecimiento','Establecimiento o lugar','text',false],
      ['destino','Dirección de entrega','textarea',false],
      ['referencia','Referencia para llegar','text',false],
      ['horario','Horario deseado','text',false],
      ['pago','Forma de pago',['Efectivo','Transferencia','Por confirmar'],true],
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
      ['detalle','Talla, color o detalles','textarea',false]]}
  };
  const limpiar=v=>String(v||'').trim();
  function etiqueta(tipo,servicio,key,base){
    if(tipo==='paqueteria'&&key==='detalle')return ({'Enviar un paquete':'¿Qué vas a enviar?','Recibir un paquete':'¿Qué paquete esperas recibir?','Cotizar un servicio':'¿Qué necesitas cotizar?','Consultar un envío en curso':'¿Qué necesitas saber de tu envío?'})[servicio]||base;
    if(tipo!=='mandaditos')return base;
    const textos={
      'Comprar algo':{detalle:'¿Qué necesitas comprar?',establecimiento:'¿En qué negocio?',cantidad:'Cantidad o medidas'},
      'Recoger algo':{detalle:'¿Qué necesitas recoger?',establecimiento:'¿Dónde lo recogemos?',cantidad:'Cantidad o medidas'},
      'Pagar algo':{detalle:'¿Qué servicio o pago necesitas realizar?',establecimiento:'¿Dónde se realiza el pago?',cantidad:'Monto a pagar'},
      'Otra cosa':{detalle:'¿En qué te ayudamos?',establecimiento:'¿Dónde necesitas el servicio?',cantidad:'Cantidad o medidas'}
    };
    return textos[servicio]?.[key]||base;
  }
  function mensajeAyuda(nombre){return `Hola, quiero solicitar una compra en ${nombre}, pero no sé cómo compartir el enlace del producto. ¿Me pueden ayudar por WhatsApp?`;}
  function mensaje(tipo,nombre,datos){
    const e=esquemas[tipo];if(!e)throw Error('Servicio no reconocido.');
    const encabezado=tipo==='compra'?`Hola, quiero solicitar una compra en ${nombre}.`:tipo==='paqueteria'?'Hola, quiero solicitar un servicio de paquetería.':'Hola, quiero solicitar un mandadito.';
    const lineas=e.campos.filter(([k])=>limpiar(datos[k])).map(([k,label])=>`${etiqueta(tipo,datos.servicio,k,label).replace(/^¿|\?$/g,'')}: ${limpiar(datos[k])}`);
    return encabezado+'\n\n'+lineas.join('\n')+'\n\n'+(tipo==='compra'?'¿Me confirman disponibilidad, costo total y entrega?':tipo==='paqueteria'?'¿Me confirman si pueden realizar este servicio, el costo y el tiempo estimado?':'¿Me confirman disponibilidad y costo de la compra y del servicio?')+(tipo==='mandaditos'&&datos.pago==='Transferencia'?'\nPagaré por transferencia; el formulario indica un cargo extra de $10. Compártanme los datos de pago y confírmenme el total.':'');
  }
  function abrir(tipo,numero,nombre,origen){
    const e=esquemas[tipo];const destino=window.ContactosExhibicion?.numero(numero);
    if(!e||!destino){alert('Este servicio aún no tiene un WhatsApp configurado.');return;}
    document.querySelector('.servicios-pedido')?.close();
    const d=document.createElement('dialog');d.className='servicios-pedido';d.setAttribute('aria-label',e.titulo+(tipo==='compra'?' en '+nombre:''));
    const cerrar=document.createElement('button');cerrar.type='button';cerrar.className='servicios-cerrar';cerrar.textContent='Cerrar ×';cerrar.onclick=()=>d.close();
    const titulo=document.createElement('h2');titulo.textContent=e.titulo+(tipo==='compra'?' en '+nombre:'');
    const ayuda=document.createElement('p');ayuda.textContent='Completa tu solicitud. Al continuar se abrirá WhatsApp; el servicio se confirma por ese medio.';
    const form=document.createElement('form');const etiquetas={};let elegirLugar,tituloLugar;
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
        for(const texto of ['Indicar un lugar','No importa']){const opt=document.createElement('option');opt.value=texto;opt.textContent=texto;elegirLugar.append(opt);}
        opcionLabel.append(opcionTitulo,elegirLugar);form.append(opcionLabel);
        elegirLugar.addEventListener('change',()=>{label.hidden=elegirLugar.value==='No importa';campo.disabled=label.hidden;campo.setCustomValidity('');});
        const pista=document.createElement('small');pista.className='servicios-ayuda';pista.textContent='Puedes indicar el negocio o elegir «No importa».';opcionLabel.append(pista);
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
        for(const [key,base,,required] of e.campos)etiquetas[key].textContent=etiqueta(tipo,form.elements.servicio.value,key,base)+(required?' *':' (opcional)');
        tituloLugar.textContent=({'Comprar algo':'¿Dónde comprar?','Recoger algo':'¿Dónde recoger?','Pagar algo':'¿Dónde pagar?','Otra cosa':'¿Dónde necesitas ayuda? (opcional)'})[form.elements.servicio.value];
        form.elements.cantidad.placeholder=form.elements.servicio.value==='Pagar algo'?'Ejemplo: $250':'Ejemplo: 2 kilos, 3 piezas';
      };
      form.elements.servicio.addEventListener('change',actualizarPreguntas);actualizarPreguntas();
    }
    if(tipo==='mandaditos'){const aviso=document.createElement('p');aviso.className='servicios-aviso-transferencia';aviso.textContent='Al pagar por transferencia se cobran $10 extra.';const actualizar=()=>aviso.hidden=form.elements.pago.value!=='Transferencia';form.elements.pago.addEventListener('change',actualizar);actualizar();form.elements.pago.parentElement.append(aviso);}
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
    form.append(error,enviar);form.addEventListener('submit',ev=>{
      ev.preventDefault();const datos={};for(const [k] of e.campos)datos[k]=form.elements[k].disabled?'':limpiar(form.elements[k].value);if(tipo==='mandaditos'&&elegirLugar.value==='No importa')datos.establecimiento='No importa';
      for(const [key,,t,required] of e.campos){const campo=form.elements[key];campo.setCustomValidity('');if(campo.required&&!campo.disabled&&!datos[key])campo.setCustomValidity('Completa este campo.');if(t==='url'&&datos[key]){try{const url=new URL(datos[key]);if(!['http:','https:'].includes(url.protocol))throw Error();}catch{campo.setCustomValidity('Pega un enlace válido que empiece con https:// o http://.');}}}
      if(!form.reportValidity())return;
      const texto=mensaje(tipo,nombre,datos);if(texto.length>6000){error.textContent='La solicitud es demasiado larga. Reduce los detalles.';return;}
      window.open('https://wa.me/'+destino+'?text='+encodeURIComponent(texto),'_blank','noopener,noreferrer');
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
