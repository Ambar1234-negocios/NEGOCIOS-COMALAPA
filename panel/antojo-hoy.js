'use strict';

// Shared by the owner, administration and the pawn-shop catalog.
async function montarAntojoHoy(contenedor, slug, productos) {
  contenedor.querySelector('[data-antojo-hoy]')?.remove();
  if (!window.ENTORNO?.supabaseConfigurado) return;

  const seccion = nodo('section', undefined, 'tarjeta');
  seccion.dataset.antojoHoy = slug;
  const contador = nodo('p');
  contador.setAttribute('role', 'status');
  const avisoLimite = nodo('p', '', 'aviso');
  avisoLimite.setAttribute('role', 'status');
  const estado = nodo('p');
  estado.setAttribute('role', 'status');
  const lista = nodo('div');
  const titulo = nodo('h3');
  seccion.append(titulo, contador, avisoLimite, estado, lista);
  contenedor.prepend(seccion);
  seccion.hidden = true;

  const consultar = datos => api('/rest/v1/rpc/antojo_hoy_gestionar', {
    method: 'POST', datos: {slug_negocio: slug, ...datos}
  });
  let datos;
  let guardando = false;

  function pintar(enfocarId) {
    const activos = new Set(datos.activos);
    const seleccionados = new Set(datos.seleccionados);
    const lleno = seleccionados.size >= datos.limite;
    const nombreSeccion = datos.seccion === 'antojo' ? '¿Qué se te antoja hoy?' : 'Tendencias';
    titulo.textContent = nombreSeccion;
    const mensaje = 'Tu plan incluye hasta ' + datos.limite + ' productos en ' + nombreSeccion +
      '. Si quieres destacar otro producto, primero desmarca uno de los que ya tienes seleccionados.';
    contador.textContent = 'Productos destacados: ' + seleccionados.size + ' de ' + datos.limite;
    avisoLimite.textContent = lleno ? mensaje : '';
    avisoLimite.hidden = !lleno;
    lista.replaceChildren();

    const disponibles = productos.filter(p => activos.has(p.id));
    if (!disponibles.length) lista.append(nodo('p', 'No hay productos activos para destacar.'));
    for (const producto of disponibles) {
      const marcado = seleccionados.has(producto.id);
      const fila = nodo('div', undefined, 'acciones-menu');
      fila.append(nodo('span', producto.nombre));
      const control = nodo('button', marcado ? 'Quitar de destacados' : 'Destacar', 'secundario');
      control.type = 'button';
      control.setAttribute('aria-label', control.textContent + ': ' + producto.nombre);
      // Keep blocked controls focusable so both a tap and Enter can announce the limit.
      control.setAttribute('aria-disabled', String(guardando || (lleno && !marcado)));
      control.onclick = async () => {
        if (guardando) return;
        if (lleno && !marcado) {
          estado.textContent = mensaje;
          return;
        }
        const devolverFoco = document.activeElement === control;
        guardando = true;
        lista.setAttribute('aria-busy', 'true');
        estado.textContent = 'Guardando…';
        try {
          datos = await consultar({id_producto: producto.id, destacar: !marcado});
          estado.textContent = marcado ? 'Producto retirado de destacados.' : 'Producto destacado.';
        } catch (error) {
          estado.textContent = error.message;
          try { datos = await consultar({}); } catch {}
        } finally {
          guardando = false;
          lista.removeAttribute('aria-busy');
          if (seccion.isConnected) pintar(devolverFoco ? producto.id : undefined);
        }
      };
      fila.append(control);
      lista.append(fila);
      if (enfocarId === producto.id) control.focus({preventScroll: true});
    }
  }

  try {
    datos = await consultar({});
    if (!seccion.isConnected || !datos.habilitado) return;
    seccion.hidden = false;
    pintar();
  } catch {
    if (seccion.isConnected) seccion.remove();
  }
}
