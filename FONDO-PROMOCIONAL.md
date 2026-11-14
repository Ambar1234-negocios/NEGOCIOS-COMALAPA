# Fondo global de Exhibición

El fondo es compartido por todos los menús aprobados con categoría `comida`, `delivery=true` y `tipoDelivery=mandaditos`. El servidor verifica todos los negocios del pedido. Solo se descuenta el servicio de entrega a domicilio dentro de Frontera Comalapa. Los precios de productos permanecen intactos.

## Flujo

1. Crear carrito, guardar solicitud o abrir WhatsApp no reserva ni gasta el fondo. El costo de entrega todavía se define en recepción.
2. Recepción coteja el folio del WhatsApp, cotiza el costo real del servicio y marca explícitamente que el destino está dentro de la zona local. La opción automática del fondo aplica el 50% completo si hay disponibilidad. No se acumula con otra campaña financiera seleccionada.
3. La cotización reserva el descuento durante 30 minutos. El saldo contable no baja. Las reservas vencidas se excluyen automáticamente del saldo comprometido, sin depender de un proceso periódico; el panel las muestra como vencidas. Cancelar marca la reserva como liberada. Los registros de reserva se conservan para auditoría.
4. El WhatsApp de la cotización incluye `🎉 Servicio a domicilio con 50% de descuento` y `🏷️ Descuento aplicado al servicio: $20` cuando corresponde. El primer WhatsApp del carrito no promete un descuento cuyo servicio todavía no se ha cotizado.
5. El botón **Confirmar pedido y aplicar apoyo** ejecuta `piloto_pedido_operar` con `registrar_aceptacion`: aceptación, débito, registro del apoyo y evento del pedido ocurren en la misma transacción. Si el cliente aceptó por enlace, recepción todavía debe confirmar el apoyo desde el panel. Confirmar la recepción del WhatsApp es un paso distinto que no gasta saldo.
6. El fondo se bloquea durante la reserva/confirmación. La clave única por pedido y el estado consumido impiden doble cobro. Las reservas activas no pueden superar el saldo. Si no alcanza el 50% completo, la siguiente cotización queda sin promoción. Una reserva vencida exige recotizar; no se cobra automáticamente una diferencia al cliente.
7. No se permite asignar ni completar por otro RPC un pedido con apoyo pendiente. Un apoyo ya confirmado no se recotiza ni se reintegra automáticamente al cancelar después de confirmar.
8. Administración/recepción ven saldo restante, reservado y disponible. Solo administración puede reponer saldo con +$100, +$120 o monto manual. Cada reposición usa una clave idempotente para evitar duplicarla al reintentar.

## Datos y seguridad

- Tablas: `exhibicion_fondo`, `exhibicion_fondo_apoyos`, `exhibicion_fondo_movimientos`.
- RLS activado, sin permisos de acceso directo para clientes ni usuarios autenticados. RPC de estado exige operador; recarga exige administrador.
- Funciones internas en `promocion_privada`, sin acceso para `anon`/`authenticated`. La consulta de disponibilidad también es privada para impedir inferir el fondo consultando importes.
- No se publica el saldo en el checkout ni en WhatsApp. SQL y pruebas están excluidos de los archivos públicos por `.assetsignore`.
- Avisos de seguridad revisados: RLS sin políticas es intencional para tablas accesibles exclusivamente por RPC; las RPC expuestas verifican autorización. No hay acceso anónimo al saldo o recargas.

## Migraciones aplicadas a negocios-comalapa

- `20261114064256_exhibicion_fondo_promocional_global`: `sql/fondo-promocional-global.sql`.
- `20261114064424_exhibicion_fondo_guardar_transiciones`: `sql/fondo-promocional-global-guardas.sql`.
- `20261114064551_exhibicion_fondo_disponibilidad_privada`: `sql/fondo-promocional-global-privacidad.sql`.

La carga inicial es 12000 centavos. No volver a ejecutar la migración para reponer saldo: usar el control admin.

## Verificación

`sql/pruebas-fondo-promocional-global.sql` prueba las RPC reales dentro de BEGIN/ROLLBACK, con autorización de administración y recepción:

- Saldo inicial **12000** → servicio **4000**, reserva **2000**, saldo todavía **12000** → confirmación **10000** → segunda confirmación **10000**, un único movimiento.
- Productos de **15000** centavos conservan ese subtotal.
- Fuera de zona, cancelación, vencimiento, rechazo de recotización consumida, saldo insuficiente, disponibilidad exacta, reserva que impide ofrecer el mismo dinero dos veces y bloqueo de entrega sin confirmación.
- Recarga idempotente, recarga denegada a recepción, consulta/recarga denegadas a usuario no autorizado y privilegios directos revocados.
- Todo el ensayo se revierte: el saldo real permanece **12000**, sin pedidos de prueba persistentes.

`node tests/fondo-promocional.cjs` verifica en navegador los controles por rol, los importes pendientes/restantes y el bloque condicional de WhatsApp sin mostrar la carga inicial. Requiere Playwright y Edge; puede indicarse `PLAYWRIGHT_MODULE_PATH`.

Archivos de aplicación modificados: `panel/recepcion.js`, `panel/recepcion.html`. No se cambia el primer WhatsApp del carrito porque aún no existe una cotización del servicio.

