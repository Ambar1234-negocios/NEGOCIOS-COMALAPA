# Elegans Florería

Perfil existente: https://exhibicionfronteracomalapa.com/?negocio=elegans-floreria. Se conserva el nombre registrado, sin renombrarlo a Elegance.

Horario diario 07:00–22:00, zona America/Mexico_City. La corrección incluye domingo, que estaba cerrado. El indicador usa la misma función de horarios existente; se comprobaron apertura a las 07:00 y cierre a las 22:00 los siete días.

Se reutilizan exactamente las diez rutas de galería, sin nuevas subidas. catalogoGaleria.activa habilita tarjetas horizontales y ampliación navegable. catalogoGaleria.elementos usa la URL original como clave: nombre opcional y cotizacion por foto. No se derivan nombres del archivo ni del orden; el mensaje incluye la URL absoluta exacta, además del nombre del negocio y de la referencia cuando existe. No se crearon productos, precios ni disponibilidad. El destinatario procede de ContactosExhibicion.actual.mandaditos.numero.

Edición: /panel/gestion.html → Negocios → buscar Elegans Florería → Editar → Fotos. Mantén activado Usar galería como catálogo con cotización a Mandaditos. Debajo de cada miniatura escribe Nombre o referencia estable y marca/desmarca Activar Solicitar cotización y entrega. Guardar y publicar aplica todo. El nombre puede quedarse vacío. Para fotos nuevas, guarda la galería y vuelve a abrir para editar sus referencias. Los nombres se conservan al reordenar o quitar otras fotos porque la clave es su URL. Reemplazar una imagen por una URL diferente crea otra referencia. Mostrar galería oculta la sección completa.

Archivos: galeria-cotizacion.js/.css, script.js, index.html, negocios.json, panel/gestion.js/.html, tests/galeria-cotizacion.cjs, sql/galeria-cotizacion-perfil.sql y este documento.

Base de datos: piloto_menus_completos, solo elegans-floreria, original y borrador (horarios y catalogoGaleria), revisión 1→2; sitio_historial registra el cambio. sitio_perfil_guardar admite catalogoGaleria manteniendo autorización de administrador, revisión, validación y auditoría existentes. Sin nuevas tablas, permisos ni políticas. Prueba transaccional de guardar nombre y desactivar CTA revertida; rechazo de usuario no autorizado comprobado. Sin contenido de prueba persistente.

Pruebas: node tests/galeria-cotizacion.cjs verifica fotos originales, otros perfiles intactos, número de Mandaditos, referencia estable al reordenar, CTA desactivado, editor y límites horarios. No se alteraron comida.js, fichas de Sayer ni catálogo de Shopping Morales.
