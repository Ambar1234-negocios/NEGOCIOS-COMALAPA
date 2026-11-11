/* Presentación de precios en centavos; no modifica la cotización. */
(() => {
  'use strict';
  window.PreciosPedido = {
    texto(cantidad, unitario, subtotal, dinero) {
      if (Number(cantidad) <= 1) return dinero(subtotal);
      // Usar el precio real, nunca deducirlo dividiendo un total con extras o descuentos.
      const valido = unitario !== null && unitario !== undefined && Number.isFinite(Number(unitario));
      if (!valido) return 'Precio unitario no disponible · Subtotal: ' + dinero(subtotal);
      const precio = dinero(unitario).replace(/\.00$/, '');
      return precio + ' c/u' + (Number(unitario) * Number(cantidad) === Number(subtotal)
        ? ' = ' : ' · Subtotal de la línea: ') + dinero(subtotal);
    }
  };
})();
