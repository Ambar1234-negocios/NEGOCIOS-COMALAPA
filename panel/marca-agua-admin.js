(() => {
  'use strict';
  const marca = window.MarcaAgua;
  const dialogo = el('marca-agua-admin');
  const estado = el('marca-agua-estado');
  const controles = el('marca-agua-controles');
  const vista = el('marca-agua-preview');
  const ajustes = el('marca-agua-ajustes');
  const comun = el('marca-agua-global');
  const archivo = el('marca-agua-archivo');
  const archivoGlobal = el('marca-agua-archivo-global');
  const negocio = el('marca-agua-negocio');
  const exhibicion = el('marca-agua-exhibicion');
  const posicion = el('marca-agua-posicion');
  const intensidad = el('marca-agua-intensidad');
  const foto = el('marca-agua-foto');
  const miniatura = el('marca-agua-imagen-guardada');
  const miniaturaGlobal = el('marca-agua-global-guardada');
  const nota = el('marca-agua-nota');
  const cerrar = el('cerrar-marca-agua');
  let slug, fila, filaGlobal, pendiente, pendienteGlobal, versionVista = 0;

  function imagenMuestra(img, ruta) {
    img.hidden = !ruta;
    if (ruta) img.src = marca.urlMarca(ruta);
    else img.removeAttribute('src');
  }

  async function previa() {
    const version = ++versionVista;
    const urls = [];
    const elegir = (input, guardada) => {
      if (!input.files[0]) return marca.urlMarca(guardada);
      const url = URL.createObjectURL(input.files[0]);
      urls.push(url);
      return url;
    };
    vista.hidden = true;
    nota.textContent = '';
    try {
      const propia = negocio.checked && elegir(archivo, fila?.imagen);
      const general = exhibicion.checked && elegir(archivoGlobal, filaGlobal?.imagen);
      if (negocio.checked && !propia || exhibicion.checked && !general) {
        nota.textContent = 'Elige la imagen de cada marca activada para ver la combinación completa.';
      }
      if (!foto.value) return;
      const resultado = await marca.componer(foto.value, [propia, general].filter(Boolean), posicion.value, intensidad.value);
      if (version !== versionVista) return;
      vista.src = resultado;
      vista.hidden = false;
    } catch {
      if (version === versionVista) nota.textContent = 'No se pudo componer la vista previa con esas imágenes.';
    } finally {
      urls.forEach(url => URL.revokeObjectURL(url));
    }
  }

  async function subirMarca(file, carpeta) {
    const datos = await comprimir(file);
    const ruta = carpeta + '/' + crypto.randomUUID() + '.webp';
    await api('/storage/v1/object/' + marca.bucket + '/' + ruta, {method: 'POST', datos});
    return ruta;
  }

  async function operacion(fn) {
    cerrar.disabled = true;
    controles.disabled = true;
    estado.textContent = '';
    try { await fn(); }
    catch (error) { estado.textContent = error.message; }
    finally { controles.disabled = false; cerrar.disabled = false; }
  }

  async function guardar(tabla, filtro, datos, existente) {
    const filas = await api('/rest/v1/' + tabla + (existente ? '?' + filtro : ''), {
      method: existente ? 'PATCH' : 'POST', datos
    });
    if (!filas?.[0]) throw Error('La configuración cambió. Cierra y vuelve a abrir Marca de agua.');
    return filas[0];
  }

  el('abrir-marca-agua').onclick = async () => {
    if (!menuCompleto || dialogo.open) return;
    slug = menuCompleto.slug;
    fila = filaGlobal = pendiente = pendienteGlobal = null;
    ajustes.reset();
    comun.reset();
    imagenMuestra(miniatura, null);
    imagenMuestra(miniaturaGlobal, null);
    vista.hidden = true;
    nota.textContent = '';
    el('marca-agua-titulo').textContent = 'Marca de agua · ' + menuCompleto.borrador.nombre;
    const productos = (menuCompleto.original?.productos ?? []).filter(p => !p.eliminado);
    const galeria = menuCompleto.original?.galeria ?? [];
    const opciones = [
      ...productos.flatMap(p => [...new Set([p.foto, ...(p.fichaAvanzada?.fotos ?? [])])].map(src => [src, p.nombre])),
      ...(Array.isArray(galeria) ? galeria.map((src, i) => [src, 'Galería · foto ' + (i + 1)]) : [])
    ].filter(([src]) => typeof src === 'string' && (/^imagenes\/[\w./-]+$/.test(src) && !src.includes('..') || src.startsWith(BASE + '/storage/v1/object/public/')));
    foto.replaceChildren(new Option(opciones.length ? 'Elegir una foto de muestra' : 'Sin fotos publicadas para la vista previa', ''),
      ...opciones.map(([src, titulo]) => new Option(titulo, src.startsWith('imagenes/') ? '/' + src : src)));
    foto.selectedIndex = opciones.length ? 1 : 0;
    dialogo.showModal();
    controles.disabled = true;
    cerrar.disabled = true;
    estado.textContent = 'Cargando las preferencias…';
    try {
      const [filas, comunes] = await Promise.all([
        api('/rest/v1/' + marca.negocios + '?select=*&slug=eq.' + encodeURIComponent(slug)),
        api('/rest/v1/' + marca.global + '?select=*&id=eq.true')
      ]);
      fila = filas[0];
      filaGlobal = comunes[0];
      negocio.checked = fila?.usar_negocio ?? false;
      exhibicion.checked = fila?.usar_exhibicion ?? false;
      posicion.value = fila?.posicion ?? 'derecha';
      intensidad.value = fila?.intensidad ?? 'media';
      imagenMuestra(miniatura, fila?.imagen);
      imagenMuestra(miniaturaGlobal, filaGlobal?.imagen);
      controles.disabled = false;
      estado.textContent = '';
      previa();
    } catch (error) {
      estado.textContent = error.message;
    } finally {
      cerrar.disabled = false;
    }
  };

  cerrar.onclick = () => dialogo.close();
  dialogo.addEventListener('cancel', e => { if (cerrar.disabled) e.preventDefault(); });
  dialogo.addEventListener('close', () => { versionVista++; vista.removeAttribute('src'); });
  controles.onchange = e => {
    if (e.target === archivo) pendiente = null;
    if (e.target === archivoGlobal) pendienteGlobal = null;
    previa();
  };

  comun.onsubmit = e => {
    e.preventDefault();
    operacion(async () => {
      if (!archivoGlobal.files[0]) throw Error('Elige la nueva imagen de Exhibición.');
      pendienteGlobal ??= await subirMarca(archivoGlobal.files[0], 'exhibicion');
      filaGlobal = await guardar(marca.global, 'id=eq.true', {id: true, imagen: pendienteGlobal}, filaGlobal);
      archivoGlobal.value = '';
      pendienteGlobal = null;
      imagenMuestra(miniaturaGlobal, filaGlobal.imagen);
      estado.textContent = 'Marca global guardada. Se actualizará en los negocios que la tienen activada.';
      previa();
    });
  };

  ajustes.onsubmit = e => {
    e.preventDefault();
    operacion(async () => {
      if (negocio.checked && !fila?.imagen && !archivo.files[0]) throw Error('Elige la imagen de marca del negocio.');
      if (exhibicion.checked && !filaGlobal?.imagen) throw Error('Guarda primero la imagen global de Exhibición.');
      if (archivo.files[0]) pendiente ??= await subirMarca(archivo.files[0], slug);
      fila = await guardar(marca.negocios, 'slug=eq.' + encodeURIComponent(slug), {
        slug, imagen: pendiente ?? fila?.imagen ?? null, usar_negocio: negocio.checked,
        usar_exhibicion: exhibicion.checked, posicion: posicion.value, intensidad: intensidad.value
      }, fila);
      archivo.value = '';
      pendiente = null;
      imagenMuestra(miniatura, fila.imagen);
      estado.textContent = 'Preferencias guardadas. Abre o actualiza la página pública para verlas.';
      previa();
    });
  };
})();
