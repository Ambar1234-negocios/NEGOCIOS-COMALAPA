/* Configuración compartida de compras por encargo y Mandaditos. */
(() => {
  'use strict';
  const plataformas = {shein:'SHEIN',tiktok:'TikTok Shop',temu:'Temu',mercadolibre:'Mercado Libre'};
  const colores={shein:'#111111',tiktok:'#111111',temu:'#c84900',mercadolibre:'#ffe600'};
  function colorTexto(hex) {
    const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'#111111':'#ffffff';
  }
  const clave = 'exhibicionContactosV1';
  const inicial = () => ({version:1,...Object.fromEntries(Object.keys(plataformas).map(k=>[k,{numero:'',activo:false,nombre:plataformas[k],color:colores[k]}])),mandaditos:{numero:'529633106862'}});
  function numero(valor) {
    const limpio=String(valor??'').replace(/[\s()+.-]/g,'');
    if(!/^\d+$/.test(limpio))return '';
    if(limpio.length===10)return '52'+limpio;
    return /^52\d{10}$/.test(limpio)?limpio:'';
  }
  function normalizar(datos) {
    const salida=inicial();
    if(!datos || typeof datos!=='object' || Array.isArray(datos))return salida;
    for(const k of Object.keys(plataformas)) {
      const contacto = datos[k] || (k === 'temu' ? datos.amazon : null);
      const n=numero(contacto?.numero);
      salida[k]={numero:n,activo:contacto?.activo===true && !!n,
        nombre:typeof contacto?.nombre==='string'&&contacto.nombre.trim()?contacto.nombre.trim().slice(0,40):plataformas[k],
        color:/^#[0-9a-f]{6}$/i.test(contacto?.color)?contacto.color:colores[k]};
    }
    salida.mandaditos.numero=numero(datos.mandaditos?.numero)||salida.mandaditos.numero;
    return salida;
  }
  const api=window.ContactosExhibicion={actual:inicial(),numero,normalizar};
  api.lista=(async()=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),5000);
    try {
      const r=await fetch('contactos.json',{cache:'no-store',signal:controller.signal});
      if(!r.ok)throw Error('No publicado');
      api.actual=normalizar(await r.json());
    }catch{ /* Conservar Mandaditos si aún no se ha publicado la configuración. */ }
    finally{clearTimeout(timeout);}
    return api.actual;
  })();
  async function iniciar() {
    await api.lista;
    const zona=document.getElementById('compras-encargo');
    if(zona) {
      zona.replaceChildren();
      zona.setAttribute('aria-label', 'Mandaditos y compras por encargo');
      const servicio=document.createElement('div');servicio.className='mandaditos-acceso';
      const informacion=document.createElement('div');
      const encabezado=document.createElement('h2');encabezado.className='mandaditos-titulo';encabezado.textContent='Mandaditos en Comalapa';
      const descripcion=document.createElement('p');descripcion.className='mandaditos-descripcion';descripcion.textContent='Compras locales, recogidas y entregas a domicilio.';
      const pedir=document.createElement('a');pedir.className='mandaditos-boton';pedir.textContent='Pedir un mandadito';
      const mensajeMandadito='Hola, necesito un servicio de mandaditos.\n\nNecesito comprar o recoger:\nLugar de compra o recogida:\nDirección de entrega:\nReferencia para llegar:\nHorario deseado:\n\n¿Me confirmas disponibilidad y costo del servicio?';
      pedir.href='https://wa.me/'+api.actual.mandaditos.numero+'?text='+encodeURIComponent(mensajeMandadito);
      pedir.target='_blank';pedir.rel='noopener noreferrer';
      informacion.append(encabezado,descripcion);servicio.append(informacion,pedir);zona.append(servicio);zona.hidden=false;
      const activos=Object.entries(plataformas).filter(([k])=>api.actual[k].activo);
      if(activos.length) {
        const titulo=document.createElement('h2');titulo.textContent='Compras en línea por encargo';
        const ayuda=document.createElement('p');ayuda.textContent='Comparte el producto por WhatsApp para consultar el costo y la entrega.';
        const grid=document.createElement('div');grid.className='compras-grid';
        for(const [k] of activos) {
          const nombre=api.actual[k].nombre;
          const a=document.createElement('a');a.className='compra-boton compra-'+k;
          a.style.background=api.actual[k].color;a.style.color=colorTexto(api.actual[k].color);
          if(k==='tiktok'&&(nombre!==plataformas[k]||api.actual[k].color!==colores[k]))a.style.boxShadow='none';
          const mensaje=`Hola, me gustaría solicitar una compra de ${nombre}. Te comparto el enlace o una captura del producto para que me confirmes el costo y la entrega.\n\nProducto o enlace:\nCantidad:\nTalla o color (si aplica):`;
          a.href=`https://wa.me/${api.actual[k].numero}?text=${encodeURIComponent(mensaje)}`;
          a.target='_blank';a.rel='noopener noreferrer';
          const marca=document.createElement('strong');marca.textContent=nombre;
          const accion=document.createElement('small');accion.textContent='Solicitar por WhatsApp';
          a.append(marca,accion);grid.append(a);
        }
        zona.append(titulo,ayuda,grid);
      }
    }
    const form=document.getElementById('form-contactos');if(!form)return;
    const estado=document.getElementById('estado-contactos');
    let borrador=api.actual;
    try {const guardado=localStorage.getItem(clave);if(guardado)borrador=normalizar(JSON.parse(guardado));}catch{estado.textContent='No se pudo recuperar el borrador local. Se muestran los datos publicados.';}
    const campos=document.getElementById('campos-contactos');
    for(const [k,nombre] of Object.entries({...plataformas,mandaditos:'Mandaditos'})) {
      const grupo=document.createElement('fieldset');grupo.className='contacto-campo';
      const leyenda=document.createElement('legend');leyenda.textContent=nombre;
      const etiqueta=document.createElement('label');etiqueta.htmlFor='numero-'+k;etiqueta.textContent='Número de WhatsApp';
      const input=document.createElement('input');input.id='numero-'+k;input.type='tel';input.inputMode='numeric';input.maxLength=10;input.minLength=10;input.pattern='[0-9]{10}';input.value=borrador[k].numero.replace(/^52(?=\d{10}$)/,'');input.placeholder='Ejemplo: 9631234567';input.required=k==='mandaditos';
      input.addEventListener('input',()=>{
        input.value=input.value.replace(/\D/g,'').slice(0,10);
        input.setCustomValidity('');
      });
      input.addEventListener('paste',e=>{
        e.preventDefault();
        const texto=e.clipboardData.getData('text').replace(/[\s().-]/g,'');
        const nuevo=input.value.slice(0,input.selectionStart)+texto+input.value.slice(input.selectionEnd);
        if(!/^\d{0,10}$/.test(nuevo)){
          input.setCustomValidity('Pega solo 10 dígitos, sin +52. No se ha cambiado el número.');
          input.reportValidity();return;
        }
        input.value=nuevo;input.setCustomValidity('');
      });
      grupo.append(leyenda,etiqueta,input);
      if(k!=='mandaditos') {
        const etiquetaNombre=document.createElement('label');etiquetaNombre.htmlFor='nombre-'+k;etiquetaNombre.textContent='Nombre del botón';
        const campoNombre=document.createElement('input');campoNombre.id='nombre-'+k;campoNombre.type='text';campoNombre.maxLength=40;campoNombre.required=true;campoNombre.value=borrador[k].nombre;
        const etiquetaColor=document.createElement('label');etiquetaColor.htmlFor='color-'+k;etiquetaColor.textContent='Color de fondo';
        const campoColor=document.createElement('input');campoColor.id='color-'+k;campoColor.type='color';campoColor.value=borrador[k].color;campoColor.style.cssText='width:80px;height:44px;padding:4px;cursor:pointer';
        const vista=document.createElement('div');vista.style.cssText='padding:16px;border-radius:12px;text-align:center;font-weight:bold;margin:12px 0;overflow-wrap:anywhere';vista.setAttribute('aria-label','Vista previa del botón');
        const refrescar=()=>{vista.textContent=campoNombre.value||plataformas[k];vista.style.background=campoColor.value;vista.style.color=colorTexto(campoColor.value);};
        campoNombre.addEventListener('input',()=>{campoNombre.setCustomValidity('');refrescar();});campoColor.addEventListener('input',refrescar);refrescar();
        grupo.append(etiquetaNombre,campoNombre,etiquetaColor,campoColor,vista);
        const activo=document.createElement('input');activo.type='checkbox';activo.id='activo-'+k;activo.checked=borrador[k].activo;
        const label=document.createElement('label');label.className='contacto-activo';label.append(activo,document.createTextNode('Mostrar botón de '+nombre));grupo.append(label);
      }
      campos.append(grupo);
    }
    function recoger() {
      const datos=inicial();
      for(const k of [...Object.keys(plataformas),'mandaditos']) {
        const input=document.getElementById('numero-'+k);
        const activo=k==='mandaditos'||document.getElementById('activo-'+k).checked;
        const n=/^\d{10}$/.test(input.value)?'52'+input.value:'';
        input.setCustomValidity((activo||input.value.trim())&&!n?'Escribe exactamente 10 dígitos, sin +52.':'');
        if(!input.reportValidity())return null;
        if(k!=='mandaditos') {
          const campoNombre=document.getElementById('nombre-'+k);
          campoNombre.setCustomValidity(campoNombre.value.trim()?'':'Escribe el nombre del botón.');
          if(!campoNombre.reportValidity())return null;
        }
        datos[k]=k==='mandaditos'?{numero:n}:{numero:n,activo,nombre:document.getElementById('nombre-'+k).value.trim(),color:document.getElementById('color-'+k).value};
      }
      return datos;
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();const datos=recoger();if(!datos)return;
      try {localStorage.setItem(clave,JSON.stringify(datos));estado.textContent='Números guardados en este navegador. Genera contactos.json y publícalo para actualizar la página.';}
      catch{estado.textContent='No se pudo guardar en este navegador. Puedes generar contactos.json con los datos del formulario.';}
    });
    document.getElementById('exportar-contactos').addEventListener('click',()=>{
      const datos=recoger();if(!datos)return;
      const blob=new Blob([JSON.stringify(datos,null,2)],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='contactos.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      estado.textContent='Archivo generado. Reemplaza contactos.json en tu proyecto y publícalo. Incluye los números que ves en este formulario.';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
