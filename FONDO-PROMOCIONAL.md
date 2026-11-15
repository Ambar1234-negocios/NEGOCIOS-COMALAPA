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
- No se publica el saldo en el checkout ni en WhatsApp. SQL, pruebas y este documento están excluidos del sitio de clientes por `_config.yml` en GitHub Pages y `.assetsignore` en Cloudflare.
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

## Ajustes manuales de administración (noviembre de 2026)

El panel de recepción permite elegir **Agregar saldo**, **Restar saldo** y **Fijar saldo**, escribir un monto y revisar saldo actual, monto, diferencia y saldo final. Consulta el saldo antes de mostrar la confirmación; el servidor comprueba nuevamente ese saldo bajo bloqueo. Si cambió, rechaza el ajuste y el panel muestra el saldo actualizado para volver a revisar.

`sql/fondo-ajustes-manuales.sql` es una migración aditiva, todavía pendiente de aplicar a producción. No modifica datos, RPCs automáticas, el saldo inicial ni las tablas existentes. No volver a ejecutar `fondo-promocional-global.sql`, que contiene la carga inicial histórica de $120. El saldo real comprobado para esta entrega es **8000 centavos ($80)**; las pruebas de este cambio no ejecutan ajustes contra producción.

RPC: `exhibicion_fondo_ajustar(p_accion text, p_monto_centavos integer, p_clave uuid, p_saldo_esperado bigint)`. Acciones `agregar`, `restar`, `fijar`. El monto se envía en centavos enteros, hasta 10000000 ($100,000); agregar/restar exigen al menos un centavo. Fijar admite cero, siempre que cubra los apoyos reservados vigentes. Fijar el saldo que ya existe se rechaza como operación sin cambio, porque el historial exige importes distintos de cero. Se aceptan punto o coma decimal en el panel, máximo dos decimales; se rechazan negativos, notación científica y valores fuera del rango.

La RPC pública es `SECURITY INVOKER`; delega en `promocion_privada.ajustar_fondo`, con `SECURITY DEFINER`, `search_path=''`, nombres calificados y autorización por `auth.uid()` y `piloto_es_admin()`. Se revoca EXECUTE a PUBLIC/anon y se concede solo a authenticated. Dar USAGE del esquema privado no concede ejecución de sus otras funciones; sus permisos permanecen revocados. Las tablas conservan RLS sin acceso directo de clientes. Esto sigue las [recomendaciones de funciones de Supabase](https://supabase.com/docs/guides/database/functions#secure-a-database-function).

La operación bloquea la única fila del mismo fondo con `FOR UPDATE`, igual que las reservas, consumos y recargas existentes. La actualización y la inserción de movimiento ocurren en la misma transacción: un fallo de cualquiera revierte ambas. Protege saldo no negativo, rango seguro para JavaScript y apoyos reservados vigentes. No altera la lógica automática de pedidos/promociones.

Cada ajuste agrega un movimiento en `exhibicion_fondo_movimientos` con `clave`, importe firmado (saldo final menos saldo anterior), `saldo_despues_centavos`, actor obtenido de la sesión y exactamente uno de estos motivos:

- `Ajuste manual admin: agregar saldo`
- `Ajuste manual admin: restar saldo`
- `Ajuste manual admin: fijar saldo`

La clave UUID única se verifica bajo el mismo bloqueo. Un reintento debe coincidir en actor, acción, monto y saldo revisado; devuelve el estado actual sin otro movimiento. Se conserva en memoria la petición completa si se pierde la respuesta o hay error de servidor, con edición bloqueada y botón para reintentar. No se cambia la clave al reintentar. Esta recuperación persiste durante la pestaña abierta, no después de recargar/cerrar: si se pierde una respuesta, reintentar antes de recargar. Una respuesta 4xx descarta la petición rechazada y vuelve a consultar el saldo. Tras éxito, el panel se vuelve a dibujar inmediatamente con el estado completo devuelto por la RPC, sin depender del refresco periódico de cinco segundos.

Pruebas pasadas:

- `tests/fondo-ajustes-sql.cjs`: PostgreSQL aislado con PGlite, validación, autorización/anon, firmas y actor del historial, las tres acciones, fijar cero, protección de reservas, saldo obsoleto, reintentos con clave/payload/actor y reversión atómica ante fallo de inserción. PGlite serializa peticiones: no constituye una prueba de concurrencia entre conexiones PostgreSQL independientes; la exclusión concurrente se apoya en el bloqueo de fila compartido y la restricción UNIQUE existente.
- `tests/fondo-ajustes-ui.cjs`: Edge con todas las peticiones Supabase interceptadas; vista previa, confirmar/cancelar, importes inválidos, saldo inmediato, doble envío, respuesta perdida después de aplicar el ajuste simulado, reintento con clave idéntica, saldo cambiado y controles por rol.
- `tests/fondo-promocional.cjs` y `tests/control-promociones-comida.cjs`: regresión del fondo, permisos, mensajes y controles de promoción existentes.

Entorno: Node, Playwright/Edge (`PLAYWRIGHT_MODULE_PATH`) y PGlite 0.3.14 (`PGLITE_MODULE_PATH`). No se agregan dependencias al sitio de clientes.

Activación después de revisión: comprobar main y saldo/historial actuales; aplicar únicamente la migración aditiva mediante Supabase; comprobar privilegios y asesores; integrar el cambio del panel. El archivo HTML renueva la versión de recepcion.js para evitar caché. Verificar la carga del panel publicado y consultar nuevamente saldo/historial sin ejecutar ningún ajuste real de prueba. No hay URL de staging verificada en esta entrega; la revisión actual es mediante la PR y las pruebas locales aisladas.

Reversión del código: volver a la versión anterior del panel. La nueva RPC es aditiva y puede dejarse sin uso o retirar primero la función pública y luego la privada. Nunca revertir ni sobrescribir saldos/movimientos reales. El asesor de seguridad preexistente informa sobre RLS sin políticas (intencional para tablas solo RPC), funciones SECURITY DEFINER previas y protección de contraseñas filtradas deshabilitada; no se modificaron esos aspectos ajenos a esta entrega.

