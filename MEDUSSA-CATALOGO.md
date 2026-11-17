# Medussa Tatto Studio

Slug: `medussa-tatto-studio`. Perfil: https://exhibicionfronteracomalapa.com/?negocio=medussa-tatto-studio

Reutiliza `tipoCatalogo: tecnico`, `categoriasDinamicas`, `seccionesCatalogo` y fichas de hasta cuatro fotos. La capacidad `catalogoServicios: true` adapta títulos, botones y WhatsApp; respeta `disponible: false` incluso en fichas informativas. El precio inicial 0 es el valor interno que usa el editor para ausencia de precio; no se muestra como precio gratuito.

Secciones: Tatuajes (Tatuajes, Covers, Línea fina, Puntillismo, Tatuajes a color, Tatuajes temporales); Perforaciones (Perforaciones); Joyería para perforaciones (Joyería para perforaciones). El orden se controla con las categorías y `ordenCatalogo` existentes. Las categorías vacías persisten y muestran Próximamente.

Teléfono/WhatsApp: 9631509370. Enlaces con prefijo mexicano 52. Atención únicamente con cita previa; lunes a viernes 08:00–19:00, sábado y domingo 08:00–16:00. No se añaden precios, dirección, Maps, redes, correo, pagos ni imágenes. Las tarjetas usan el mensaje neutro existente Fotos pendientes. El visor y sus controles de fotos se reutilizan.

Datos: `medussa-tatto-studio.json`, respaldo estático en `negocios.json`; alta única en `sql/medussa-tatto-studio.sql`. Tablas: `piloto_menus_completos` (original y borrador), `menu_productos_publicados` (8 fichas), `dueno_accesos_v53` (cuenta administrativa existente autorizada por el usuario). Sin nuevas tablas, funciones, políticas o permisos públicos. Las RPC existentes registran y autorizan futuras ediciones.

Panel: `panel/dueno.html?negocio=medussa-tatto-studio` o `panel/menu-completo.html?negocio=medussa-tatto-studio`. Crear/editar servicios, disponibilidad, descripción, fotos, eliminación recuperable y orden usan el editor existente. Administrar categorías permite crear, renombrar, ordenar y ocultar; solo elimina categorías sin fichas, incluidas las de la papelera. No se crea una cuenta de dueña ni contraseña.

Validación: `node tests/medussa-catalogo.cjs`, `node tests/sayer-catalogo.cjs`, `tests/categorias-dinamicas.cjs` (navegador: dueño y admin, 390 y 1280 px). Pendientes de aportar: logo, banner, fotos, dirección/Maps, redes, correo y métodos de pago; cuenta de dueña si requiere acceso propio.
