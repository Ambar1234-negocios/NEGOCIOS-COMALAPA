# Marca de agua en staging

En Administración, abre **Negocios y menús**, elige el negocio y pulsa **Marca de agua**. Cada negocio parte con ambas marcas desactivadas, posición inferior derecha e intensidad Media. Las intensidades corresponden al 25 %, 45 % y 70 % de opacidad. Cuando se activan ambas marcas, se colocan una encima de la otra en la posición elegida. Para conservar la transparencia del fondo, puedes subir un PNG o WebP transparente.

La imagen de Exhibición se guarda desde el mismo diálogo y se comparte entre los negocios que la tengan activada. Puedes seleccionar una foto publicada para ver la combinación antes de guardar. El diálogo conserva las imágenes de marca cuando desactivas las opciones, así que puedes reactivarlas más adelante.

## Archivos y datos

| Archivo | Cambio |
| --- | --- |
| `panel/administracion.html`, `panel/menu-completo.html` | Indicación en el acceso a negocios y diálogo en el editor maestro. |
| `panel/marca-agua-admin.js` | Lectura, carga, reemplazo, vista previa y guardado de las dos configuraciones. Reutiliza la sesión administrativa y la conversión a WebP. |
| `sql/marca-agua-staging.sql` | Crea las tablas y políticas de lectura, edición y carga, junto con el bucket público `marcas-agua`. |
| `marca-agua.js`, `marca-agua.css` | Lee las preferencias públicas y compone las fotos en el navegador. Las miniaturas marcadas muestran la foto completa para mantener visibles las marcas en las esquinas. |
| `menu-publicado.js`, `index.html`, `menu-negocio.html`, `menu-local.html`, `menu-forno.html` | Cargan las preferencias junto al menú público y habilitan el renderizado en el perfil y menús directos. |
| `comida.js`, `ficha-avanzada.js`, `empeno-publico.js` | Aplican la composición en fotos de productos, fichas, catálogos, visores y artículos de empeño. |
| `script.js`, `galeria-cotizacion.js`, `mejoras.js`, `portada-demo.js` | Aplican la composición en galería normal, galería de cotización, ampliaciones y fotos de productos destacados. |
| `tests/marca-agua-browser.cjs` | Prueba de navegador con datos ficticios para combinaciones, posición, aislamiento, vista previa y guardado. |

- `piloto_marca_agua_negocios` tiene los campos `slug`, `usar_negocio`, `usar_exhibicion`, `imagen`, `posicion` e `intensidad`. `slug` referencia al menú existente.
- `piloto_marca_agua_global` tiene los campos `id` e `imagen`. La fila única usa `id=true`.
- El bucket guarda únicamente imágenes de marca WebP de hasta 1 MB. Cada reemplazo usa una ruta nueva. Las versiones anteriores de las marcas permanecen en el bucket. No se copian fotos de productos ni de galerías.
- Las columnas `original`, `borrador` e `imagenes` de `piloto_menus_completos` conservan sus datos y referencias. La composición también funciona con las imágenes del repositorio y las fotos públicas de Supabase. El logo y el banner siguen usando su renderizado habitual.
- RLS permite guardar preferencias y subir marcas solo al rol reconocido por `piloto_es_admin()`. La configuración por `slug` permite añadir una política de propietario específica en el futuro. El navegador usa la clave pública y la sesión existente.
- La imagen que se muestra y se guarda desde el visor se genera en memoria. Una URL original que ya era pública sigue siéndolo. Si el navegador no puede leer una foto marcada desde su origen, esa vista no puede generar la composición.

## Habilitación en el dominio de pruebas

1. Confirma que el proyecto Supabase aislado de staging tiene el esquema base del catálogo, `piloto_es_admin()`, una cuenta administrativa ficticia y menús de prueba. Ejecuta `sql/marca-agua-staging.sql` una vez en ese proyecto.
2. Configura `STAGING_SUPABASE_URL` y `STAGING_SUPABASE_ANON_KEY` con la URL y la clave pública de ese proyecto. Compila y publica el Worker independiente según [la guía de staging](staging.md).
3. En [Administración de pruebas](https://pruebas.exhibicionfronteracomalapa.com/panel/administracion.html), entra en **Negocios y menús**, elige Cafetería Rocatli si existe en el catálogo de pruebas, o un negocio ficticio con fotos, y abre **Marca de agua**.
4. Selecciona una imagen para el negocio y otra para Exhibición. Guarda primero la imagen global y luego prueba, con recarga del perfil público entre cada guardado, las cuatro combinaciones de activación. Cambia de posición e intensidad y compara con la vista previa. Comprueba la foto del producto, su ampliación, una foto de galería y su ampliación.
5. Comprueba que otro negocio con ambas opciones desactivadas conserva sus fotos. Confirma que el logo y el banner del negocio editado siguen intactos. Sustituye la imagen global y comprueba que cambia solo donde la opción Exhibición esté activada.
6. Desactiva ambas marcas y confirma que la foto vuelve a verse limpia con la misma referencia original. Comprueba con una cuenta ficticia de dueño que el editor de marcas queda reservado a Administración.

Para repetir la prueba automatizada, ejecuta `node tests/marca-agua-browser.cjs` con Playwright y Chromium disponibles. Los entornos con una instalación externa pueden indicar `PLAYWRIGHT_MODULE_PATH` y `CHROME_PATH`.
