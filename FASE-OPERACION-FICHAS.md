# Recepción operativa y fichas avanzadas

El panel maestro y el panel de recepción existentes se conservan. La recepción normal ve pedidos y reparto; Clientes, campañas, edición del equipo y datos de transferencia quedan reservados al administrador. Las RPC vuelven a comprobar el rol en cada llamada. El listado operativo omite cumpleaños y consentimientos promocionales.

El administrador dispone de **✅ Finalizar pedido** con una confirmación de entrega y cobro completos. La operación bloquea la fila, valida la revisión, rechaza pedidos cerrados, registra entrega y cobro según efectivo/transferencia, consume promociones reservadas e invalida enlaces anteriores. La auditoría registra actor, revisión y estado anterior. Recepción conserva los pasos operativos de aceptación de reparto, recogida, cobro y entrega.

Desde Administración → Clientes se abre la vista existente de Clientes. Permite confirmar un teléfono sin pedido activo y corregirlo con validación y protección contra números ya vinculados. La confirmación detecta cambios concurrentes en el teléfono. Se corrigieron dos errores previos de la RPC de corrección: referencia ambigua al teléfono y un tipo de auditoría que la tabla rechazaba.

## Fichas por producto o servicio

El editor del administrador y los editores de dueños comparten `panel/ficha-editor.js`. La opción «Usar galería y pestañas» activa hasta cuatro fotos con carga, reemplazo, orden y eliminación. La primera es la portada. Cada ficha admite hasta cinco pestañas con títulos editables; las iniciales son Descripción, Cómo se aplica, Rendimiento, Usos y Presentaciones. Las pestañas vacías se omiten.

`fichaAvanzada: { activa, fotos: string[], secciones: { titulo, contenido }[] }` vive en el JSON del producto, en borrador, original, publicación e historial. No depende de Sayer ni de una categoría particular. Las imágenes usan el almacenamiento y compresión WebP existentes. Se elimina la referencia de la ficha al quitar una imagen; no se borra el archivo físico, para conservar publicaciones e historiales anteriores.

El público muestra galería horizontal con desplazamiento táctil, flechas, contador y ampliación. La barra de pestañas desplaza horizontalmente y sustituye un único panel de contenido. Incluye navegación por teclado y estados ARIA. Las tarjetas avanzadas ocupan el ancho del catálogo en móvil.

## Validación

- `sql/pruebas-fase-operacion-fichas.sql`: ejecutada en Supabase dentro de una transacción con reversión. Comprueba denegaciones de recepción, privacidad del listado, acceso maestro, cierres en efectivo y transferencia, revisión obsoleta, auditoría, teléfono sin pedido activo, creación/edición y lectura pública de fichas, límite de fotos y rechazo de origen externo.
- `tests/browser-fichas.cjs`: Chrome sin interfaz, con respuestas simuladas de Supabase. Comprueba cuatro cargas, reemplazo, reordenamiento, eliminación, guardado, pestaña única, flechas, contador, ampliación, teclado y permisos de pantalla. Anchos de 320, 390, 768 y 1280 píxeles, sin desbordamiento horizontal ni errores JavaScript.
- Para repetir el navegador: instalar Playwright en el entorno de pruebas y ejecutar `node tests/browser-fichas.cjs`. Opcionales: `PLAYWRIGHT_MODULE_PATH`, `CHROME_PATH` y `TEST_OUTPUT_DIR`.
- Revisión de sintaxis JavaScript y de diferencias de Git.
- Asesores de seguridad revisados: las tablas internas conservan RLS sin acceso directo; sus RPC controlan el rol. Persisten avisos del proyecto por RPC intencionalmente accesibles y protección de contraseñas filtradas desactivada; no se modificó la configuración de Auth.

Las pruebas de navegador no utilizan cuentas ni contraseñas reales. La persistencia y autorización se prueban separadamente en la base real con identidad de los roles existentes y reversión. No se afirma haber realizado un inicio de sesión manual de dueño o recepción.

## Aplicación

Las funciones SQL de esta fase ya fueron aplicadas a `negocios-comalapa`. `sql/fase-operacion-fichas.sql` reúne su definición final para revisión y reproducción. Los cambios de interfaz entran en vigor cuando se integre y publique la rama. No se alteraron productos ni pedidos reales durante las pruebas.

No incluye CRM segmentado, captación QR/NFC ni nuevas campañas de dueños.
