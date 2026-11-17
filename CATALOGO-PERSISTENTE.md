# Catálogos persistentes, pausa y zoom

Implementación compartida para Shopping Morales, Karen Shop y catálogos que usan `tipoCatalogo: visual` o `categoriasDinamicas: true`. No se copia contenido entre negocios.

## Flujos

- Abrir una foto permite ampliarla de 1x a 5x con dos dedos, desplazarla ampliada y reducirla a 1x para volver al swipe nativo entre fotos del mismo producto. Flechas y botón Restablecer zoom reinician la transformación. El gesto solo se intercepta dentro de las fotos del visor; el viewport conserva el zoom del navegador. Consultar precio y talla conserva su enlace y mensaje.
- Ambos paneles muestran Pausar / Ocultar temporalmente y Reactivar por prenda. La operación cambia únicamente `disponible` y conserva todos los demás campos, fotos y borradores. La prenda pausada se excluye del catálogo visual público.
- Las secciones se guardan independientemente en `seccionesCatalogo`; pausar o eliminar la última prenda no las elimina. Una sección visible vacía muestra Próximamente · Sin productos disponibles por el momento, sin tarjetas de muestra.
- Administrar categorías permite crear, renombrar, ordenar, ocultar, mostrar y eliminar explícitamente. Para eliminar una categoría que todavía tiene prendas activas o pausadas, primero deben reasignarse o eliminarse. Las prendas en papelera se conservan y no bloquean la eliminación explícita. Restaurar una prenda puede recuperar su categoría.
- Los selectores conservan categorías vacías y excluyen categorías que solo quedan en prendas eliminadas. Ocultar una categoría conserva sus prendas.

## Archivos

- `comida.js`, `comida.css`: visor compartido, gestos y estado vacío.
- `panel/catalogo-secciones.js`: administración y control de pausa compartido.
- `panel/menu-completo.js`, `panel/dueno-menu.js`: ambos paneles conectan ese mismo control; selectores sin categorías de papelera.
- `panel/menu-opciones.js`: selector de categorías persistentes.
- `index.html`, `panel/menu-completo.html`, `panel/dueno.html`: versiones de recursos para renovar la caché.
- `sql/catalogo-persistencia-pausa.sql`: migración aplicada a `gyvoyzxsgckpfkagzjtf`.
- `tests/catalogo-persistencia-pausa.sql`, `tests/catalogo-pausa-panel.cjs`, `tests/catalogo-zoom-persistencia.cjs`: pruebas nuevas.

## Datos, tablas y permisos

No se crean tablas ni columnas. Se reutilizan `piloto_menus_completos.original` y `.borrador`: `categoriasDinamicas`, `seccionesCatalogo`, `seccionesOcultas`, `productos[].seccion`, `productos[].disponible`, además de `revision` y `actualizado_en`.

Las publicaciones usan `menu_productos_publicados.contenido`, `revision`, `publicado_en`, `publicado_por`; la auditoría usa `menu_publicacion_historial` y `sitio_historial`. No se cambia Storage ni ningún archivo de imagen.

Se actualizan `catalogo_seccion_administrar` y `catalogo_dinamico_validar` para aceptar la autorización existente `dueno_permitido_v53`: administrador o dueño vinculado al negocio. Se agrega `catalogo_producto_visibilidad`, con comprobación de identidad, negocio, revisión y producto. Solo `authenticated` puede ejecutarla; usuarios ajenos y anónimos se rechazan. La categoría dinámica deja de incorporar prendas de papelera automáticamente.

La activación inicial solo cambia la configuración de Shopping Morales: nueve secciones (las ocho existentes más Camisas). Sus 22 prendas originales y sus fotos se conservaron; la auditoría confirma igualdad del arreglo de productos antes y después. Karen conserva sus siete categorías y seis prendas. No se eliminan ejemplos automáticamente porque los registros existentes no permiten distinguir con certeza cuáles son fotos reales; se pueden retirar desde el panel conservando las categorías.

## Verificación

- SQL ejecutado con administrador, dueña vinculada y usuario ajeno; creación, renombre, orden, ocultación, publicación, pausa, reactivación, eliminación de la última prenda y eliminación explícita de categoría. Todo dentro de una transacción terminada en ROLLBACK. Se confirmó que otros negocios no cambiaron durante la prueba.
- Chrome: gestos táctiles emulados con dos dedos sobre la foto, transición a un dedo para pan, reducción a 1x y swipe, flechas, CTA y anchos de 320/390/768/1280. Se revisó captura móvil. La configuración del viewport y CSS permite zoom global; no se valida un teléfono físico ni Safari/iOS.
- Ambos paneles: pausa/reactivación con un clic, administración de categorías, creación y selección de una categoría vacía.
- Regresiones aprobadas: `catalogo-visual.cjs`, `catalogo-secciones-editor.cjs`, `karen-catalogo.cjs`, `categorias-dinamicas.cjs`, `sayer-catalogo.cjs` y `medussa-catalogo.cjs`. Se integraron los cambios recientes de main para conservar el catálogo de servicios de Medussa.
