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

  function whatsapp(negocio, texto, mensaje, clase) {
    const enlace = nodo('a', texto, clase);
    enlace.href = 'https://wa.me/52' + negocio.whatsapp + '?text=' + encodeURIComponent(mensaje);
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    return enlace;
  }

  function boton(texto, clase) {
    const b = nodo('button', texto, clase);
    b.type = 'button';
    return b;
  }

  function avanzar(fila, indice, movimiento = 'instant') {
    fila.scrollTo({left: indice * fila.clientWidth, behavior: movimiento});
  }

  function galeriaFotos(negocio, item, ampliar) {
    const marco = nodo('div', null, 'empeno-galeria');
    const fila = nodo('div', null, 'empeno-fotos');
    fila.setAttribute('aria-label', 'Fotos de ' + item.nombre);
    item.fotos.forEach((nombre, indice) => {
      const img = nodo('img');
      img.src = foto(negocio.slug, nombre);
      img.alt = item.nombre + ' · foto ' + (indice + 1);
      img.loading = ampliar ? 'lazy' : 'eager';
      if (ampliar) {
        const abrir = boton(null, 'empeno-abrir-foto');
        abrir.setAttribute('aria-label', 'Ampliar foto ' + (indice + 1) + ' de ' + item.nombre);
        abrir.onclick = () => ampliar(indice, abrir);
        abrir.append(img);
        fila.append(abrir);
      } else {
        fila.append(img);
      }
    });
    if (!ampliar && item.fotos.length > 1) fila.tabIndex = 0;
    marco.append(fila);
    if (item.fotos.length < 2) return {marco, fila};

    const anterior = boton('‹', 'empeno-foto-flecha');
    const siguiente = boton('›', 'empeno-foto-flecha');
    const contador = nodo('span');
    anterior.setAttribute('aria-label', 'Foto anterior');
    siguiente.setAttribute('aria-label', 'Foto siguiente');
    contador.setAttribute('aria-live', 'polite');
    const actual = () => Math.round(fila.scrollLeft / (fila.clientWidth || 1));
    const actualizar = () => {
      const indice = actual();
      contador.textContent = (indice + 1) + ' / ' + item.fotos.length;
      anterior.disabled = indice === 0;
      siguiente.disabled = indice === item.fotos.length - 1;
    };
    const mover = paso => avanzar(fila, Math.max(0, Math.min(item.fotos.length - 1, actual() + paso)),
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
    anterior.onclick = () => mover(-1);
    siguiente.onclick = () => mover(1);
    fila.addEventListener('scroll', actualizar, {passive: true});
    marco.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      mover(e.key === 'ArrowLeft' ? -1 : 1);
    });
    const controles = nodo('div', null, 'empeno-galeria-controles');
    controles.append(anterior, contador, siguiente);
    marco.append(controles);
    actualizar();
    return {marco, fila};
  }

  function ampliarFotos(negocio, item, indice, origen) {
    const dialogo = nodo('dialog', null, 'empeno-visor');
    dialogo.setAttribute('aria-label', 'Fotos de ' + item.nombre);
    const cerrar = boton('Cerrar', 'empeno-cerrar');
    cerrar.autofocus = true;
    cerrar.onclick = () => dialogo.close();
    const cabecera = nodo('div', null, 'empeno-visor-cabecera');
    cabecera.append(nodo('h4', item.nombre), cerrar);
    const {marco, fila} = galeriaFotos(negocio, item);
    dialogo.append(cabecera, marco);
    if (item.consultar) dialogo.append(consultaArticulo(negocio, item));
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      origen.focus({preventScroll: true});
    }, {once: true});
    dialogo.addEventListener('click', e => {
      if (e.target === dialogo) dialogo.close();
    });
    document.body.append(dialogo);
    dialogo.showModal();
    avanzar(fila, indice);
  }

  function consultaArticulo(negocio, item) {
    return whatsapp(negocio, 'Consultar por WhatsApp', 'Hola, quisiera información sobre ' + item.nombre + '.',
      'empeno-consultar');
  }

  function articulo(negocio, item) {
    const tarjeta = nodo('article', null, 'empeno-articulo');
    if (item.fotos.length) {
      const {marco} = galeriaFotos(negocio, item, (indice, origen) => ampliarFotos(negocio, item, indice, origen));
      tarjeta.append(marco);
    }
    const cuerpo = nodo('div', null, 'empeno-articulo-datos');
    cuerpo.append(nodo('span', item.estado, item.estado === 'Apartado' ? 'empeno-estado empeno-apartado' : 'empeno-estado'));
    cuerpo.append(nodo('h6', item.nombre));
    if (item.descripcion) cuerpo.append(nodo('p', item.descripcion));
    cuerpo.append(nodo('strong', item.precio_centavos == null ? 'Consultar precio' : dinero.format(item.precio_centavos / 100),
      'empeno-precio'));
    if (item.consultar) cuerpo.append(consultaArticulo(negocio, item));
    tarjeta.append(cuerpo);
    return tarjeta;
  }

  function explorarCategorias(zona, negocio, categorias, articulos) {
    if (!categorias.length) {
      zona.replaceChildren(nodo('p', 'Sin artículos disponibles por el momento', 'empeno-vacio'));
      return;
    }

    const navegacion = nodo('div', null, 'empeno-categorias');
    navegacion.setAttribute('role', 'group');
    navegacion.setAttribute('aria-label', 'Categorías de artículos');
    const resultado = nodo('section', null, 'empeno-resultado');
    resultado.id = 'articulos-' + negocio.slug;
    const titulo = nodo('h5');
    const contenido = nodo('div');
    resultado.append(titulo, contenido);
    const botones = [];

    function mostrar(indice) {
      const categoria = categorias[indice];
      botones.forEach((b, i) => b.setAttribute('aria-pressed', String(i === indice)));
      titulo.textContent = categoria.nombre;
      const items = articulos.filter(a => a.categoria === categoria.id);
      if (!items.length) {
        contenido.replaceChildren(nodo('p', 'Sin artículos disponibles por el momento', 'empeno-vacio'));
        return;
      }
      const fila = nodo('div', null, 'empeno-articulos');
      fila.append(...items.map(item => articulo(negocio, item)));
      contenido.replaceChildren(fila);
    }

    categorias.forEach((categoria, indice) => {
      const b = boton(null, 'empeno-categoria');
      const flecha = nodo('span', '›', 'empeno-categoria-flecha');
      flecha.setAttribute('aria-hidden', 'true');
      b.append(nodo('span', categoria.nombre), flecha);
      b.setAttribute('aria-controls', resultado.id);
      b.onclick = () => mostrar(indice);
      botones.push(b);
      navegacion.append(b);
    });

    const inicial = categorias.findIndex(c => articulos.some(a => a.categoria === c.id));
    mostrar(Math.max(0, inicial));
    zona.replaceChildren(navegacion, resultado);
  }

  async function catalogo(zona, negocio) {
    try {
      const filtro = 'negocio=eq.' + encodeURIComponent(negocio.slug);
      const [categorias, articulos] = await Promise.all([
        leer('empeno_categorias?' + filtro + '&visible=eq.true&order=orden,nombre,id'),
        leer('empeno_articulos?' + filtro + '&pausado=eq.false&estado=neq.Vendido&order=nombre,id')
      ]);
      explorarCategorias(zona, negocio, categorias, articulos);
    } catch (e) {
      zona.replaceChildren(nodo('p', e.message, 'empeno-vacio'));
    }
  }

  function datosPerfil(negocio) {
    const datos = nodo('section', null, 'empeno-datos');
    datos.append(nodo('h4', 'Visítanos'));
    const grupos = nodo('div', null, 'empeno-datos-grupos');
    if (negocio.direccion) {
      const ubicacion = nodo('section', null, 'empeno-dato');
      ubicacion.append(nodo('h5', 'Dirección'), nodo('p', negocio.direccion));
      grupos.append(ubicacion);
    }
    const horario = nodo('section', null, 'empeno-dato');
    const lista = nodo('dl', null, 'empeno-horario');
    negocio.horarios.forEach((h, i) => lista.append(nodo('dt', dias[i]), nodo('dd', h)));
    horario.append(nodo('h5', 'Horario de atención'), lista);
    grupos.append(horario);
    const redes = nodo('section', null, 'empeno-dato');
    redes.append(nodo('h5', 'Redes sociales'));
    for (const [campo, nombre] of [['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['instagram', 'Instagram']]) {
      if (negocio[campo]) {
        const red = nodo('p');
        red.append(nodo('strong', nombre), ' · ' + negocio[campo]);
        redes.append(red);
      }
    }
    if (redes.childElementCount > 1) grupos.append(redes);
    datos.append(grupos);
    return datos;
  }

  function renderizar(destino, negocio, volver) {
    const perfil = nodo('article', null, 'perfil-negocio perfil-oficial empeno-perfil');
    const regreso = boton('← Volver a la categoría', 'empeno-regreso');
    regreso.onclick = volver;
    const hero = nodo('header', null, 'empeno-hero');
    if (negocio.banner) {
      const portada = nodo('img', null, 'empeno-portada');
      portada.src = foto(negocio.slug, negocio.banner);
      portada.alt = 'Portada de ' + negocio.nombre;
      hero.append(portada);
    }
    const cabecera = nodo('div', null, 'empeno-cabecera');
    if (negocio.logo) {
      const logo = nodo('img', null, 'empeno-logo');
      logo.src = foto(negocio.slug, negocio.logo);
      logo.alt = 'Foto de perfil de ' + negocio.nombre;
      cabecera.append(logo);
    }
    const intro = nodo('div', null, 'empeno-intro');
    intro.append(nodo('p', negocio.rubro, 'empeno-rubro'), nodo('h3', negocio.nombre));
    if (negocio.verificado) intro.append(nodo('p', '✓ Negocio verificado', 'empeno-verificado'));
    if (negocio.descripcion) intro.append(nodo('p', negocio.descripcion, 'empeno-descripcion'));
    cabecera.append(intro);
    hero.append(cabecera);

    const acciones = nodo('div', null, 'empeno-acciones');
    const seccion = nodo('section', null, 'empeno-catalogo');
    const titulo = nodo('h4', 'Catálogo de artículos');
    titulo.tabIndex = -1;
    const ver = boton(negocio.catalogo_texto, 'empeno-cta empeno-cta-secundario');
    ver.onclick = () => {
      titulo.focus({preventScroll: true});
      titulo.scrollIntoView({block: 'start'});
    };
    acciones.append(whatsapp(negocio, negocio.cotizar_texto, negocio.cotizar_mensaje, 'empeno-cta empeno-cta-principal'), ver);
    const llamar = nodo('a', 'Llamar al ' + negocio.telefono, 'empeno-llamar');
    llamar.href = 'tel:+52' + negocio.telefono;
    acciones.append(llamar);
    hero.append(acciones);

    const zona = nodo('div', 'Cargando artículos…');
    zona.setAttribute('aria-live', 'polite');
    seccion.append(titulo, zona);
    perfil.append(regreso, hero, seccion, datosPerfil(negocio));
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
