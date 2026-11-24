(() => {
  'use strict';
  const BASE = 'https://gyvoyzxsgckpfkagzjtf.supabase.co';
  const KEY = 'sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
  const negocios = 'piloto_marca_agua_negocios';
  const global = 'piloto_marca_agua_global';
  const bucket = 'marcas-agua';
  const opacidad = {suave: 0.25, media: 0.45, fuerte: 0.7};
  const configuraciones = new Map();
  const marcasCargadas = new Map();
  const renderizadas = new WeakMap();
  let globalPublica;
  let lectura;

  const urlMarca = ruta => ruta && BASE + '/storage/v1/object/public/' + bucket + '/' + ruta;

  async function leerTabla(tabla, consulta) {
    const respuesta = await fetch(BASE + '/rest/v1/' + tabla + '?' + consulta, {
      headers: {apikey: KEY}, cache: 'no-store', signal: AbortSignal.timeout(5000)
    });
    if (!respuesta.ok) throw Error('No se pudo cargar la configuración de marca de agua.');
    return respuesta.json();
  }

  function cargar() {
    if (window.ENTORNO?.supabaseConfigurado === false) return;
    lectura ??= (async () => {
      const [filas, comunes] = await Promise.all([
        leerTabla(negocios, 'select=*&order=slug'), leerTabla(global, 'select=imagen&id=eq.true')
      ]);
      globalPublica = comunes[0]?.imagen;
      for (const fila of filas) configuraciones.set(fila.slug, fila);
    })().catch(error => console.warn(error.message));
    return lectura;
  }

  function imagen(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    return img.decode().then(() => img);
  }

  function cargarMarca(src) {
    if (src.startsWith('blob:')) return imagen(src);
    if (!marcasCargadas.has(src)) {
      marcasCargadas.set(src, imagen(src).catch(error => {
        marcasCargadas.delete(src);
        throw error;
      }));
    }
    return marcasCargadas.get(src);
  }

  async function componer(src, marcas, posicion, intensidad) {
    if (!marcas.length) return src;
    const [foto, ...sellos] = await Promise.all([imagen(src), ...marcas.map(cargarMarca)]);
    const canvas = document.createElement('canvas');
    const escala = Math.min(1, 1600 / Math.max(foto.naturalWidth, foto.naturalHeight));
    const ancho = canvas.width = Math.max(1, Math.round(foto.naturalWidth * escala));
    const alto = canvas.height = Math.max(1, Math.round(foto.naturalHeight * escala));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(foto, 0, 0, ancho, alto);
    ctx.globalAlpha = opacidad[intensidad] ?? opacidad.media;
    const margen = Math.min(ancho, alto) * 0.05;
    const dimensiones = sellos.map(sello => {
      const factor = Math.min(ancho * 0.36 / sello.naturalWidth, alto * 0.19 / sello.naturalHeight);
      return [sello.naturalWidth * factor, sello.naturalHeight * factor];
    });
    const total = dimensiones.reduce((suma, [, h]) => suma + h, margen * (sellos.length - 1));
    let y = posicion === 'centro' ? (alto - total) / 2 : alto - total - margen;
    sellos.forEach((sello, i) => {
      const [w, h] = dimensiones[i];
      const x = posicion === 'izquierda' ? margen : posicion === 'centro' ? (ancho - w) / 2 : ancho - w - margen;
      ctx.drawImage(sello, x, y, w, h);
      y += h + margen;
    });
    return canvas.toDataURL('image/webp', 0.9);
  }

  function marcasPublicas(config) {
    return [config?.usar_negocio && urlMarca(config.imagen),
      config?.usar_exhibicion && urlMarca(globalPublica)].filter(Boolean);
  }

  function atributo(slug) {
    return marcasPublicas(configuraciones.get(slug)).length
      ? ' data-marca-agua="' + slug + '" data-marca-pendiente' : '';
  }

  function asignar(img, src, slug) {
    if (atributo(slug)) {
      img.dataset.marcaAgua = slug;
      img.setAttribute('data-marca-pendiente', '');
    }
    img.src = src;
  }

  document.addEventListener('load', async ({target: img}) => {
    const config = configuraciones.get(img.dataset?.marcaAgua);
    if (!config || renderizadas.get(img) === img.src) return;
    const origen = img.src;
    try {
      const salida = await componer(origen, marcasPublicas(config), config.posicion, config.intensidad);
      if (img.src !== origen || !img.isConnected) return;
      renderizadas.set(img, salida);
      img.src = salida;
      await img.decode();
    } catch {
      if (img.src === origen) img.removeAttribute('src');
    } finally {
      if (!img.hasAttribute('src') || img.src === renderizadas.get(img)) img.removeAttribute('data-marca-pendiente');
    }
  }, true);
  document.addEventListener('error', ({target: img}) => {
    img.removeAttribute?.('data-marca-pendiente');
  }, true);

  window.MarcaAgua = {cargar, atributo, asignar, componer, urlMarca, negocios, global, bucket};
})();
