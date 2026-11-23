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
    { name: 'Perfume ámbar', store: 'Boutique Mirador', category: 'Perfumes', icon: '🧴', price: 350, demo: true },
    { name: 'Camisa de lino', store: 'Ropa Sendero', category: 'Ropa', icon: '👕', price: 280, demo: true },
    { name: 'Aretes de aro', store: 'Joyería Aurora', category: 'Joyería', icon: '💎', demo: true },
    { name: 'Juego de puntas', store: 'Ferretería Horizonte', category: 'Herramientas', icon: '🛠️', price: 190, demo: true },
    { name: 'Reloj de correa', store: 'Relojería Brisa', category: 'Relojes', icon: '⌚', demo: true },
    { name: 'Bolso pequeño', store: 'Accesorios Ceiba', category: 'Accesorios', icon: '👜', price: 240, demo: true }
  ];
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

  for (const [label, icon] of choices) {
    store.add(new Option(label, label));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'demo-shop';
    const symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = icon;
    button.append(symbol, label);
    button.addEventListener('click', () => {
      form.reset();
      store.value = label;
      openDialog('Compra por encargo · DEMO', form);
      form.elements.necesidad.focus();
    });
    root.querySelector('.demo-shops').append(button);
  }

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
        '. Producto y negocio ficticios para esta prueba.';
      openDialog(product.name + ' · DEMO', detail);
    });
    grid.append(card);
  }

  root.querySelector('.demo-all').addEventListener('click', event => {
    const expanded = grid.classList.toggle('demo-expanded');
    event.currentTarget.setAttribute('aria-expanded', String(expanded));
    event.currentTarget.textContent = expanded ? 'Ver carrusel' : 'Ver todo';
  });

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
  root.hidden = false;
})();