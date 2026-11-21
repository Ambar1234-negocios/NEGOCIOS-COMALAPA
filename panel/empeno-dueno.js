(() => {
  'use strict';

  const panel = el('panel');
  const editor = nodo('section', undefined, 'empeno-editor');
  editor.id = 'vista-empeno';
  editor.hidden = true;
  panel.prepend(editor);
  const {dias: diasPublicos, foto} = window.EmpenoExhibicion;
  const camposPerfil = {
    nombre: 'Nombre', rubro: 'Rubro', descripcion: 'Descripción', telefono: 'Teléfono',
    whatsapp: 'WhatsApp', direccion: 'Dirección', facebook: 'Nombre en Facebook',
    tiktok: 'Nombre en TikTok', instagram: 'Nombre en Instagram',
    cotizar_texto: 'Texto del botón de cotización', cotizar_mensaje: 'Mensaje de cotización en WhatsApp',
    catalogo_texto: 'Texto del botón para ver el catálogo'
  };
  let perfil, categorias, articulos;

  function campo(form, nombre, etiqueta, valor, opciones = {}) {
    const label = nodo('label', etiqueta);
    const input = typeof opciones === 'string' ? nodo(opciones) : nodo('input');
    Object.assign(input, typeof opciones === 'string' ? {} : opciones, {name: nombre});
    if (input.type === 'checkbox') input.checked = Boolean(valor);
    else input.value = valor ?? '';
    label.append(input);
    form.append(label);
    return input;
  }

  function selector(form, nombre, etiqueta, valor, opciones) {
    const input = campo(form, nombre, etiqueta, '', 'select');
    for (const [id, texto] of opciones) {
      const option = nodo('option', texto);
      option.value = id;
      input.append(option);
    }
    input.value = valor;
    input.required = true;
    return input;
  }

  function boton(texto, fn) {
    const b = nodo('button', texto, 'secundario');
    b.type = 'button';
    b.onclick = fn;
    return b;
  }

  function formulario(contenedor, texto, guardar, actualizar = true) {
    const form = nodo('form');
    const estado = nodo('p');
    estado.setAttribute('role', 'status');
    form.onsubmit = e => {
      e.preventDefault();
      tarea(async () => {
        estado.textContent = '';
        try {
          await guardar(new FormData(form));
          if (actualizar) await cargarDatos();
          else estado.textContent = 'Cambios publicados.';
          aviso('Cambios publicados.');
        } catch (error) {
          estado.textContent = error.message;
          throw error;
        }
      });
    };
    contenedor.append(form);
    const finalizar = () => form.append(nodo('button', texto), estado);
    return {form, finalizar};
  }

  function cambiar(tabla, method, datos, id) {
    const slug = encodeURIComponent(perfil.slug);
    const filtro = tabla === 'empeno_perfiles' ? '?slug=eq.' + slug :
      id ? '?negocio=eq.' + slug + '&id=eq.' + encodeURIComponent(id) : '';
    return api('/rest/v1/' + tabla + filtro, {method, datos}).then(filas => {
      if (!filas?.length) throw Error('No se guardó el cambio. Actualiza el panel e inténtalo de nuevo.');
      return filas[0];
    });
  }

  function editarPerfil() {
    const seccion = nodo('section', undefined, 'tarjeta');
    seccion.append(nodo('h3', 'Datos públicos del negocio'));
    const {form, finalizar} = formulario(seccion, 'Publicar datos del negocio', async datos => {
      const cambios = Object.fromEntries(Object.keys(camposPerfil).map(key => [key, datos.get(key).trim()]));
      cambios.horarios = diasPublicos.map((_, i) => datos.get('horario' + i).trim());
      const guardado = await cambiar('empeno_perfiles', 'PATCH', cambios);
      perfil = guardado;
      editor.querySelector('h2').textContent = perfil.nombre;
    }, false);
    for (const [key, texto] of Object.entries(camposPerfil)) {
      const control = campo(form, key, texto, perfil[key], key === 'descripcion' ? 'textarea' : {});
      control.required = ['nombre', 'rubro', 'telefono', 'whatsapp', 'cotizar_texto', 'cotizar_mensaje', 'catalogo_texto'].includes(key);
      control.maxLength = ({nombre:120, rubro:100, descripcion:2000, telefono:10, whatsapp:10,
        cotizar_texto:100, cotizar_mensaje:500, catalogo_texto:100})[key] || 200;
      if (key === 'telefono' || key === 'whatsapp') {
        control.type = 'tel';
        control.pattern = '[0-9]{10}';
        control.inputMode = 'numeric';
      }
    }
    form.append(nodo('h4', 'Horario de atención'));
    diasPublicos.forEach((dia, i) => campo(form, 'horario' + i, dia, perfil.horarios[i], {required: true, maxLength: 80}));
    finalizar();
    return seccion;
  }

  function categoriaForm(seccion, categoria) {
    const {form, finalizar} = formulario(seccion, categoria.id ? 'Guardar categoría' : 'Crear categoría', datos => {
      const cambios = {nombre: datos.get('nombre').trim(), visible: datos.has('visible'), orden: Number(datos.get('orden'))};
      return categoria.id ? cambiar('empeno_categorias', 'PATCH', cambios, categoria.id) :
        cambiar('empeno_categorias', 'POST', {...cambios, negocio: perfil.slug});
    });
    campo(form, 'nombre', 'Nombre de categoría', categoria.nombre, {required: true, maxLength: 80});
    campo(form, 'orden', 'Posición (los números menores aparecen primero)', categoria.orden,
      {type: 'number', min: 0, max: 2147483647, required: true});
    campo(form, 'visible', 'Mostrar en el perfil público', categoria.visible, {type: 'checkbox'});
    finalizar();
    if (categoria.id) form.append(boton('Eliminar categoría', () => {
      if (articulos.some(a => a.categoria === categoria.id)) {
        aviso('Mueve los artículos a otra categoría antes de eliminarla.');
        return;
      }
      if (!confirm('¿Eliminar la categoría «' + categoria.nombre + '»?')) return;
      tarea(async () => {
        await cambiar('empeno_categorias', 'DELETE', undefined, categoria.id);
        await cargarDatos();
        aviso('Categoría eliminada.');
      });
    }));
  }

  function gestionarCategorias() {
    const seccion = nodo('section', undefined, 'tarjeta');
    seccion.append(nodo('h3', 'Categorías del catálogo'));
    for (const categoria of categorias) {
      const detalle = nodo('details');
      detalle.append(nodo('summary', categoria.nombre + (categoria.visible ? '' : ' · Oculta')));
      categoriaForm(detalle, categoria);
      seccion.append(detalle);
    }
    const nueva = nodo('details');
    nueva.append(nodo('summary', 'Nueva categoría'));
    categoriaForm(nueva, {orden: (categorias.at(-1)?.orden || 0) + 1, visible: true});
    seccion.append(nueva);
    return seccion;
  }

  function articuloForm(seccion, articulo) {
    const fotos = articulo.fotos.map(nombre => ({nombre}));
    const tipoFoto = 'image/jpeg,image/png,image/webp';
    const {form, finalizar} = formulario(seccion, articulo.id ? 'Guardar artículo' : 'Crear artículo', async datos => {
      const precio = datos.get('precio');
      const cambios = {
        nombre: datos.get('nombre').trim(), categoria: datos.get('categoria'),
        descripcion: datos.get('descripcion').trim(), precio_centavos: precio === '' ? null : pesos(precio),
        estado: datos.get('estado'), pausado: datos.has('pausado'), consultar: datos.has('consultar')
      };
      if (!cambios.nombre) throw Error('Escribe el nombre del artículo.');
      for (const f of fotos) {
        if (f.nombre) continue;
        const blob = await comprimir(f.archivo);
        const nombre = crypto.randomUUID() + '.webp';
        await api('/storage/v1/object/empeno-fotos/' + encodeURIComponent(perfil.slug) + '/' + nombre,
          {method: 'POST', datos: blob});
        f.nombre = nombre;
      }
      cambios.fotos = fotos.map(f => f.nombre);
      return articulo.id ? cambiar('empeno_articulos', 'PATCH', cambios, articulo.id) :
        cambiar('empeno_articulos', 'POST', {...cambios, negocio: perfil.slug});
    });
    campo(form, 'nombre', 'Nombre', articulo.nombre, {required: true, maxLength: 120});
    selector(form, 'categoria', 'Categoría', articulo.categoria || categorias[0]?.id,
      categorias.map(c => [c.id, c.nombre + (c.visible ? '' : ' · Oculta')]));
    campo(form, 'descripcion', 'Descripción (opcional)', articulo.descripcion, 'textarea').maxLength = 2000;
    campo(form, 'precio', 'Precio en pesos (opcional)', articulo.precio_centavos == null ? '' : articulo.precio_centavos / 100,
      {type: 'number', min: 0, max: 1000000, step: '.01'});
    selector(form, 'estado', 'Estado', articulo.estado, ['Disponible', 'Apartado', 'Vendido'].map(x => [x, x]));
    campo(form, 'pausado', 'Pausar y ocultar del catálogo', articulo.pausado, {type: 'checkbox'});
    campo(form, 'consultar', 'Mostrar botón de consulta por WhatsApp', articulo.consultar, {type: 'checkbox'});
    const cargar = campo(form, 'fotos_nuevas', 'Agregar fotos (hasta 10)', '', {type: 'file', accept: tipoFoto, multiple: true});
    const lista = nodo('div');
    form.append(lista);
    function pintarFotos() {
      lista.replaceChildren();
      fotos.forEach((item, i) => {
        const fila = nodo('div', undefined, 'empeno-foto-fila');
        if (item.nombre) {
          const img = nodo('img');
          img.src = foto(perfil.slug, item.nombre);
          img.alt = 'Foto ' + (i + 1);
          img.loading = 'lazy';
          fila.append(img);
        } else fila.append(nodo('span', item.archivo.name));
        for (const [texto, paso] of [['Subir', -1], ['Bajar', 1]]) {
          const control = boton(texto, () => {
            [fotos[i], fotos[i + paso]] = [fotos[i + paso], fotos[i]];
            pintarFotos();
            lista.children[i + paso]?.querySelectorAll('button')[paso === -1 ? 0 : 1]?.focus();
          });
          control.disabled = i + paso < 0 || i + paso >= fotos.length;
          control.setAttribute('aria-label', texto + ' foto ' + (i + 1));
          fila.append(control);
        }
        const quitar = boton('Quitar', () => { fotos.splice(i, 1); pintarFotos(); cargar.focus(); });
        quitar.setAttribute('aria-label', 'Quitar foto ' + (i + 1));
        fila.append(quitar);
        lista.append(fila);
      });
    }
    cargar.onchange = () => {
      const nuevas = [...cargar.files];
      cargar.value = '';
      if (nuevas.length + fotos.length > 10) {
        aviso('Puedes guardar hasta 10 fotos por artículo.');
        return;
      }
      fotos.push(...nuevas.map(archivo => ({archivo})));
      pintarFotos();
    };
    pintarFotos();
    finalizar();
  }

  function gestionarArticulos() {
    const seccion = nodo('section', undefined, 'tarjeta');
    seccion.append(nodo('h3', 'Artículos del catálogo'));
    for (const articulo of articulos) {
      const detalle = nodo('details');
      const estado = articulo.estado + (articulo.pausado ? ' · Pausado' : '');
      detalle.append(nodo('summary', articulo.nombre + ' · ' + estado));
      articuloForm(detalle, articulo);
      seccion.append(detalle);
    }
    if (!articulos.length) seccion.append(nodo('p', 'Todavía no has creado artículos.'));
    if (!categorias.length) seccion.append(nodo('p', 'Crea una categoría para agregar artículos.'));
    else {
      const nuevo = nodo('details');
      nuevo.append(nodo('summary', 'Nuevo artículo'));
      articuloForm(nuevo, {fotos: [], estado: 'Disponible', consultar: true});
      seccion.append(nuevo);
    }
    return seccion;
  }

  async function cargarDatos() {
    const filtro = '?negocio=eq.' + encodeURIComponent(perfil.slug);
    [categorias, articulos] = await Promise.all([
      api('/rest/v1/empeno_categorias' + filtro + '&order=orden,nombre,id'),
      api('/rest/v1/empeno_articulos' + filtro + '&order=nombre,id')
    ]);
    const cabecera = nodo('header', undefined, 'tarjeta');
    const acciones = nodo('div', undefined, 'empeno-controles');
    const enlace = nodo('a', 'Ver perfil público', 'enlace-boton');
    enlace.href = '/?negocio=' + encodeURIComponent(perfil.slug);
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    if (desdeAdministracion) {
      const volver = nodo('a', 'Volver a Administrar página', 'enlace-boton');
      volver.href = 'gestion.html#negocios';
      acciones.append(volver);
    }
    acciones.append(enlace, boton('Actualizar', () => tarea(cargarMenuCompleto)),
      boton('Salir', () => el('salir').onclick()));
    cabecera.append(nodo('h2', perfil.nombre), nodo('p', (desdeAdministracion ? 'Administración: ' : 'Cuenta: ') + cuenta.user.email), acciones);
    editor.replaceChildren(cabecera, editarPerfil(), gestionarCategorias(), gestionarArticulos());
  }

  const cargarMenuOriginal = cargarMenuCompleto;
  cargarMenuCompleto = async () => {
    if (!cuenta) return;
    if (desdeAdministracion && await api('/rest/v1/rpc/piloto_es_admin', {method: 'POST', datos: {}}) !== true) {
      throw Error('Esta cuenta no tiene acceso a la administración.');
    }
    const solicitado = new URLSearchParams(location.search).get('negocio');
    const perfiles = await api('/rest/v1/rpc/empeno_mis_perfiles', {method: 'POST', datos: {}})
      .catch(error => { if (error.estadoHTTP === 404) return []; throw error; });
    perfil = perfiles.find(p => p.slug === solicitado);
    if (!perfil && perfiles.length) {
      const menus = await api('/rest/v1/rpc/dueno_menus_listar_v53', {method: 'POST', datos: {}});
      if (!menus.length) perfil = perfiles[0];
    }
    if (!perfil) {
      editor.hidden = true;
      panel.classList.remove('panel-empeno');
      return cargarMenuOriginal();
    }
    await cargarDatos();
    editor.hidden = false;
    panel.classList.add('panel-empeno');
    document.querySelector('body > header h1').textContent = 'Mi casa de empeño y tienda';
    document.querySelector('body > header p').textContent = 'Administra la información pública y tu catálogo de artículos.';
  };

  const salirOriginal = el('salir').onclick;
  el('salir').onclick = async () => {
    await salirOriginal();
    if (cuenta) return;
    editor.replaceChildren();
    editor.hidden = true;
    panel.classList.remove('panel-empeno');
    document.querySelector('body > header h1').textContent = 'Mi negocio';
    document.querySelector('body > header p').textContent = 'Entra con el correo autorizado para administrar tu negocio.';
  };
})();
