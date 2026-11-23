(() => {
  'use strict';

  if (window.ENTORNO?.ambiente !== 'staging') return;

  const root = document.querySelector('#portada-demo');
  const choices = [
    ['Bodega Aurrerá', '🛒'], ['Súper Willys', '🧺'], ['Carnicería', '🥩'],
    ['Farmacia', '💊'], ['Ferretería', '🛠️'], ['Otro', '📦']
  ];

  // El renderizador recibe productos listos para mostrar. La fuente futura
  // deberá seleccionar productos publicados de catálogos elegibles.
  const products = [
    { name: 'Perfume ámbar', store: 'Perfumería Dicams', category: 'Perfumes', icon: '🧴', demo: true },
    { name: 'Camisa de lino', store: 'Shopping Morales', category: 'Ropa', icon: '👕', demo: true },
    { name: 'Aretes de aro', store: 'Fundación Dondé', category: 'Joyería', icon: '💎', demo: true },
    { name: 'Juego de puntas', store: 'Ferretería Horizonte', category: 'Herramientas', icon: '🛠️', price: 190, demo: true },
    { name: 'Reloj de correa', store: 'Relojería Brisa', category: 'Relojes', icon: '⌚', demo: true },
    { name: 'Bolso pequeño', store: 'Abazarlo Boutique', category: 'Accesorios', icon: '👜', demo: true }
  ];
  for (let index = products.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [products[index], products[other]] = [products[other], products[index]];
  }
  try {
    const previous = sessionStorage.getItem('tendencias-primer-producto');
    if (products[0].name === previous) {
      const other = 1 + Math.floor(Math.random() * (products.length - 1));
      [products[0], products[other]] = [products[other], products[0]];
    }
    sessionStorage.setItem('tendencias-primer-producto', products[0].name);
  } catch {
    // La selección sigue siendo aleatoria cuando el navegador bloquea el almacenamiento.
  }

  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  const priceText = product => product.price == null ? 'Consultar precio' : money.format(product.price) + ' MXN';
  const modal = root.querySelector('dialog');
  const modalTitle = root.querySelector('#demo-modal-titulo');
  const form = root.querySelector('.demo-form');
  const detail = root.querySelector('.demo-detail');
  const result = root.querySelector('.demo-result');
  const store = form.elements.tienda;

  function openDialog(title, panel) {
    modalTitle.textContent = title;
    for (const section of [form, detail, result]) section.hidden = section !== panel;
    modal.showModal();
  }

  function openPurchase(label) {
    form.reset();
    store.value = label;
    openDialog('Compra por encargo · DEMO', form);
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
  online.addEventListener('click', () => openPurchase('Compra en línea'));

  const grid = root.querySelector('.demo-products');
  for (const product of products) {
    const card = root.querySelector('#demo-product-template').content.cloneNode(true);
    card.querySelector('.demo-illustration span').textContent = product.icon;
    card.querySelector('.demo-badge').hidden = !product.demo;
    card.querySelector('.demo-category').textContent = product.category;
    card.querySelector('h3').textContent = product.name;
    card.querySelector('.demo-store').textContent = product.store;
    card.querySelector('.demo-price').textContent = priceText(product);
    const button = card.querySelector('button');
    button.textContent = product.price == null ? 'Consultar' : 'Ver producto';
    button.setAttribute('aria-label', button.textContent + ': ' + product.name);
    button.addEventListener('click', () => {
      detail.textContent = product.store + ' · ' + product.category + ' · ' + priceText(product) +
        '. Ejemplo visual. La disponibilidad y el precio no están confirmados.';
      openDialog(product.name + ' · DEMO', detail);
    });
    grid.append(card);
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
    result.textContent = 'Solicitud simulada para ' + data.get('tienda') + ': ' + data.get('necesidad').trim() +
      '. La prueba terminó aquí. No se envió ningún mensaje.';
    form.reset();
    form.hidden = true;
    result.hidden = false;
    result.focus();
  });

  modal.querySelector('.demo-close').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => {
    form.reset();
    result.textContent = '';
  });
  document.querySelector('#demo-compras-local').hidden = false;
  root.hidden = false;
})();
