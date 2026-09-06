/* Configuración compartida de compras por encargo y Mandaditos. */
(() => {
  'use strict';
  const plataformas = {shein:'SHEIN',tiktok:'TikTok Shop',mercadolibre:'Mercado Libre',amazon:'Amazon'};
  const clave = 'exhibicionContactosV1';
  const inicial = () => ({version:1,...Object.fromEntries(Object.keys(plataformas).map(k=>[k,{numero:'',activo:false}])),mandaditos:{numero:'529633106862'}});
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
      const n=numero(datos[k]?.numero);
      salida[k]={numero:n,activo:datos[k]?.activo===true && !!n};
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
      const activos=Object.entries(plataformas).filter(([k])=>api.actual[k].activo);
      if(activos.length) {
        const titulo=document.createElement('h2');titulo.textContent='Compras por encargo';
        const ayuda=document.createElement('p');ayuda.textContent='Comparte el producto por WhatsApp para consultar el costo y la entrega.';
        const grid=document.createElement('div');grid.className='compras-grid';
        for(const [k,nombre] of activos) {
          const a=document.createElement('a');a.className='compra-boton compra-'+k;
          const mensaje=`Hola, me gustaría solicitar una compra de ${nombre}. Te comparto el enlace o una captura del producto para que me confirmes el costo y la entrega.\n\nProducto o enlace:\nCantidad:\nTalla o color (si aplica):`;
          a.href=`https://wa.me/${api.actual[k].numero}?text=${encodeURIComponent(mensaje)}`;
          a.target='_blank';a.rel='noopener noreferrer';
          const marca=document.createElement('strong');marca.textContent=nombre;
          const accion=document.createElement('small');accion.textContent='Solicitar por WhatsApp';
          a.append(marca,accion);grid.append(a);
        }
        zona.replaceChildren(titulo,ayuda,grid);zona.hidden=false;
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
        datos[k]=k==='mandaditos'?{numero:n}:{numero:n,activo};
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
