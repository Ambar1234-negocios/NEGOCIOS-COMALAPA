(() => {
  'use strict';
  const base = 'https://gyvoyzxsgckpfkagzjtf.supabase.co';
  const key = 'sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dinero = new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'});
  const foto = (slug, nombre) => base + '/storage/v1/object/public/empeno-fotos/' +
    encodeURIComponent(slug) + '/' + encodeURIComponent(nombre);

  async function leer(ruta) {
    const respuesta = await fetch(base + '/rest/v1/' + ruta, {
      headers: {apikey: key}, cache: 'no-store', signal: AbortSignal.timeout(7000)
    });
    if (!respuesta.ok) throw Error('No se pudo cargar el catálogo.');
    return respuesta.json();
  }

  function nodo(tag, texto, clase) {
    const n = document.createElement(tag);
    if (texto != null) n.textContent = texto;
    if (clase) n.className = clase;
    return n;
  }

  function whatsapp(negocio, texto, mensaje) {
    const a = nodo('a', texto, 'accion accion-whatsapp');
    a.href = 'https://wa.me/52' + negocio.whatsapp + '?text=' + encodeURIComponent(mensaje);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function articulo(negocio, item) {
    const tarjeta = nodo('article', null, 'empeno-articulo');
    tarjeta.append(nodo('h5', item.nombre));
    if (item.estado === 'Apartado') tarjeta.append(nodo('strong', 'Apartado', 'empeno-apartado'));
    if (item.fotos.length) {
      const galeria = nodo('div', null, 'empeno-fotos');
      galeria.tabIndex = 0;
      galeria.setAttribute('aria-label', 'Fotos de ' + item.nombre);
      item.fotos.forEach((f, i) => {
        const img = nodo('img');
        img.src = foto(negocio.slug, f);
        img.alt = item.nombre + ' · foto ' + (i + 1);
        img.loading = 'lazy';
        galeria.append(img);
      });
      tarjeta.append(galeria);
    }
    if (item.descripcion) tarjeta.append(nodo('p', item.descripcion));
    tarjeta.append(nodo('p', item.precio_centavos == null ? 'Consultar precio' : dinero.format(item.precio_centavos / 100)));
    if (item.consultar) tarjeta.append(whatsapp(negocio, 'Consultar por WhatsApp',
      'Hola, quisiera información sobre ' + item.nombre + '.'));
    return tarjeta;
  }

  async function catalogo(zona, negocio) {
    try {
      const filtro = 'negocio=eq.' + encodeURIComponent(negocio.slug);
      const [categorias, articulos] = await Promise.all([
        leer('empeno_categorias?' + filtro + '&visible=eq.true&order=orden,nombre,id'),
        leer('empeno_articulos?' + filtro + '&pausado=eq.false&estado=neq.Vendido&order=nombre,id')
      ]);
      const contenido = document.createDocumentFragment();
      for (const c of categorias) {
        const seccion = nodo('section', null, 'catalogo-seccion');
        seccion.append(nodo('h4', c.nombre));
        const items = articulos.filter(a => a.categoria === c.id);
        if (!items.length) seccion.append(nodo('p', 'Sin artículos disponibles por el momento'));
        else {
          const fila = nodo('div', null, 'catalogo-fila empeno-articulos');
          fila.tabIndex = 0;
          fila.setAttribute('aria-label', c.nombre);
          fila.append(...items.map(a => articulo(negocio, a)));
          seccion.append(fila);
        }
        contenido.append(seccion);
      }
      if (!categorias.length) contenido.append(nodo('p', 'Sin artículos disponibles por el momento'));
      zona.replaceChildren(contenido);
    } catch (e) {
      zona.textContent = e.message;
    }
  }

  function renderizar(destino, negocio, volver) {
    const perfil = nodo('article', null, 'perfil-negocio perfil-oficial empeno-perfil');
    const regreso = nodo('button', '← Volver a la categoría', 'btn-regresar-perfil');
    regreso.onclick = volver;
    const cabecera = nodo('header', null, 'empeno-cabecera');
    if (negocio.logo) {
      const logo = nodo('img', null, 'empeno-logo');
      logo.src = foto(negocio.slug, negocio.logo);
      logo.alt = 'Foto de perfil de ' + negocio.nombre;
      cabecera.append(logo);
    }
    const encabezado = nodo('h3', negocio.nombre);
    if (negocio.verificado) {
      encabezado.append(' ', nodo('small', '✓ Negocio verificado'));
    }
    cabecera.append(nodo('p', negocio.rubro), encabezado, nodo('p', negocio.descripcion));
    const acciones = nodo('div', null, 'empeno-acciones');
    const seccion = nodo('section', null, 'catalogo-visual empeno-catalogo');
    const titulo = nodo('h4', 'Catálogo de artículos');
    titulo.tabIndex = -1;
    const ver = nodo('button', negocio.catalogo_texto, 'accion');
    ver.type = 'button';
    ver.onclick = () => {
      titulo.focus({preventScroll: true});
      titulo.scrollIntoView({block: 'start'});
    };
    acciones.append(whatsapp(negocio, negocio.cotizar_texto, negocio.cotizar_mensaje), ver);
    const llamar = nodo('a', 'Llamar al ' + negocio.telefono, 'accion');
    llamar.href = 'tel:+52' + negocio.telefono;
    acciones.append(llamar);
    cabecera.append(acciones);

    const datos = nodo('div', null, 'perfil-detalles-oficial');
    const ubicacion = nodo('section', null, 'detalle-card');
    ubicacion.append(nodo('h4', 'Dirección'), nodo('p', negocio.direccion));
    const horario = nodo('section', null, 'detalle-card');
    const lista = nodo('ul');
    negocio.horarios.forEach((h, i) => lista.append(nodo('li', dias[i] + ' · ' + h)));
    horario.append(nodo('h4', 'Horario de atención'), lista);
    datos.append(ubicacion, horario);
    const redes = nodo('section', null, 'detalle-card');
    redes.append(nodo('h4', 'Redes sociales'));
    for (const [campo, nombre] of [['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['instagram', 'Instagram']]) {
      if (negocio[campo]) redes.append(nodo('p', nombre + ' · ' + negocio[campo]));
    }
    if (redes.childElementCount > 1) datos.append(redes);

    const zona = nodo('div', 'Cargando artículos…');
    zona.setAttribute('aria-live', 'polite');
    seccion.append(titulo, zona);
    perfil.append(regreso);
    if (negocio.banner) {
      const portada = nodo('img', null, 'empeno-portada');
      portada.src = foto(negocio.slug, negocio.banner);
      portada.alt = 'Portada de ' + negocio.nombre;
      perfil.append(portada);
    }
    perfil.append(cabecera, datos, seccion);
    destino.replaceChildren(perfil);
    perfil.scrollIntoView({block: 'start'});
    catalogo(zona, negocio);
  }

  window.EmpenoExhibicion = {
    dias, foto, renderizar,
    async perfiles() {
      const filas = await leer('empeno_perfiles?activo=eq.true&order=nombre');
      return filas.map(p => ({
        slug: p.slug, nombre: p.nombre, descripcion: p.descripcion, slogan: p.rubro,
        logo: p.logo ? foto(p.slug,p.logo) : '', banner: p.banner ? foto(p.slug,p.banner) : '',
        categoria: p.categoria, verificado: p.verificado, tipoCatalogo: 'empeno', empeno: p
      }));
    }
  };
})();
