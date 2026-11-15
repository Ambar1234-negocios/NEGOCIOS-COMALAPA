# Shopping Morales

Perfil: https://exhibicionfronteracomalapa.com/?negocio=shopping-morales
Categoría: cat-ropa-calzado-y-accesorios (Ropa, Calzado y Accesorios).

Catálogo visual con ocho secciones abiertas y filas horizontales de prendas, sin acordeones, precio público ni pedido de comida. Conserva secciones adicionales creadas por el editor. Cada prenda puede tener hasta cuatro fotos individuales, con swipe, flechas y contador. Al tocar una imagen, nombre o tarjeta se abre una vista ampliada con todas sus fotos, empezando por la foto elegida. Desde esa vista se consulta precio y talla por WhatsApp con el nombre exacto de la prenda. Los modelos con disponible=false quedan ocultos.

Administración: panel/menu-completo.html?negocio=shopping-morales. Selecciona Shopping Morales y pulsa Nueva prenda. Escribe un nombre o referencia estable, elige una sección (o Crear otra sección), agrega de dos a cuatro fotos de la misma prenda y ordénalas con las flechas. Puedes quitar o reemplazar fotos y guardar sin precio. Guardar y publicar actualiza el catálogo. Para ocultar una prenda, desmarca Mostrar modelo en catálogo y guarda; para eliminar, usa Eliminar producto. La papelera permite restaurar. Por indicación del usuario, la cuenta maestra lo administrará por ahora. No se asignó cuenta de dueño. El panel/dueno.html?negocio=shopping-morales queda preparado para una futura cuenta autorizada.

WhatsApp: 529631858534. Mensaje: Hola, quiero información sobre el [nombre exacto] de Shopping Morales. ¿Qué precio y talla tiene disponible? El nombre es el identificador visible; los UUID internos y el orden no aparecen como referencias de prendas. Los contadores numeran solo las fotos.

Verificación de la mejora: pruebas con tres fotos en móvil y escritorio, gesto táctil real emulado, flechas, apertura en la foto seleccionada, cierre y regreso del foco, filas horizontales, WhatsApp dinámico y sin desborde a 320/390/768/1280. Las pruebas usan contenido simulado local y no publican prendas de prueba. La prueba de fichas existentes también pasó. No se modificaron ficha-avanzada.js ni su CSS, datos de Sayer, tablas, permisos ni funciones de Supabase.

Supabase: alta exclusiva en piloto_menus_completos y sitio_historial; nueva RPC catalogo_visual_modelo_guardar con autorización existente por negocio, bloqueo, revisión y auditoría. Las futuras publicaciones usan menu_productos_publicados y menu_publicacion_historial. No se cambiaron esquemas de tablas ni datos de otros negocios.

Horario lunes a sábado 07:00–21:30. Domingo sin_confirmar. Pendientes: modelos, sus fotos, tallas/referencias, horario del domingo y correo del dueño. Dirección, redes, logo y banner permanecen sin proporcionar y no se inventaron.

Pruebas: tests/catalogo-visual.cjs (ambos editores, precio null, secciones, CTA, ocultación, horario, ausencia de imágenes inventadas y anchos 320/390/768/1280); tests/browser-fichas.cjs (cuatro cargas, orden, reemplazo, eliminación, flechas, contador, pestañas y roles); sql/pruebas-catalogo-visual.sql (alta/edición sin precio, ocultación, rechazo de acceso no autorizado y revisión antigua, sin cambios a otros negocios). Las pruebas SQL revierten todos los modelos de prueba. Perfil final sin productos.

