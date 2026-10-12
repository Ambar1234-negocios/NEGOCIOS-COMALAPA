/* Fichas inmobiliarias: se guardan en negocios.json junto a los perfiles existentes. */
(() => {
  'use strict';
  // Completa solo el ejemplo original cuando la copia local aún no tiene tarjetas.
  try {
    const clave='exhibicionNegocios';const locales=JSON.parse(localStorage.getItem(clave)||'[]');
    if(Array.isArray(locales)){
      const ejemplo=locales.find(n=>n.slug==='lote-los-mangos'&&n.id===1791696799094&&/EJEMPLO/i.test(n.nombre||''));
      if(ejemplo?.propiedad&&!Array.isArray(ejemplo.propiedad.incluye)){
        ejemplo.propiedad.incluye=[{"titulo":"Barda perimetral","descripcion":"Ejemplo: barda alrededor del terreno para delimitar el espacio. Característica ficticia para mostrar esta tarjeta."},{"titulo":"Acceso por calle amplia","descripcion":"Ejemplo: espacio para entrar y salir en vehículo. El acceso real debe confirmarse."},{"titulo":"Espacio para tu proyecto","descripcion":"200 m² de superficie: 10 metros de frente y 20 de fondo, según esta ficha de demostración."},{"titulo":"Agua y luz","descripcion":"Conexiones pendientes de confirmar. Este ejemplo no incluye una instalación comprobada."}];
        localStorage.setItem(clave,JSON.stringify(locales));
      }
    }
  }catch(error){console.warn('No se pudo completar el lote de demostración en este navegador.',error);}

  try { const locales=JSON.parse(localStorage.getItem('exhibicionNegocios')||'[]');if(Array.isArray(locales)){const ejemplo=locales.find(n=>n.slug==='lote-los-mangos'&&n.id===1791696799094&&/EJEMPLO/i.test(n.nombre||''));if(ejemplo&&!ejemplo.video){ejemplo.video='https://www.facebook.com/share/v/19TTRpBUbK/';localStorage.setItem('exhibicionNegocios',JSON.stringify(locales));}}}catch(error){console.warn('No se pudo completar el video del ejemplo.',error);}
  const tipos = ['Lote','Terreno','Casa','Departamento','Edificio','Parcela','Local comercial'];
  const estados = ['Disponible','En trato','Vendida'];
  const regimenes = ['Por confirmar','Propiedad privada','Ejidal','Comunal'];
  const textos = {
    'Propiedad privada':'Propiedad bajo régimen privado. La documentación y su inscripción deben revisarse para confirmar la titularidad y situación del inmueble. Este tipo no significa, por sí solo, que la documentación esté verificada.',
    Ejidal:'Forma parte de un ejido y se rige por la Ley Agraria. Puede contar con documentos que acreditan derechos agrarios, como un certificado parcelario. La transmisión requiere cumplir las reglas aplicables al caso.',
    Comunal:'Forma parte de una comunidad agraria. Los derechos y su transmisión se rigen por las disposiciones agrarias aplicables; deben revisarse los documentos correspondientes.',
    'Por confirmar':'El régimen de esta propiedad está pendiente de confirmar.'
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const secciones = [['medidas','¿Cuánto mide y cómo está distribuida?'],['servicios','¿Tiene agua, luz y otros servicios?'],['areas','¿Cómo es el acceso y qué espacios tiene?'],['ubicacion','¿Dónde está y qué hay cerca?'],['pagos','¿Cómo puedo pagar y qué gastos hay?']];
  function validar(p) {
    if (!p) return null;
    if (!tipos.includes(p.tipo) || !estados.includes(p.estado) || !regimenes.includes(p.regimen)) throw Error('Revisa el tipo, estado y régimen de la propiedad.');
    for(const clave of ['precio','superficie','construccion','frente','fondo','habitaciones','banos']) {
      if(p[clave] !== '' && p[clave] != null && (!Number.isFinite(Number(p[clave])) || Number(p[clave]) < 0)) throw Error('Revisa los valores numéricos de la propiedad.');
    }
    return p;
  }

  function informacionExtra(p){
    const tarjetas=(key,titulo,icono)=>{
      const items=(Array.isArray(p[key])?p[key]:[]).filter(x=>x&&String(x.titulo||'').trim()&&String(x.descripcion||'').trim());
      return items.length?`<section class="propiedad-info-extra" data-propiedad-info="${key}"><h4>${titulo}</h4><div class="propiedad-info-grid">${items.map(x=>`<article><span aria-hidden="true">${icono}</span><h5>${escape(x.titulo)}</h5><p>${escape(x.descripcion)}</p></article>`).join('')}</div></section>`:'';
    };
    const preguntas=(Array.isArray(p.preguntas)?p.preguntas:[]).filter(x=>x&&String(x.pregunta||'').trim()&&String(x.respuesta||'').trim());
    return tarjetas('incluye','Cada detalle cuenta','✓')+tarjetas('cercanos','¿Qué tienes cerca?','📍')+(preguntas.length?`<section class="propiedad-info-extra"><h4>Dudas antes de comprar</h4>${preguntas.map(x=>`<details><summary>${escape(x.pregunta)}</summary><div class="propiedad-texto">${escape(x.respuesta)}</div></details>`).join('')}</section>`:'');
  }

  function renderizar(n) {
    const p=n.propiedad;
    if(!p)return '';
    const estado=estados.includes(p.estado)?p.estado:'Disponible';
    const dinero=Number(p.precio)>0?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(p.precio)):'Precio por consultar';
    const datos=[['superficie','Terreno','m²'],['construccion','Construcción','m²'],['frente','Frente','m'],['fondo','Fondo','m'],['habitaciones','Recámaras',''],['banos','Baños','']].filter(([key])=>p[key]!==''&&p[key]!=null);
    const iconos={medidas:'📐',servicios:'💧',areas:'🌳',ubicacion:'📍',pagos:'💰'};
    const tabs=secciones.filter(([key])=>String(p[key]||'').trim()).map(([key,titulo])=>`<details data-propiedad-seccion="${key}"><summary><span class="propiedad-icono" aria-hidden="true">${iconos[key]}</span><span>${titulo}</span></summary><div class="propiedad-texto">${escape(p[key])}</div></details>`).join('');
    return `<section class="propiedad-ficha"><div class="propiedad-resumen"><span class="propiedad-estado estado-${estados.indexOf(estado)}">${escape(estado)}</span><span class="propiedad-tipo">${escape(p.tipo)}</span><h4>${escape(dinero)}${Number(p.precio)>0?'<small>Pesos mexicanos</small>':''}</h4><div class="propiedad-datos">${datos.map(([key,titulo,unidad])=>`<div><strong>${escape(p[key])} ${unidad}</strong><span>${titulo}</span></div>`).join('')}</div></div><h4>Conoce esta propiedad</h4><p class="propiedad-ayuda">Toca cada apartado para ver los detalles.</p>${tabs}<details data-propiedad-seccion="documentos"><summary><span class="propiedad-icono" aria-hidden="true">📄</span><span>¿Qué documentos tiene?<small>${escape(p.regimen)}</small></span></summary><div class="propiedad-texto"><p>${escape(textos[p.regimen]||textos['Por confirmar'])}</p><p><strong>Documentación disponible:</strong> ${escape(p.documentos||'Por confirmar')}</p>${p.notaDocumentos?`<p>${escape(p.notaDocumentos)}</p>`:''}</div></details>${informacionExtra(p)}</section>`;
  }
  function acciones(n) {
    if(!n.propiedad)return '';
    const numero=String(n.whatsapp||'').replace(/\D/g,'');
    const wa=numero.length===10?'52'+numero:numero.length===12&&numero.startsWith('52')?numero:'';
    if(!wa)return '';
    const mensaje=(accion)=>`Hola, me interesa la propiedad "${n.nombre}". ${accion}`;
    const link=(titulo,texto)=>`<a class="accion accion-whatsapp" target="_blank" rel="noopener noreferrer" href="https://wa.me/${wa}?text=${encodeURIComponent(mensaje(texto))}"><span>📅</span><div><strong>${titulo}</strong><small>Confirmar por WhatsApp</small></div></a>`;
    return `<section class="perfil-acciones-oficial propiedad-citas">${link('Agendar visita','Quisiera agendar una visita. ¿Qué horarios tienen disponibles?')}</section>`;
  }
  function anuncios(lista) {
    return (Array.isArray(lista)?lista:[]).filter(n=>n.activo!==false&&n.propiedad?.enPublicidad===true&&n.propiedad.estado!=='Vendida'&&n.slug).map(n=>{
      const p=n.propiedad;
      const precio=Number(p.precio)>0?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(p.precio)):'Precio por consultar';
      const superficie=Number(p.superficie)>0?` · ${p.superficie} m²`:'';
      return {id:'propiedad-'+n.id,propiedadId:n.id,etiqueta:p.estado==='En trato'?'EN TRATO':`${p.tipo.toUpperCase()} EN VENTA`,titulo:n.nombre,texto:precio+superficie,boton:'Ver propiedad',enlace:'index.html?negocio='+encodeURIComponent(n.slug),imagen:n.logo||n.banner||n.galeria?.[0]||'',tema:p.temaPublicidad||'verde',activo:true,fechaInicio:'',fechaFin:''};
    });
  }
  window.PropiedadesExhibicion={tipos,estados,regimenes,secciones,validar,renderizar,acciones,anuncios};
})();
