/* Servicios simples y detalles opcionales. Compartido por el panel y el perfil. */
(() => {
  'use strict';
  const nombre = servicio => typeof servicio === 'string' ? servicio : (servicio?.nombre || '');
  const detalles = servicio => Array.isArray(servicio?.detalles) ? servicio.detalles : [];
  const visibles = servicio => servicio?.mostrarDetalles === true && detalles(servicio).some(item => item.trim());
  const escapar = valor => String(valor).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icono = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h12l6 7-6 7H3z"/><circle cx="15" cy="12" r="1.5"/></svg> ';
  function renderizar(servicio) {
    const etiqueta = icono + escapar(nombre(servicio));
    if (!visibles(servicio)) return `<span>${etiqueta}</span>`;
    return `<details class="servicio-desplegable"><summary>${etiqueta}</summary><ul>${detalles(servicio).filter(item => item.trim()).map(item => `<li>${escapar(item)}</li>`).join('')}</ul></details>`;
  }
  function validarNegocios(datos) {
    if (!Array.isArray(datos)) throw Error('El archivo debe contener una lista de negocios.');
    const ids = new Set();
    for (const negocio of datos) {
      if (!negocio || typeof negocio !== 'object' || !Number.isSafeInteger(negocio.id) || negocio.id <= 0 || typeof negocio.nombre !== 'string' || !negocio.nombre.trim() || typeof negocio.categoria !== 'string' || !negocio.categoria.trim()) throw Error('Cada negocio necesita un ID numérico, nombre y categoría.');
      if (ids.has(negocio.id)) throw Error('El archivo contiene IDs de negocio repetidos.');
      ids.add(negocio.id);
      if (negocio.servicios === undefined) continue;
      if (!Array.isArray(negocio.servicios)) throw Error('Los servicios deben ser una lista.');
      for (const servicio of negocio.servicios) {
        if (typeof servicio === 'string') continue;
        if (!servicio || typeof servicio.nombre !== 'string' || typeof servicio.mostrarDetalles !== 'boolean' || !Array.isArray(servicio.detalles) || servicio.detalles.some(item => typeof item !== 'string')) throw Error('Hay un servicio con detalles en un formato no compatible.');
      }
    }
    return datos;
  }
  window.ServiciosExhibicion = {nombre, detalles, visibles, renderizar, validarNegocios};
})();
