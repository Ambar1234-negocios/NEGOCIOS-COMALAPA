(() => {
  'use strict';

  if (location.hostname === ENTORNO.productionHost ||
      location.hostname === 'www.' + ENTORNO.productionHost) {
    document.documentElement.replaceChildren();
    throw new Error('La publicación de pruebas requiere un dominio separado.');
  }

  const message = 'Modo de pruebas. Se bloqueó la salida del sitio y no se envió nada.';

  function isLocal(value) {
    try {
      const url = new URL(String(value), location.href);
      return url.protocol === location.protocol && url.origin === location.origin;
    } catch {
      return false;
    }
  }

  function esConfirmacionRegistro(value) {
    const confirmacion = document.getElementById('registro-confirmacion');
    const enlace = document.getElementById('registro-whatsapp');
    if (location.pathname !== '/registro-clientes.html' || !confirmacion || confirmacion.hidden ||
        !enlace?.hasAttribute('href') || enlace.href !== value) return false;
    const url = new URL(enlace.href);
    return url.origin === 'https://api.whatsapp.com' && url.pathname === '/send' &&
      url.searchParams.size === 2 && url.searchParams.get('phone') === '529633106862' &&
      url.searchParams.has('text') && !url.hash;
  }

  const open = window.open.bind(window);
  window.open = (url, ...args) => {
    if (url && isLocal(url)) return open(url, ...args);
    if (url) alert(message);
    return null;
  };
  if (navigator.share) {
    navigator.share = () => Promise.reject(new DOMException(message, 'AbortError'));
  }

  function disableLink(link) {
    if (!link.hasAttribute('href') || isLocal(link.href) ||
        (link.id === 'registro-whatsapp' && esConfirmacionRegistro(link.href))) return;
    link.removeAttribute('href');
    link.removeAttribute('ping');
    link.setAttribute('data-accion-bloqueada', '');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', message);
  }

  function guardNavigation(event) {
    const link = event.target?.closest?.('a, area');
    if (!link) return;
    disableLink(link);
    if (!link.hasAttribute('data-accion-bloqueada')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type !== 'contextmenu') alert(message);
  }

  for (const event of ['click', 'auxclick', 'contextmenu', 'dragstart']) {
    window.addEventListener(event, guardNavigation, true);
  }
  new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'attributes' && change.target.matches('a, area')) {
        disableLink(change.target);
      }
      for (const node of change.addedNodes) {
        if (node.matches?.('a, area')) disableLink(node);
        node.querySelectorAll?.('a[href], area[href]').forEach(disableLink);
      }
    }
  }).observe(document.documentElement, {
    subtree: true, childList: true, attributes: true, attributeFilter: ['href']
  });

  if (!ENTORNO.supabaseConfigurado) {
    window.addEventListener('submit', event => {
      if (!event.target.querySelector('input[type="password"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      alert('El inicio de sesión requiere el Supabase de pruebas.');
    }, true);
  }
})();
