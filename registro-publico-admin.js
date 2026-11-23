(() => {
  'use strict';
  if (window.ENTORNO?.ambiente === 'staging') return;
  const panel = document.getElementById('panel');
  const seccion = document.getElementById('registro-publico-admin');
  const vistaRecepcion = seccion.closest('[data-grupo="operacion"]');
  const visible = () => !panel.hidden && !vistaRecepcion?.hidden;
  const encontrar = selector => seccion.querySelector(selector);
  const enlace = encontrar('input[readonly]');
  const filtro = encontrar('input[type=search]');
  const mensaje = encontrar('[role=status]');
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const estados = ['Nueva', 'Buscando', 'Cotizando', 'Opción encontrada', 'Cliente informado', 'Finalizada'];
  let clientes = [];
  let version = 0;

  encontrar('[data-copiar]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(enlace.value);
      mensaje.textContent = 'Enlace copiado.';
    } catch {
      enlace.focus();
      enlace.select();
      mensaje.textContent = 'Seleccioné el enlace para que puedas copiarlo.';
    }
  });

  function pintar(cuerpo, filas) {
    cuerpo.replaceChildren();
    for (const valores of filas) {
      const fila = cuerpo.insertRow();
      for (const valor of valores) {
        const celda = fila.insertCell();
        if (valor instanceof HTMLElement) celda.append(valor);
        else celda.textContent = valor;
      }
    }
  }

  function chatWhatsApp(cliente) {
    const telefono = cliente.telefono;
    const numero = /^\d{10}$/.test(telefono) ? '52' + telefono :
      /^521\d{10}$/.test(telefono) ? '52' + telefono.slice(3) : telefono;
    if (!/^\d{11,15}$/.test(numero)) return '—';
    const chat = document.createElement('a');
    chat.href = 'https://wa.me/' + numero;
    chat.target = '_blank';
    chat.rel = 'noopener noreferrer';
    chat.className = 'enlace-boton';
    chat.textContent = 'Agregar a WhatsApp';
    chat.setAttribute('aria-label', 'Agregar a WhatsApp a ' + cliente.nombre);
    chat.setAttribute('data-contacto-cliente', '');
    return chat;
  }

  function pintarClientes() {
    const consulta = filtro.value.trim().toLowerCase();
    const telefono = /^[+\d ().-]+$/.test(consulta) ? consulta.replace(/\D/g, '') : '';
    const visibles = clientes.filter(cliente => cliente.nombre.toLowerCase().includes(consulta) ||
      (telefono && cliente.telefono.includes(telefono)));
    pintar(encontrar('#registro-publico-clientes tbody'), visibles.map(cliente => {
      if (vistaRecepcion) return [cliente.nombre, cliente.telefono, chatWhatsApp(cliente)];
      const estado = document.createElement('select');
      estado.setAttribute('aria-label', 'Estado de ' + cliente.nombre);
      estado.add(new Option('Activo', 'true'));
      estado.add(new Option('Inactivo', 'false'));
      estado.value = String(cliente.activo);
      estado.onchange = async () => {
        const activo = estado.value === 'true';
        estado.disabled = true;
        try {
          await cambiar('registro_publico_clientes?id=eq.' + cliente.id, { activo });
          cliente.activo = activo;
          estado.closest('tr').cells[2].replaceChildren(accion());
        } catch {
          estado.value = String(cliente.activo);
        } finally {
          estado.disabled = false;
        }
      };
      const accion = () => cliente.activo && cliente.consentimiento ? chatWhatsApp(cliente) : '—';
      return [cliente.nombre, cliente.telefono, accion(), cliente.dia + '/' + cliente.mes,
        fecha.format(new Date(cliente.fecha)), cliente.consentimiento ? 'Sí' : 'No', estado];
    }));
    encontrar('[data-vacio]').hidden = visibles.length > 0;
  }

  async function cambiar(ruta, datos) {
    try {
      const resultado = await api('/rest/v1/' + ruta, { method: 'PATCH', datos });
      if (resultado?.length !== 1) throw new Error();
      mensaje.textContent = 'Cambio guardado.';
    } catch (error) {
      mensaje.textContent = 'No se pudo guardar el cambio.';
      throw error;
    }
  }

  async function paginar(cargar) {
    const filas = [];
    const pagina = 100;
    for (let offset = 0; ; offset += pagina) {
      const lote = await cargar(offset, pagina);
      filas.push(...lote);
      if (lote.length < pagina || !visible()) return filas;
    }
  }

  function listar(tabla, columnas, llave) {
    return paginar((offset, pagina) => api('/rest/v1/' + tabla + '?select=' + columnas +
      '&order=fecha.desc,' + llave + '.asc&limit=' + pagina + '&offset=' + offset));
  }

  async function actualizar() {
    const actual = ++version;
    if (!visible()) {
      clientes = [];
      pintarClientes();
      if (!vistaRecepcion) pintar(encontrar('#registro-publico-solicitudes tbody'), []);
      mensaje.textContent = '';
      return;
    }
    mensaje.textContent = 'Cargando registros…';
    try {
      if (vistaRecepcion) {
        const contactos = await paginar(offset => api('/rest/v1/rpc/registro_publico_contactos_recepcion', {
          method: 'POST', datos: { p_offset: offset }
        }));
        if (actual !== version || !visible()) return;
        clientes = contactos;
        pintarClientes();
        mensaje.textContent = '';
        return;
      }
      const [altas, solicitudes] = await Promise.all([
        listar('registro_publico_clientes', 'id,nombre,telefono,dia,mes,fecha,consentimiento,activo,duplicado_de', 'id'),
        listar('registro_publico_solicitudes', 'cliente_id,busqueda,categoria,comentario,fecha,estado', 'cliente_id')
      ]);
      if (actual !== version || panel.hidden) return;
      clientes = altas.filter(cliente => !cliente.duplicado_de);
      pintarClientes();
      const originales = new Map(clientes.map(cliente => [cliente.id, cliente.nombre]));
      const nombres = new Map(altas.map(cliente => [cliente.id, originales.get(cliente.duplicado_de || cliente.id)]));
      pintar(encontrar('#registro-publico-solicitudes tbody'), solicitudes.map(solicitud => {
        const estado = document.createElement('select');
        estado.setAttribute('aria-label', 'Estado de solicitud de ' + (nombres.get(solicitud.cliente_id) ?? 'cliente'));
        for (const valor of estados) estado.add(new Option(valor, valor));
        estado.value = solicitud.estado;
        estado.onchange = async () => {
          estado.disabled = true;
          try {
            await cambiar('registro_publico_solicitudes?cliente_id=eq.' + solicitud.cliente_id, { estado: estado.value });
            solicitud.estado = estado.value;
          } catch {
            estado.value = solicitud.estado;
          } finally {
            estado.disabled = false;
          }
        };
        return [nombres.get(solicitud.cliente_id) ?? 'Cliente', solicitud.busqueda,
          solicitud.categoria || '—', solicitud.comentario || '—', fecha.format(new Date(solicitud.fecha)), estado];
      }));
      mensaje.textContent = solicitudes.length ? '' : 'Todavía no hay solicitudes.';
    } catch {
      if (actual === version) mensaje.textContent = 'No se pudieron consultar los registros. Intenta actualizar.';
    }
  }

  filtro.addEventListener('input', pintarClientes);
  encontrar('[data-actualizar]').addEventListener('click', actualizar);
  const observador = new MutationObserver(actualizar);
  const opciones = { attributes: true, attributeFilter: ['hidden'] };
  observador.observe(panel, opciones);
  if (vistaRecepcion) observador.observe(vistaRecepcion, opciones);
  if (visible()) actualizar();
})();
