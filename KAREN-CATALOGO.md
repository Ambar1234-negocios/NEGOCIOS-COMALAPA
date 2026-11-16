# Karen Shop

Perfil: https://exhibicionfronteracomalapa.com/?negocio=karen-shop
Panel: https://exhibicionfronteracomalapa.com/panel/dueno.html?negocio=karen-shop

Reutiliza el catálogo visual de Shopping Morales y las categorías dinámicas genéricas de Sayer (CATEGORIAS-DINAMICAS.md). No se copió ninguna foto, producto, prenda, texto ni categoría específica de Shopping Morales. Sus datos en Supabase no se modificaron.

Karen tenía cero productos y siete fotos de galería. Conserva esas siete fotos, logo, banner, descripción, horario, mapa de imágenes y contacto propio 9631063887. La galería permanece visible; no se inventaron prendas a partir de imágenes sin identificación. Las siete categorías iniciales provienen de sus propios servicios existentes.

La cuenta existente kg8460055@gmail.com tiene acceso únicamente a Karen. Las pruebas reales verificaron rechazo de Shopping Morales y Sayer. Sin cambios de contraseñas ni asignaciones.

Categorías: crear, renombrar, ordenar y ocultar/mostrar. Prendas: UUID interno y nombre descriptivo visible, descripción/precio opcionales, disponibilidad y hasta cuatro fotos ordenables, reemplazables y removibles. Perfil: carrusel, swipe, modal ampliado, CTA Consultar precio y talla al WhatsApp propio y Disponibilidad sujeta a existencia. Los contadores identifican fotos, nunca prendas.

Archivos: comida.js (categorías configurables y ocultas en diseño visual, CTA por tarjeta); negocios.json (configuración propia); panel/menu-completo.js y panel/dueno-menu.js (categoría inicial del negocio); index.html y ambos HTML del panel (caché); tests/karen-catalogo.cjs; tests/catalogo-visual.cjs (fixture vacía explícita); sql/karen-catalogo.sql; sql/pruebas-karen-catalogo.sql; este informe. Se conservan sin duplicar catalogo-secciones.js, menu-opciones.js y ficha-editor.js.

Base de datos: piloto_menus_completos.original/borrador reciben tipoCatalogo=visual, categoriasDinamicas=true, seccionesCatalogo, seccionesOcultas y mostrarGaleria=true. Se actualizan revision/actualizado_en y se registra sitio_historial. Sin tablas ni columnas nuevas. Galería, imagenes y demás datos se preservan. Reutiliza catalogo_seccion_administrar, catalogo_dinamico_validar, catalogo_visual_modelo_guardar, menu_productos_publicados y menu_publicacion_historial.

Al llegar el componente de Sayer a main se retiró la función provisional catalogo_visual_seccion_administrar y se restauró catalogo_visual_seccion_crear. Karen usa directamente la API genérica de Sayer; no queda implementación paralela.

Pruebas: Karen en ambos editores, 320/390/768/1280 px, alta sin precio, fotos, flechas, modal, swipe, WhatsApp y categorías propias/ocultas. Regresión Shopping Morales; catalogo-fotos-editor.cjs; catalogo-secciones-editor.cjs; categorias-dinamicas.cjs. SQL real con rollback: alta sin precio, renombrado sincronizado con publicación, orden, ocultar/mostrar y rechazo de otro negocio. No quedan productos de prueba.
