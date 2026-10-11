/* Fichas inmobiliarias: se guardan en negocios.json junto a los perfiles existentes. */
(() => {
  'use strict';
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
  const secciones = [['medidas','Medidas y distribución'],['servicios','Servicios e infraestructura'],['areas','Áreas comunes y acceso'],['ubicacion','Ubicación y alrededores'],['pagos','Formas de pago y cuotas']];
  function validar(p) {
    if (!p) return null;
    if (!tipos.includes(p.tipo) || !estados.includes(p.estado) || !regimenes.includes(p.regimen)) throw Error('Revisa el tipo, estado y régimen de la propiedad.');
    for(const clave of ['precio','superficie','construccion','frente','fondo','habitaciones','banos']) {
      if(p[clave] !== '' && p[clave] != null && (!Number.isFinite(Number(p[clave])) || Number(p[clave]) < 0)) throw Error('Revisa los valores numéricos de la propiedad.');
    }
    return p;
  }
  function renderizar(n) {
    const p=n.propiedad;
    if(!p)return '';
    const estado=estados.includes(p.estado)?p.estado:'Disponible';
    const dinero=Number(p.precio)>0?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(p.precio)):'Precio por consultar';
    const datos=[['superficie','Terreno','m²'],['construccion','Construcción','m²'],['frente','Frente','m'],['fondo','Fondo','m'],['habitaciones','Habitaciones',''],['banos','Baños','']].filter(([key])=>p[key]!==''&&p[key]!=null);
    const tabs=secciones.filter(([key])=>String(p[key]||'').trim()).map(([key,titulo])=>`<details><summary>${titulo}</summary><div class="propiedad-texto">${escape(p[key])}</div></details>`).join('');
    return `<section class="propiedad-ficha"><div class="propiedad-resumen"><span class="propiedad-estado estado-${estados.indexOf(estado)}">${escape(estado)}</span><span class="propiedad-tipo">${escape(p.tipo)}</span><h4>${escape(dinero)}</h4><div class="propiedad-datos">${datos.map(([key,titulo,unidad])=>`<div><strong>${escape(p[key])} ${unidad}</strong><span>${titulo}</span></div>`).join('')}</div></div><h4>Información de la propiedad</h4>${tabs}<details><summary>Tipo de propiedad y documentos · ${escape(p.regimen)}</summary><div class="propiedad-texto"><p>${escape(textos[p.regimen]||textos['Por confirmar'])}</p><p><strong>Documentación disponible:</strong> ${escape(p.documentos||'Por confirmar')}</p>${p.notaDocumentos?`<p>${escape(p.notaDocumentos)}</p>`:''}</div></details></section>`;
  }
  function acciones(n) {
    if(!n.propiedad)return '';
    const numero=String(n.whatsapp||'').replace(/\D/g,'');
    const wa=numero.length===10?'52'+numero:numero.length===12&&numero.startsWith('52')?numero:'';
    if(!wa)return '';
    const mensaje=(accion)=>`Hola, me interesa la propiedad "${n.nombre}". ${accion}`;
    const link=(titulo,texto)=>`<a class="accion accion-whatsapp" target="_blank" rel="noopener noreferrer" href="https://wa.me/${wa}?text=${encodeURIComponent(mensaje(texto))}"><span>📅</span><div><strong>${titulo}</strong><small>Confirmar por WhatsApp</small></div></a>`;
    return `<section class="perfil-acciones-oficial propiedad-citas">${link('Agendar visita','Quisiera agendar una visita. ¿Qué horarios tienen disponibles?')}${link('Agendar videollamada','Quisiera agendar una videollamada para conocerla.')}</section>`;
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
