# Categorías dinámicas reutilizables

Sayer se habilita con `categoriasDinamicas: true` y `tipoCatalogo: "tecnico"` en los JSON `original` y `borrador` de `piloto_menus_completos`. No se crean tablas ni se duplican productos. Se reutilizan `seccionesCatalogo` (lista ordenada de nombres) y `productos[].seccion`, usados por Shopping Morales. `seccionesOcultas` contiene nombres que el catálogo público no debe renderizar. Las categorías vacías persisten; los productos sin sección se muestran en `Otros productos` cuando existen.

Para futuros negocios: habilitar la capacidad, inicializar `seccionesCatalogo` con las secciones existentes, elegir el diseño (`tecnico` para productos con fotos/fichas y precio opcional) y vincular su dueño en `dueno_accesos_v53`. El mismo panel, selector, RPC y render público funcionarán sin condiciones nuevas por slug. Shopping Morales conserva su diseño visual y su endpoint anterior; otros negocios no se habilitan automáticamente.

## Archivos modificados

- `panel/catalogo-secciones.js`: amplía el módulo existente de Shopping Morales con creación y administración de categorías dinámicas. Incluye funciones compartidas de capacidad/configuración.
- `panel/dueno-menu.js`, `panel/menu-completo.js`: filtros y listas del editor consultan la misma configuración dinámica; conservan compatibilidad con páginas que no cargan el módulo.
- `panel/menu-opciones.js`: selector de categoría utiliza la configuración compartida, junto a categorías derivadas de productos existentes.
- `panel/sayer-catalogo.js`: aplica las fichas técnicas por configuración `tipoCatalogo`, elimina categorías fijas del selector, muestra el selector al dueño y utiliza la RPC genérica de orden de productos.
- `comida.js`: render técnico configurable, orden de categorías, categorías ocultas, respaldo para productos sin categoría y precios positivos únicamente. Mantiene tarjetas abiertas.
- `panel/dueno.html`, `panel/menu-completo.html`, `index.html`: versiones de recursos para invalidar caché.
- `sql/catalogo-categorias-dinamicas.sql`: RPC, trigger y habilitación de Sayer.
- `sql/catalogo-producto-orden-dinamico.sql`: orden de productos por capacidad, reutiliza el patrón anterior de Sayer.
- `sql/pruebas-categorias-dinamicas.sql`: verificación transaccional con rollback.
- `tests/categorias-dinamicas.cjs`: pruebas de panel y render público con datos aislados.
- `CATEGORIAS-DINAMICAS.md`: este informe y patrón reutilizable.

## Base de datos

- `piloto_menus_completos`: solo Sayer se habilita. Cambios en `original` y `borrador`: `categoriasDinamicas`, `tipoCatalogo`, `seccionesCatalogo`, `seccionesOcultas`; actualiza `revision` y `actualizado_en`. Los productos originales se conservan íntegros. Al renombrar una categoría se actualiza `productos[].seccion` en ambos documentos, incluidos productos de la papelera. Al guardar productos, el trigger incorpora categorías nuevas a la lista.
- `menu_productos_publicados`: renombrar actualiza `contenido.seccion`, `revision`, `publicado_en`, `publicado_por`; ordenar producto actualiza `contenido.ordenCatalogo` y esos campos de publicación.
- `sitio_historial`: auditoría de configuración y operaciones de categorías (`tipo`, `registro`, `anterior`, `nuevo`, `actor`; fecha automática).
- `menu_publicacion_historial`: auditoría existente de orden de producto (`negocio`, `producto`, `anterior`, `nuevo`, `actor`).
- Funciones nuevas: `catalogo_seccion_administrar`, `catalogo_dinamico_validar`, `catalogo_producto_ordenar`. Trigger nuevo: `catalogo_dinamico_validar` sobre actualizaciones de `piloto_menus_completos`.
- Sin nuevas tablas, columnas relacionales, políticas RLS ni cambios de almacenamiento. Las RPC usan el patrón existente de escritura protegida, `search_path` vacío y ejecución autenticada; sin ejecución para `anon`/`PUBLIC`. El trigger no es invocable por clientes.

Las categorías requieren una cuenta confirmada, activa y vinculada al negocio en `dueno_accesos_v53`; las cuentas de otros negocios son rechazadas. El trigger aplica ese vínculo también a las escrituras de productos mediante las RPC existentes en catálogos habilitados. Esto incluye cuentas administrativas sin vínculo explícito: para editar Sayer deben estar vinculadas como dueño autorizado. Se conservan revisión optimista, bloqueo de fila y auditoría. Solo se eliminan categorías sin productos en original, borrador y publicación, incluidos eliminados recuperables.

## Validación realizada

- Base de datos: creación reversible de categoría QA, asignación de producto existente, renombrado sincronizado con publicación, orden, ocultar/mostrar en configuración pública, rechazo de eliminar categoría ocupada, eliminación de categoría vacía, rechazo de revisión antigua, acceso anónimo y usuario ajeno; comparación de otros negocios intactos. Todo dentro de transacción revertida.
- Comparación posterior a la habilitación: los tres productos de Sayer en original y borrador son exactamente iguales a los previos; no quedan categorías QA.
- Navegador con respuestas simuladas, dueño y editor administrativo, 390 y 1280 px: creación, selector, guardado de producto con ficha técnica, orden, ocultar/mostrar y render público, renombrado, recarga y bloqueo de eliminación ocupada.
- Regresión Shopping Morales: dueño y editor administrativo a 320, 390 y 1280 px. Render de Sayer: precios 0/nulo/ausente/positivo, fichas, fotos, orden y productos informativos.

Las pruebas del navegador usan fixtures aisladas y no autentican al dueño real ni publican productos de prueba. La comprobación SQL sí ejecuta las RPC reales y revierte sus cambios. La nueva API autenticada SECURITY DEFINER produce el aviso genérico esperado del asesor de Supabase; su autorización se verifica en las pruebas. Los avisos preexistentes ajenos a este cambio quedan fuera del alcance.
