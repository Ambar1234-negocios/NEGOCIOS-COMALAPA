# Entorno de pruebas de NEGOCIOS-COMALAPA

La rama `main` sigue publicando el sitio real. La rama `staging` se prepara para publicar en el Worker independiente `negocios-comalapa-staging` con el dominio `pruebas.exhibicionfronteracomalapa.com`. El Worker previo `exhibicion-comalapa-pruebas` tenía configuración para archivos estáticos y no separaba las conexiones a Supabase.

## Publicar el sitio de pruebas

1. Desde la raíz de la rama `staging`, ejecuta `node staging/build.mjs` con Node.js 22 o posterior. Usa una copia limpia de la rama y añade a Git los archivos nuevos del sitio antes de compilar. El comando imprime la carpeta generada.
2. Desde esa carpeta, con Wrangler instalado y la sesión iniciada en la cuenta que administra `exhibicionfronteracomalapa.com`, ejecuta `wrangler deploy --config wrangler.json`. Usa la configuración generada, que vincula el Worker de staging exclusivamente al subdominio `pruebas`. Cloudflare registra el dominio y crea su DNS y TLS mediante Custom Domain. No se debe agregar un CNAME manual para esta modalidad.
3. Abre `/`, `/panel/administracion.html`, `/panel/recepcion.html`, `/panel/menu-completo.html` y `/panel/dueno.html` en el dominio nuevo. Comprueba la franja amarilla, el encabezado `Content-Security-Policy`, la navegación entre paneles y el bloqueo de WhatsApp, pedidos y Mandaditos. Confirma que el dominio raíz sigue sirviendo producción.

## Datos y cuentas de prueba

El modo inicial usa los archivos públicos del catálogo y bloquea las conexiones externas. Las pantallas de acceso de los paneles cargan, pero el inicio de sesión y las operaciones que requieren datos quedan pendientes. Los pedidos nuevos desde el carrito y las solicitudes de Mandaditos muestran una simulación local.

Para probar paneles con datos, crea un proyecto Supabase separado y configura **solo** su URL y clave pública de frontend en `STAGING_SUPABASE_URL` y `STAGING_SUPABASE_ANON_KEY` antes de volver a compilar. El compilador rechaza la URL de producción, claves privadas y configuraciones incompletas. Carga en ese proyecto un esquema revisado de tablas, políticas y RPC, usuarios ficticios y datos sintéticos. Las migraciones versionadas son incrementales y requieren un esquema base. No copies clientes, pedidos, saldos, usuarios ni secretos de producción.

Antes de habilitar el acceso, omite webhooks, tareas programadas y servicios reales de comunicación y cobro. Usa cuentas ficticias y limita el correo de Auth a destinatarios de pruebas controlados. Las RPC de fondo y recepción solo se pueden probar con datos ficticios del proyecto separado. El sitio sigue simulando el envío desde el carrito y bloqueando WhatsApp y llamadas cuando se configura Supabase de pruebas.

## Promover un cambio aprobado

- Abre una rama de función desde `main`, intégrala en `staging` y vuelve a publicar el Worker. Comparte la URL de pruebas y el commit publicado.
- Tras la aprobación explícita, abre un PR de la rama de función a `main` o aplica solo sus commits aprobados sobre una rama nueva desde `main`. Revisa el diff, las pruebas y cualquier migración antes de integrarla. Mantén el compilador, los cambios exclusivos de staging y su configuración de Cloudflare fuera del PR de la función.
- Los cambios pequeños de datos solo van directo a producción si se solicitan explícitamente.
