'use strict';
// Las tarjetas pertenecen al perfil; nunca se convierten en productos con precio.
const fotosServiciosMenu = new Map();
function limpiarFotosServiciosMenu() {
 for (const cambio of fotosServiciosMenu.values()) if (cambio.previa) URL.revokeObjectURL(cambio.previa);
 fotosServiciosMenu.clear();
}
function confirmarRecargaServiciosMenu() {
 return !fotosServiciosMenu.size || confirm('Hay fotos de servicios sin publicar. ¿Descartar esos cambios y actualizar?');
}
function fotoServicioMenu(src) {
 if (fotoPublicaMenu(src)) return src;
 return typeof src === 'string' && /^imagenes\/[a-zA-Z0-9_./-]+$/.test(src) && !src.includes('..') ? '/' + src : '';
}
function pintarServiciosMenu() {
 const zona = el('servicios-menu');
 if (!zona) return; // Otras vistas comparten el editor de productos.
 zona.replaceChildren();
 const fila = menuCompleto;
 const servicios = Array.isArray(fila?.original?.servicios) ? fila.original.servicios : [];
 const tarjetas = servicios.map((servicio, indice) => ({servicio, indice})).filter(({servicio}) => servicio && typeof servicio === 'object' && servicio.tipo === 'tratamiento');
 const soloServicios = tarjetas.length > 0 && !(fila.borrador.productos || []).some(p => !p.eliminado);
 for (const id of ['nuevo-producto', 'buscar-menu', 'categoria-menu', 'conteo-menu', 'lista-completa']) {
  if (el(id)) el(id).hidden = soloServicios;
  const label = document.querySelector('label[for="' + id + '"]'); if (label) label.hidden = soloServicios;
 }
 zona.hidden = !tarjetas.length;
 if (!tarjetas.length) return;
 zona.append(nodo('h3', '📷 Servicios y tratamientos'), nodo('p', 'Fotos de las tarjetas del perfil público. Elige o quita las fotos y pulsa «Guardar y publicar fotos».'));
 const lista = nodo('div', undefined, 'tarjetas-servicios-menu');
 for (const {servicio, indice} of tarjetas) {
  const tarjeta = nodo('article', undefined, 'tarjeta-servicio-menu');
  const titulo = servicio.nombre || 'Servicio sin nombre';
  tarjeta.append(nodo('h4', titulo), nodo('p', servicio.descripcion || 'Sin descripción.', 'descripcion-servicio-menu'));
  const img = nodo('img'); img.alt = 'Foto de ' + titulo; img.loading = 'lazy';
  const sinFoto = nodo('p', 'Sin foto', 'nota');
  const label = nodo('label', servicio.foto ? 'Cambiar foto' : 'Subir foto');
  const input = nodo('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.id = 'foto-servicio-menu-' + indice; label.htmlFor = input.id;
  const quitar = nodo('button', 'Quitar foto', 'secundario'); quitar.type = 'button'; quitar.setAttribute('aria-label', 'Quitar foto de ' + titulo);
  const estado = nodo('p', '', 'nota'); estado.setAttribute('role', 'status');
  function actualizar() {
   const cambio = fotosServiciosMenu.get(indice);
   const src = cambio ? cambio.previa || fotoServicioMenu(cambio.foto) : fotoServicioMenu(servicio.foto);
   img.hidden = !src; if (src) img.src = src; else img.removeAttribute('src');
   sinFoto.hidden = !!src; quitar.disabled = !src;
   estado.textContent = cambio ? (src ? 'Foto lista para publicar.' : 'Se quitará la foto al publicar.') : '';
   label.textContent = src ? 'Cambiar foto' : 'Subir foto';
  }
  img.onerror = () => {img.hidden = true; sinFoto.hidden = false; sinFoto.textContent = 'No se pudo mostrar la foto.';};
  input.onchange = async () => {await tareaFotoServicioMenu(async () => {
   const archivo = input.files[0]; if (!archivo) return;
   const blob = await comprimir(archivo);
   if (menuCompleto !== fila) return;
   const anterior = fotosServiciosMenu.get(indice); if (anterior?.previa) URL.revokeObjectURL(anterior.previa);
   fotosServiciosMenu.set(indice, {blob, previa: URL.createObjectURL(blob), foto: null});
   actualizar(); input.value = ''; actualizarBotones();
  }, estado); input.value = ''; actualizarBotones(); quitar.disabled = !(fotosServiciosMenu.get(indice)?.previa || fotoServicioMenu(fotosServiciosMenu.get(indice)?.foto ?? servicio.foto));};
  quitar.onclick = () => {
   const anterior = fotosServiciosMenu.get(indice); if (anterior?.previa) URL.revokeObjectURL(anterior.previa);
   fotosServiciosMenu.set(indice, {foto: ''}); input.value = ''; actualizar(); actualizarBotones();
  };
  tarjeta.append(img, sinFoto, label, input, quitar, estado); lista.append(tarjeta); actualizar();
 }
 const guardar = nodo('button', '✅ Guardar y publicar fotos'); guardar.type = 'button';
 const cancelar = nodo('button', 'Descartar cambios de fotos', 'secundario'); cancelar.type = 'button';
 const estado = nodo('p', '', 'nota'); estado.setAttribute('role', 'status');
 function actualizarBotones() {guardar.disabled = cancelar.disabled = !fotosServiciosMenu.size;}
 cancelar.onclick = () => {limpiarFotosServiciosMenu(); pintarServiciosMenu();};
 guardar.onclick = () => tareaFotoServicioMenu(async () => {
  if (menuCompleto !== fila || !fotosServiciosMenu.size) return;
  const nuevos = structuredClone(servicios);
  for (const [indice, cambio] of fotosServiciosMenu) {
   if (cambio.blob && !cambio.foto) {
    const ruta = cuenta.user.id + '/' + crypto.randomUUID() + '.webp';
    await api('/storage/v1/object/menu-publico/' + ruta, {method: 'POST', datos: cambio.blob});
    cambio.foto = BASE + '/storage/v1/object/public/menu-publico/' + ruta;
   }
   nuevos[indice].foto = cambio.foto;
  }
  // El RPC existente comprueba permisos/revisión y fusiona estos campos en ambas versiones.
  const {nombre, slug, categoria, activo, id} = fila.original;
  await api('/rest/v1/rpc/sitio_perfil_guardar', {method: 'POST', datos: {negocio: fila.slug, version: fila.revision, datos: {nombre, slug, categoria, activo, id, servicios: nuevos}}});
  limpiarFotosServiciosMenu();
  await cargarMenuCompleto();
  aviso('✅ Fotos de servicios publicadas. Abre o actualiza el perfil público para verlas.');
 }, estado);
 zona.append(lista, guardar, cancelar, estado); actualizarBotones();
}
async function tareaFotoServicioMenu(fn, estado) {
 return tarea(async () => {
  const controles = Array.from(document.querySelectorAll('#servicios-menu input, #negocio-menu'), control => [control, control.disabled]);
  controles.forEach(([control]) => control.disabled = true);
  estado.textContent = 'Procesando fotos…';
  try {await fn();} catch (error) {estado.textContent = error.message; throw error;}
  finally {controles.forEach(([control, disabled]) => control.disabled = disabled);}
 });
}
