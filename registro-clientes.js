import { datosClientes, estados, meses, soloDigitos } from './clientes-pruebas-datos.js?v=confirmacion';

const porId = id => document.getElementById(id);
const fechaLocal = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const consentimiento = 'Acepto registrarme voluntariamente para recibir promociones, novedades y beneficios de Exhibición Frontera Comalapa por WhatsApp. Puedo dejar de participar cuando quiera.';
const mensajeWhatsApp = 'Hola 👋 Ya me registré en Exhibición Frontera Comalapa para recibir promociones, novedades y beneficios por WhatsApp.';
const whatsappAdministracion = 'https://api.whatsapp.com/send?phone=529633106862&text=' + encodeURIComponent(mensajeWhatsApp);

function opciones(lista, inicial) {
  return '<option value="">' + inicial + '</option>' +
    lista.map((texto, indice) => '<option value="' + (indice + 1) + '">' + texto + '</option>').join('');
}

function prepararAlta(formulario, manual = false) {
  const obligatorio = manual ? '' : ' required';
  formulario.innerHTML = `
    <label>Nombre<input name="nombre" required maxlength="100"></label>
    <label>WhatsApp<input name="telefono" type="tel" required maxlength="24"></label>
    <div class="registro-cumple" role="group" aria-label="Cumpleaños">
      <label>Día${manual ? ' (opcional)' : ''}<select name="dia"${obligatorio}>${opciones(Array.from({length: 31}, (_, i) => i + 1), 'Día')}</select></label>
      <label>Mes${manual ? ' (opcional)' : ''}<select name="mes"${obligatorio}>${opciones(meses, 'Mes')}</select></label>
    </div>
    <p class="registro-nota">El día y mes de tu cumpleaños se utilizarán para ofrecerte beneficios o promociones de cumpleaños cuando estén disponibles.</p>
    <label class="registro-consentimiento"><input type="checkbox" name="consentimiento" required>
      <span>${manual ? 'El cliente dio este consentimiento voluntario por WhatsApp. ' : ''}${consentimiento}</span>
    </label>
    <button>${manual ? 'Guardar alta manual' : 'Registrarme y confirmar por WhatsApp'}</button>
    ${manual ? '' : '<p class="registro-nota">Al registrarte, se abrirá WhatsApp con un mensaje de confirmación listo para enviar.</p>'}
    <p role="status"></p>`;
}

function alGuardar(formulario, guardar) {
  const boton = formulario.querySelector('button');
  const aviso = formulario.querySelector('[role=status]');
  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (boton.disabled) return;
    boton.disabled = true;
    aviso.textContent = '';
    try {
      await guardar(new FormData(formulario), aviso);
    } catch (error) {
      aviso.textContent = error instanceof DOMException
        ? 'No se pudo usar el almacenamiento de pruebas de este navegador.'
        : error.message;
    } finally {
      boton.disabled = false;
    }
  });
}

function iniciarRegistro(formulario) {
  function mostrarConfirmacion() {
    porId('registro-formulario').hidden = true;
    const confirmacion = porId('registro-confirmacion');
    confirmacion.hidden = false;
    confirmacion.querySelector('h2').focus();
    porId('registro-whatsapp').href = whatsappAdministracion;
  }

  if (history.state?.registroGuardado) {
    mostrarConfirmacion();
    return;
  }

  prepararAlta(formulario);
  porId('registro-formulario').hidden = false;
  alGuardar(formulario, async valores => {
    await datosClientes.registrarCliente(valores, 'Registro web');
    formulario.reset();
    mostrarConfirmacion();
    history.replaceState({ ...history.state, registroGuardado: true }, '');
    location.assign(whatsappAdministracion);
  });
}

function pintarTabla(cuerpo, filas) {
  cuerpo.replaceChildren();
  for (const columnas of filas) {
    const fila = cuerpo.insertRow();
    for (const valor of columnas) {
      const celda = fila.insertCell();
      if (valor instanceof HTMLElement) celda.append(valor);
      else celda.textContent = valor;
    }
  }
}

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function iniciarAdministracion(seccion) {
  const formulario = porId('registro-alta-manual');
  const filtro = porId('registro-filtro');
  const aviso = porId('registro-admin-aviso');
  prepararAlta(formulario, true);
  seccion.hidden = false;

  function controlEstado(solicitud) {
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Estado de la solicitud: ' + solicitud.busqueda);
    for (const estado of estados) select.add(new Option(estado, estado));
    select.value = solicitud.estado;
    select.addEventListener('change', async () => {
      select.disabled = true;
      try {
        await datosClientes.cambiarEstado(solicitud.id, select.value);
        solicitud.estado = select.value;
        aviso.textContent = 'Estado de prueba guardado.';
      } catch {
        select.value = solicitud.estado;
        aviso.textContent = 'No se pudo guardar el estado de prueba.';
      } finally {
        select.disabled = false;
      }
    });
    return select;
  }

  async function actualizar() {
    try {
      const [clientes, solicitudes] = await Promise.all([datosClientes.listarClientes(), datosClientes.listarSolicitudes()]);
      const consulta = normalizar(filtro.value.trim());
      const telefono = /^[+\d ().-]+$/.test(consulta) ? soloDigitos(consulta) : '';
      const visibles = clientes.filter(cliente => normalizar(cliente.nombre).includes(consulta) ||
        (telefono && soloDigitos(cliente.telefono).includes(telefono)));
      pintarTabla(porId('registro-lista-clientes'), visibles.map(cliente => [
        cliente.nombre, cliente.telefono, cliente.dia ? cliente.dia + '/' + cliente.mes : '—',
        fechaLocal.format(new Date(cliente.fecha)), cliente.origen, cliente.consentimiento ? 'Sí' : 'No',
        cliente.activo ? 'Activo' : 'Inactivo'
      ]));
      porId('registro-sin-clientes').hidden = visibles.length > 0;
      const nombres = new Map(clientes.map(cliente => [cliente.id, cliente.nombre]));
      pintarTabla(porId('registro-lista-solicitudes'), solicitudes.map(solicitud => [
        nombres.get(solicitud.clienteId) ?? 'Cliente no disponible',
        solicitud.comentario ? solicitud.busqueda + ' · ' + solicitud.comentario : solicitud.busqueda,
        solicitud.categoria || '—', fechaLocal.format(new Date(solicitud.fecha)), controlEstado(solicitud)
      ]));
      porId('registro-sin-solicitudes').hidden = solicitudes.length > 0;
    } catch {
      aviso.textContent = 'No se pudieron consultar los datos de prueba de este navegador.';
    }
  }

  alGuardar(formulario, async (valores, mensaje) => {
    await datosClientes.registrarCliente(valores, 'WhatsApp manual');
    formulario.reset();
    filtro.value = '';
    await actualizar();
    mensaje.textContent = 'Cliente de prueba guardado.';
  });
  filtro.addEventListener('input', actualizar);
  window.addEventListener('storage', evento => {
    if (datosClientes.esCambioLocal(evento)) actualizar();
  });
  actualizar();
}

if (window.ENTORNO?.ambiente === 'staging') {
  const alta = porId('alta-publica');
  const admin = porId('registro-clientes-admin');
  if (alta) iniciarRegistro(alta);
  if (admin) iniciarAdministracion(admin);
}
