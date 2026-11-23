const base = 'https://gyvoyzxsgckpfkagzjtf.supabase.co';
const clavePublica = 'sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const porId = id => document.getElementById(id);
const mensajeWhatsApp = 'Hola 👋 Ya me registré en Exhibición Frontera Comalapa para recibir promociones, novedades y beneficios por WhatsApp.';
const whatsappMandaditos = 'https://api.whatsapp.com/send?phone=529632708883&text=' + encodeURIComponent(mensajeWhatsApp);

function opciones(lista, etiqueta) {
  return '<option value="">' + etiqueta + '</option>' +
    lista.map((texto, indice) => '<option value="' + (indice + 1) + '">' + texto + '</option>').join('');
}

async function insertar(registro) {
  const respuesta = await fetch(base + '/rest/v1/registro_publico_clientes', {
    method: 'POST',
    headers: { apikey: clavePublica, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(registro)
  });
  if (respuesta.status === 409) {
    const error = await respuesta.json();
    if (error.code === '23505') {
      return { duplicado: error.message.includes('"registro_publico_un_whatsapp"') };
    }
  }
  if (!respuesta.ok) throw new Error('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
  return { duplicado: false };
}

function alEnviar(formulario, guardar) {
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
      aviso.textContent = error instanceof TypeError ? 'Sin conexión. Inténtalo nuevamente.' : error.message;
      boton.disabled = false;
    }
  });
}

if (window.ENTORNO?.ambiente !== 'staging' && location.hostname === 'exhibicionfronteracomalapa.com') {
  function mostrarConfirmacion(duplicado) {
    porId('registro-formulario').hidden = true;
    const confirmacion = porId('registro-confirmacion');
    porId('registro-duplicado').hidden = !duplicado;
    porId('registro-whatsapp').href = whatsappMandaditos;
    confirmacion.hidden = false;
    confirmacion.querySelector('h2').focus();
  }

  if (history.state?.registroGuardado) {
    mostrarConfirmacion(history.state.duplicado);
  } else {
    iniciarRegistro();
  }

  function iniciarRegistro() {
    const formulario = porId('alta-publica');
    const clienteId = crypto.randomUUID();
    formulario.innerHTML = `
      <label>Nombre<input name="nombre" autocomplete="name" required maxlength="100"></label>
      <label>WhatsApp<input name="telefono" type="tel" autocomplete="tel" required maxlength="24"></label>
      <div class="registro-cumple" role="group" aria-label="Cumpleaños">
        <label>Día<select name="dia" required>${opciones(Array.from({length: 31}, (_, i) => i + 1), 'Día')}</select></label>
        <label>Mes<select name="mes" required>${opciones(meses, 'Mes')}</select></label>
      </div>
      <p class="registro-nota">El día y mes de tu cumpleaños se utilizarán para ofrecerte beneficios o promociones de cumpleaños cuando estén disponibles.</p>
      <label class="registro-consentimiento"><input type="checkbox" name="consentimiento" required>
        <span>Acepto registrarme voluntariamente para recibir promociones, novedades y beneficios de Exhibición Frontera Comalapa por WhatsApp. Puedo dejar de participar cuando quiera.</span>
      </label>
      <a href="/aviso-privacidad.html">Aviso de privacidad</a>
      <button>Registrarme y confirmar por WhatsApp</button>
      <p class="registro-nota">Al registrarte, se abrirá WhatsApp con un mensaje de confirmación listo para enviar.</p>
      <p role="status"></p>`;
    porId('registro-formulario').hidden = false;
    alEnviar(formulario, async valores => {
      const nombre = valores.get('nombre').trim();
      const numero = valores.get('telefono').trim();
      const telefono = numero.replace(/\D/g, '');
      const dia = Number(valores.get('dia'));
      const mes = Number(valores.get('mes'));
      const limite = [31,29,31,30,31,30,31,31,30,31,30,31][mes - 1];
      if (!nombre || !/^[+\d ().-]+$/.test(numero) || !/^\d{10,15}$/.test(telefono)) {
        throw new Error('Escribe tu nombre y un número de WhatsApp válido.');
      }
      if (!(dia >= 1 && dia <= limite)) throw new Error('Selecciona un día y un mes válidos.');
      const resultado = await insertar({
        id: clienteId, nombre, telefono, dia, mes, consentimiento: valores.has('consentimiento')
      });
      formulario.reset();
      mostrarConfirmacion(resultado.duplicado);
      history.replaceState({ ...history.state, registroGuardado: true, duplicado: resultado.duplicado }, '');
      location.assign(whatsappMandaditos);
    });
  }
}
