(() => {
  'use strict';

  const staging = window.ENTORNO?.ambiente === 'staging';

  const root = document.querySelector('#portada-demo');
  if (!root) return;
  const choices = [
    ['Bodega Aurrerá', '🛒'], ['Súper Willys', '🧺'], ['Carnicería', '🥩'],
    ['Farmacia', '💊'], ['Ferretería', '🛠️'], ['Otro', '📦']
  ];

  // El renderizador recibe productos listos para mostrar. La fuente futura
  // deberá seleccionar productos publicados de catálogos elegibles.
  const demoProducts = [
    { name: 'Perfume ámbar', store: 'Perfumería Dicams', category: 'Perfumes', icon: '🧴', demo: true },
    { name: 'Camisa de lino', store: 'Shopping Morales', category: 'Ropa', icon: '👕', demo: true },
    { name: 'Aretes de aro', store: 'Fundación Dondé', category: 'Joyería', icon: '💎', demo: true },
    { name: 'Juego de puntas', store: 'Ferretería Horizonte', category: 'Herramientas', icon: '🛠️', price: 190, demo: true },
    { name: 'Reloj de correa', store: 'Relojería Brisa', category: 'Relojes', icon: '⌚', demo: true },
    { name: 'Bolso pequeño', store: 'Abazarlo Boutique', category: 'Accesorios', icon: '👜', demo: true }
  ];
  function orderProducts(products) {
    for (let index = products.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [products[index], products[other]] = [products[other], products[index]];
    }
    try {
      const previous = sessionStorage.getItem('tendencias-primer-producto');
      if (products.length > 1 && products[0].name === previous) {
        const other = 1 + Math.floor(Math.random() * (products.length - 1));
        [products[0], products[other]] = [products[other], products[0]];
      }
      if (products.length) sessionStorage.setItem('tendencias-primer-producto', products[0].name);
    } catch {
      // La selección sigue siendo aleatoria cuando el navegador bloquea el almacenamiento.
    }

  }

  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  const priceText = product => product.price == null ? 'Consultar precio' : money.format(product.price) + ' MXN';
  const modal = root.querySelector('dialog');
  const modalTitle = root.querySelector('#demo-modal-titulo');
  const form = root.querySelector('.demo-form');
  const detail = root.querySelector('.demo-detail');
  const result = root.querySelector('.demo-result');
  const resultStatus = result.querySelector('[role="status"]');
  const whatsapp = result.querySelector('.demo-whatsapp');
  const store = form.elements.tienda;

  function openDialog(title, panel) {
    modalTitle.textContent = title;
    for (const section of [form, detail, result]) section.hidden = section !== panel;
    modal.showModal();
  }

  const preference = form.elements.preferencia;
  const storeName = form.elements.tiendaNombre;
  const choiceField = form.querySelector('.demo-store-choice');
  const nameField = form.querySelector('.demo-store-name');
  const specificCategories = {
    Ferretería: { name: 'ferretería', example: 'Ej. taladro o tornillos' },
    Farmacia: { name: 'farmacia', example: 'Ej. gasas o vendas' },
    Carnicería: { name: 'carnicería', example: 'Ej. carne molida, bistec o chorizo' }
  };

  function updateStoreName() {
    const specific = !preference.disabled && preference.value === 'especifica';
    nameField.hidden = !specific;
    storeName.disabled = !specific;
    storeName.required = specific;
  }
  preference.addEventListener('change', updateStoreName);

  function openPurchase(label) {
    form.reset();
    store.value = label;
    const category = specificCategories[label];
    const butcher = label === 'Carnicería';
    const storeField = form.querySelector('.demo-store-field');
    storeField.hidden = Boolean(category);
    store.disabled = storeField.hidden;
    choiceField.hidden = !category;
    preference.disabled = !category;
    if (category) {
      choiceField.querySelector('span').textContent = '¿En qué ' + category.name + '?';
      nameField.querySelector('span').textContent = 'Nombre de la ' + category.name;
      preference.options[1].textContent = 'Indicar una ' + category.name + ' específica';
    }
    updateStoreName();
    form.querySelector('.demo-product-label').textContent = butcher ? '¿Qué productos quieres comprar?' : '¿Qué necesitas?';
    form.elements.necesidad.placeholder = category?.example ?? '';
    form.querySelector('.demo-quantity-label').textContent = butcher ? 'Cantidad o presupuesto' : 'Cantidad (opcional)';
    form.elements.cantidad.placeholder = butcher ? 'Ej. 1 kg o $100 de carne molida' : 'Ej. 2 bolsas';
    form.elements.cantidad.required = butcher;
    form.elements.cantidad.pattern = butcher ? '.*\\S.*' : '';
    if (!butcher) form.elements.cantidad.removeAttribute('pattern');
    openDialog((butcher ? 'Comprar en carnicería' : 'Compra por encargo') + (staging ? ' · DEMO' : ''), form);
    form.elements.necesidad.focus();
  }

  const shops = document.querySelector('#demo-compras-local .demo-shops');
  const track = shops.querySelector('.demo-shop-track');
  for (const [label, icon] of choices) {
    store.add(new Option(label, label));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'demo-shop';
    const symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = icon;
    button.append(symbol, label);
    button.dataset.shop = label;
    track.append(button);
  }

  for (const item of [...track.children]) {
    const copy = item.cloneNode(true);
    copy.tabIndex = -1;
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  }
  track.addEventListener('click', event => {
    const button = event.target.closest('[data-shop]');
    if (button) openPurchase(button.dataset.shop);
  });

  const online = document.querySelector('#demo-encargo button');
  store.add(new Option('Compra en línea', 'Compra en línea'));
  online?.addEventListener('click', () => openPurchase('Compra en línea'));

  const grid = root.querySelector('.demo-products');
  function renderTrends(products) {
    orderProducts(products);
    grid.closest('section').hidden = !products.length;
    for (const product of products) {
      const card = root.querySelector('#demo-product-template').content.cloneNode(true);
      const illustration = card.querySelector('.demo-illustration');
      if (product.photo) {
        const image = document.createElement('img');
        image.src = product.photo;
        image.alt = '';
        image.loading = 'lazy';
        illustration.replaceChildren(image);
      } else {
        illustration.querySelector('span').textContent = product.icon;
      }
      card.querySelector('.demo-badge').hidden = !product.demo;
      card.querySelector('.demo-category').textContent = product.category;
      card.querySelector('h3').textContent = product.name;
      card.querySelector('.demo-store').textContent = product.store;
      card.querySelector('.demo-price').textContent = priceText(product);
      const button = card.querySelector('button');
      button.textContent = product.demo && product.price == null ? 'Consultar' : 'Ver producto';
      button.setAttribute('aria-label', button.textContent + ': ' + product.name);
      button.addEventListener('click', () => {
        detail.textContent = product.store + ' · ' + product.category + ' · ' + priceText(product) +
          (product.demo ? '. Ejemplo visual. La disponibilidad y el precio no están confirmados.' : '.');
        if (product.url) {
          const link = document.createElement('a');
          link.href = product.url;
          link.textContent = 'Ver catálogo de ' + product.store;
          detail.append(document.createElement('br'), link);
        }
        openDialog(product.name + (product.demo ? ' · DEMO' : ''), detail);
      });
      grid.append(card);
    }
  }


  root.querySelector('.demo-all').addEventListener('click', event => {
    const expanded = grid.classList.toggle('demo-expanded');
    event.currentTarget.setAttribute('aria-expanded', String(expanded));
    event.currentTarget.textContent = expanded ? 'Ver carrusel' : 'Ver todo';
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previousTime;
  let shopPosition = 0;
  let shopPauseUntil = 0;
  for (const event of ['pointerdown', 'wheel', 'keydown']) {
    shops.addEventListener(event, () => { shopPauseUntil = Date.now() + 5000; }, { passive: true });
  }
  function moveShops(time) {
    const elapsed = Math.min(time - (previousTime ?? time), 50);
    previousTime = time;
    const loopWidth = track.children[choices.length].offsetLeft - track.firstElementChild.offsetLeft;
    if (loopWidth && !document.hidden && !reducedMotion.matches && !modal.open &&
        !shops.matches(':hover, :focus-within') && Date.now() >= shopPauseUntil) {
      if (Math.abs(shops.scrollLeft - shopPosition) > 1) shopPosition = shops.scrollLeft;
      shopPosition = (shopPosition + elapsed * 0.027) % loopWidth;
      shops.scrollLeft = shopPosition;
    }
    requestAnimationFrame(moveShops);
  }
  requestAnimationFrame(moveShops);

  let pauseUntil = 0;
  for (const event of ['pointerdown', 'wheel', 'keydown']) {
    grid.addEventListener(event, () => { pauseUntil = Date.now() + 8000; }, { passive: true });
  }
  setInterval(() => {
    if (document.hidden || reducedMotion.matches || modal.open ||
        grid.matches('.demo-expanded, :hover, :focus-within') || Date.now() < pauseUntil) return;
    const end = grid.scrollWidth - grid.clientWidth;
    if (end <= 0) return;
    const step = grid.firstElementChild.getBoundingClientRect().width + 12;
    const next = grid.scrollLeft >= end - 2 ? 0 : Math.min(grid.scrollLeft + step, end);
    grid.scrollTo({ left: next, behavior: 'smooth' });
  }, 3500);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const preferenceValue = data.get('preferencia');
    const destination = preferenceValue === 'especifica'
      ? store.value + ' (' + data.get('tiendaNombre').trim() + ')'
      : store.value + (preferenceValue === 'cualquiera' ? ' (cualquiera disponible)' : '');
    const quantity = data.get('cantidad')?.trim();
    const need = data.get('necesidad').trim();
    const reference = data.get('referencia')?.trim();
    if (staging) {
      resultStatus.textContent = 'Solicitud simulada para ' + destination + ': ' + need +
        (quantity ? ' · Cantidad o presupuesto: ' + quantity : '') + '. No se envió ningún mensaje.';
    } else {
      const contacts = window.ContactosExhibicion;
      const number = contacts?.numero(contacts.actual.mandaditos.numero);
      if (number) {
        const lines = ['Hola, quiero solicitar una compra por encargo.', 'Tienda: ' + destination, 'Producto(s): ' + need];
        if (quantity) lines.push('Cantidad o presupuesto: ' + quantity);
        if (reference) lines.push('Referencia: ' + reference);
        whatsapp.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n'));
        whatsapp.hidden = false;
      }
      resultStatus.textContent = number
        ? 'Tu lista está lista. Abre WhatsApp para revisar y enviar tu mensaje.'
        : 'El contacto de Mandaditos no está disponible por el momento.';
    }
    form.reset();
    form.hidden = true;
    result.hidden = false;
    resultStatus.focus();
  });

  modal.querySelector('.demo-close').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => {
    form.reset();
    resultStatus.textContent = '';
    whatsapp.hidden = true;
    whatsapp.removeAttribute('href');
  });
  document.querySelector('#demo-compras-local').hidden = false;
  root.hidden = false;
  if (staging) {
    renderTrends(demoProducts);
  } else {
    grid.closest('section').hidden = true;
    cargaNegociosPublicados.then(() => {
      const selected = [];
      const seen = new Set();
      for (const business of Object.values(negocios).flat()) {
        if (!business.slug || seen.has(business.slug) || business.activo === false ||
            !['visual', 'tecnico', 'digital'].includes(business.tipoCatalogo) ||
            business.catalogoServicios || ['comida', 'cat-comida-y-restaurantes'].includes(business.categoria)) continue;
        const products = (business.productos || []).filter(product =>
          product.enTendencias === true && product.disponible !== false && !product.eliminado &&
          product.nombre && !(business.seccionesOcultas || []).includes(product.seccion));
        if (!products.length) continue;

        const product = products[Math.floor(Math.random() * products.length)];
        let photo = '';
        if (product.foto) {
          try {
            const url = new URL(product.foto, location.origin);
            if (url.protocol === 'https:') photo = url.href;
          } catch {}
        }

        seen.add(business.slug);
        selected.push({
          name: product.nombre,
          store: business.nombre,
          category: product.seccion || 'Catálogo',
          price: Number.isFinite(product.precio) ? product.precio : null,
          photo,
          icon: '🛍️',
          url: '?' + new URLSearchParams({ negocio: business.slug })
        });
      }
      renderTrends(selected);
    }).catch(error => console.warn('No se pudo cargar Tendencias.', error));
  }
})();
