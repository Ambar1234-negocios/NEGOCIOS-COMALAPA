Las cuentas autorizadas pueden crear secciones vacías de un catálogo visual desde Nueva sección, junto a las pestañas de edición.

El nombre se guarda en original.seccionesCatalogo y borrador.seccionesCatalogo. Al recargar aparece en las pestañas, en el selector de sección de cada prenda y en el catálogo público. Las prendas existentes permanecen intactas. Las secciones derivadas de prendas anteriores siguen disponibles.

La RPC catalogo_visual_seccion_crear comprueba sesión, autorización del negocio, tipo visual, revisión vigente, nombre de 1 a 80 caracteres y un máximo de 50 secciones adicionales. Los nombres duplicados devuelven la sección existente. Registra auditoría y no concede ejecución a anon ni PUBLIC. Usa SECURITY DEFINER intencionalmente con search_path vacío: los dueños no tienen permisos de escritura directa en las tablas. El aviso del asesor sobre ejecución por authenticated corresponde a esta API deliberada, protegida por dueno_permitido_v53 y pruebas de acceso no autorizado.

SQL: sql/catalogo-secciones.sql. Pruebas transaccionales con rollback: sql/pruebas-catalogo-secciones.sql. Pruebas del panel con datos simulados: tests/catalogo-secciones-editor.cjs (creación, persistencia tras recargar, duplicados, nueva prenda con sección seleccionada, filtros y móvil/escritorio).
