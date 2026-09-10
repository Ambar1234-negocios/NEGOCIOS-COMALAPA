// Categorías compartidas por la página y el panel. Los identificadores no cambian al renombrar.
(() => {
  const base = [
  {
    "id": "streaming",
    "nombre": "Streaming y tecnología"
  },
  {
    "id": "construccion",
    "nombre": "Construcción y materiales"
  },
  {
    "id": "comida",
    "nombre": "Comida y restaurantes"
  },
  {
    "id": "salud",
    "nombre": "Salud y farmacias"
  },
  {
    "id": "hoteles",
    "nombre": "Hoteles y hospedaje"
  },
  {
    "id": "automotriz",
    "nombre": "Talleres y refacciones"
  },
  {
    "id": "servicios",
    "nombre": "Servicios para el hogar"
  },
  {
    "id": "belleza",
    "nombre": "Belleza y estética"
  },
  {
    "id": "mandaditos",
    "nombre": "Mandaditos"
  },
  {
    "id": "comercios",
    "nombre": "Comercios"
  },
  {
    "id": "profesionales",
    "nombre": "Profesionistas"
  },
  {
    "id": "bienesraices",
    "nombre": "Casas y terrenos"
  },
  {
    "id": "veterinarias",
    "nombre": "Veterinarias"
  },
  {
    "id": "agua",
    "nombre": "Purificadoras de agua"
  }
];
  const clave = 'exhibicionCategorias';
  const normalizar = texto => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  function validar(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.filter(c => c && typeof c.id === 'string' && /^[a-z][a-z0-9-]{0,59}$/.test(c.id) && !['constructor','prototype','__proto__'].includes(c.id) && typeof c.nombre === 'string' && c.nombre.trim().length > 0 && c.nombre.trim().length <= 70)
      .map(c => ({ id: c.id, nombre: c.nombre.trim() }));
  }
  function leerLocales() {
    try { return validar(JSON.parse(localStorage.getItem(clave) || '[]')); }
    catch { return []; }
  }
  let publicados = [];
  let locales = leerLocales();
  function obtener() {
    const mapa = new Map();
    [...base, ...publicados, ...locales].forEach(c => mapa.set(c.id, {...c}));
    return Array.from(mapa.values());
  }
  function guardar(nombre, idExistente = '') {
    nombre = String(nombre).trim().replace(/\s+/g, ' ');
    if (!nombre || nombre.length > 70) throw Error('Escribe un nombre de 1 a 70 caracteres.');
    const lista = obtener();
    if (lista.some(c => normalizar(c.nombre) === normalizar(nombre) && c.id !== idExistente)) throw Error('Ya existe una categoría con ese nombre.');
    let id = idExistente;
    if (id && !lista.some(c => c.id === id)) throw Error('La categoría no existe.');
    if (!id) {
      const raiz = ('cat-' + normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/-+$/,'')).slice(0,50);
      id = raiz;
      let numero = 2;
      while (lista.some(c => c.id === id)) id = raiz + '-' + numero++;
    }
    const nueva = {id, nombre};
    const cambios = [...locales.filter(c => c.id !== id), nueva];
    // Si el navegador no puede guardar, se informa antes de modificar la interfaz.
    localStorage.setItem(clave, JSON.stringify(cambios));
    locales = cambios;
    window.dispatchEvent(new Event('categorias-actualizadas'));
    return nueva;
  }
  const api = window.CategoriasExhibicion = {obtener, guardar, normalizar};
  api.lista = (async () => {
    try {
      const respuesta = await fetch('categorias.json?v=' + Date.now(), {cache: 'no-store'});
      if (!respuesta.ok) throw Error('No disponible');
      publicados = validar(await respuesta.json());
    } catch { /* Se conservan las categorías base y los cambios locales. */ }
    window.dispatchEvent(new Event('categorias-actualizadas'));
    return obtener();
  })();
})();
