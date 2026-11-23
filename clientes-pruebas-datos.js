const prefijo = 'exhibicion:staging:registro:v1:';
export const estados = ['Nueva', 'Buscando', 'Cotizando', 'Opción encontrada', 'Cliente informado', 'Finalizada'];
export const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const soloDigitos = valor => valor.replace(/\D/g, '');

function telefonoComparable(valor) {
  const digitos = soloDigitos(valor);
  return /^52(?:1)?\d{10}$/.test(digitos) ? digitos.slice(-10) : digitos;
}

function clave(tipo, id) {
  return prefijo + tipo + ':' + id;
}

function guardar(tipo, datos) {
  localStorage.setItem(clave(tipo, datos.id), JSON.stringify(datos));
  return datos;
}

function listar(tipo) {
  const inicio = clave(tipo, '');
  return Object.keys(localStorage)
    .filter(llave => llave.startsWith(inicio))
    .map(llave => JSON.parse(localStorage.getItem(llave)))
    .filter(Boolean)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Las vistas usan esta interfaz asíncrona para poder sustituir el almacenamiento local.
export const datosClientes = {
  async registrarCliente(formulario, origen) {
    const nombre = formulario.get('nombre').trim();
    const telefono = formulario.get('telefono').trim();
    const dia = Number(formulario.get('dia'));
    const mes = Number(formulario.get('mes'));
    const consentimiento = formulario.has('consentimiento');
    if (!nombre || !/^[+\d ().-]+$/.test(telefono) || !/^\d{10,15}$/.test(soloDigitos(telefono))) {
      throw new Error('Escribe un nombre y un WhatsApp de prueba de 10 a 15 dígitos.');
    }
    const limite = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];
    if ((dia || mes || origen === 'Registro web') && !(dia >= 1 && dia <= limite)) {
      throw new Error('Selecciona un día y un mes de cumpleaños válidos.');
    }
    if (!consentimiento) throw new Error('Confirma el consentimiento para guardar el registro.');
    const web = origen === 'Registro web';
    const telefonoNormalizado = telefonoComparable(telefono);
    if (web) {
      const existente = listar('cliente').find(cliente =>
        cliente.origen === origen && telefonoComparable(cliente.telefono) === telefonoNormalizado
      );
      if (existente) return existente;
    }
    const fecha = new Date().toISOString();
    return guardar('cliente', {
      id: web ? 'web-' + telefonoNormalizado : crypto.randomUUID(),
      nombre, telefono, dia: dia || null, mes: mes || null,
      fecha, origen, consentimiento, activo: true
    });
  },

  async registrarSolicitud(clienteId, formulario) {
    const busqueda = formulario.get('busqueda').trim();
    if (!busqueda) throw new Error('Escribe qué estás buscando.');
    if (!localStorage.getItem(clave('cliente', clienteId))) {
      throw new Error('Repite el registro para guardar tu solicitud.');
    }
    return guardar('solicitud', {
      id: crypto.randomUUID(), clienteId, busqueda,
      categoria: formulario.get('categoria').trim(), comentario: formulario.get('comentario').trim(),
      fecha: new Date().toISOString(), estado: estados[0]
    });
  },

  async listarClientes() { return listar('cliente'); },
  async listarSolicitudes() { return listar('solicitud'); },

  async cambiarEstado(id, estado) {
    const solicitud = JSON.parse(localStorage.getItem(clave('solicitud', id)));
    if (!solicitud || !estados.includes(estado)) throw new Error('No se pudo cambiar el estado.');
    return guardar('solicitud', { ...solicitud, estado });
  },

  esCambioLocal(evento) {
    return evento.storageArea === localStorage && (evento.key === null || evento.key.startsWith(prefijo));
  }
};
