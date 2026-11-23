'use strict';

(() => {
  const claveSesion = 'exhibicionPilotoSesion';
  const iniciar = () => {
    mostrar();
    if (cuenta) aviso('');
  };

  el('login').addEventListener('submit', evento => {
    evento.preventDefault();
    tarea(async () => {
      cuenta = await api('/auth/v1/token?grant_type=password', {
        method: 'POST',
        datos: { email: el('correo').value.trim(), password: el('clave').value }
      });
      el('clave').value = '';
      sessionStorage.setItem(claveSesion, JSON.stringify(cuenta));
      iniciar();
    });
  });

  el('salir').addEventListener('click', () => tarea(async () => {
    try {
      await api('/auth/v1/logout', { method: 'POST' });
    } finally {
      cuenta = null;
      sessionStorage.removeItem(claveSesion);
      mostrar();
      aviso('Sesión cerrada.');
    }
  }));

  try {
    const sesion = JSON.parse(sessionStorage.getItem(claveSesion));
    if (sesion?.expires_at * 1000 > Date.now()) cuenta = sesion;
  } catch {
    // La sesión guardada no se puede recuperar.
  }
  iniciar();
})();
