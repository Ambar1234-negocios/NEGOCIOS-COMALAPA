# Shopping Morales

Perfil: https://exhibicionfronteracomalapa.com/?negocio=shopping-morales
Categoría: cat-ropa-calzado-y-accesorios (Ropa, Calzado y Accesorios).

Catálogo visual con ocho secciones, sin precio público ni pedido de comida. Cada modelo puede tener hasta cuatro fotos individuales usando la ficha avanzada existente, con swipe, flechas, contador y ampliación. El CTA consulta precio y talla por WhatsApp, incluyendo el nombre del modelo. Los modelos con disponible=false quedan ocultos.

Administración: panel/menu-completo.html?negocio=shopping-morales. Dueño autorizado: panel/dueno.html?negocio=shopping-morales. El editor permite precio vacío (null), guardar y ocultar; reutiliza carga y validación de imágenes. No se asignó una cuenta de dueño porque no se proporcionó correo.

Supabase: alta exclusiva en piloto_menus_completos y sitio_historial; nueva RPC catalogo_visual_modelo_guardar con autorización existente por negocio, bloqueo, revisión y auditoría. Las futuras publicaciones usan menu_productos_publicados y menu_publicacion_historial. No se cambiaron esquemas de tablas ni datos de otros negocios.

Horario lunes a sábado 07:00–21:30. Domingo sin_confirmar. Pendientes: modelos, sus fotos, tallas/referencias, horario del domingo y correo del dueño. Dirección, redes, logo y banner permanecen sin proporcionar y no se inventaron.

Pruebas: tests/catalogo-visual.cjs (ambos editores, precio null, secciones, CTA, ocultación, horario, ausencia de imágenes inventadas y anchos 320/390/768/1280); tests/browser-fichas.cjs (cuatro cargas, orden, reemplazo, eliminación, flechas, contador, pestañas y roles); sql/pruebas-catalogo-visual.sql (alta/edición sin precio, ocultación, rechazo de acceso no autorizado y revisión antigua, sin cambios a otros negocios). Las pruebas SQL revierten todos los modelos de prueba. Perfil final sin productos.

