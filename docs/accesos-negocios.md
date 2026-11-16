# Accesos de negocios

## Administrador

1. Entra a `/panel/administracion.html` con una cuenta que pertenezca a `public.piloto_administradores`.
2. En **Accesos de negocios**, pulsa **Administrar accesos de negocios**. También puedes entrar a `/panel/accesos-duenos.html`.
3. La lista muestra correo, nombre resuelto del negocio, slug, activo/inactivo y última actualización del permiso.
4. **Enviar recuperación**: revisa correo y negocio, y confirma. Supabase inicia su flujo oficial de recuperación. El resultado indica si aceptó la solicitud; no garantiza la entrega. Pide al dueño revisar entrada y spam.
5. **Asignar contraseña temporal**: escribe dos veces una contraseña de 12 a 128 caracteres y confirma. Se actualiza la cuenta Auth existente desde el servidor. La contraseña afecta todos los negocios de esa cuenta; no se manda automáticamente, no se conserva en la pantalla y no vence automáticamente. Compártela en privado y pide al dueño sustituirla usando Recuperar contraseña.
6. **Desactivar acceso**: confirma para cambiar solamente `activo` y `actualizado_en` del permiso seleccionado. No elimina usuarios, negocios ni productos. Sus siguientes consultas y cambios serán rechazados. Lo que ya haya visto en pantalla no puede retirarse.
7. **Reactivar acceso**: confirma para recuperar el permiso del mismo negocio, conservando la cuenta y contraseña.
8. **Preparar acceso de un dueño** conserva el flujo anterior para vincular un correo y negocio. Esto no crea una cuenta Auth.

Cada acción sensible tiene confirmación. Cancelar no ejecuta cambios. Si otro administrador modificó el permiso, se rechaza la acción y se solicita actualizar la lista. Una contraseña nunca se muestra en el listado ni en el resultado.

## Dueño

1. Abre `/panel/dueno.html`.
2. Escribe tu correo autorizado y abre **Primera entrada o contraseña olvidada → Recuperar contraseña**.
3. Abre el enlace que recibas por correo. Llegarás a `/panel/restablecer-contrasena.html`.
4. La pantalla verifica el token con Supabase Auth y comprueba que corresponde a una sesión de recuperación vigente. Una sesión normal, enlace inválido o vencido no habilita el formulario.
5. Escribe dos veces la nueva contraseña y guarda. La actualización usa la sesión de recuperación del propio usuario.
6. Vuelve a Mi negocio e inicia sesión con tu nueva contraseña. Mantienes los mismos negocios autorizados. Cambiar la contraseña no reactiva un permiso desactivado.

## Servidor y permisos

Edge Function: `gestionar-accesos`, proyecto `gyvoyzxsgckpfkagzjtf`.

- Valida el Bearer token con `/auth/v1/user` y comprueba en cada petición la pertenencia actual a `piloto_administradores` antes de leer accesos o usar privilegios administrativos.
- Las claves `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` vienen del entorno del servidor. Ninguna clave administrativa aparece en HTML o JavaScript del navegador.
- `verify_jwt=false` en el gateway: la función realiza su propia autenticación, compatible con la clave pública del sitio. No significa que las acciones sean anónimas.
- Solo admite los orígenes HTTPS del dominio principal y www; las llamadas sin Origin siguen necesitando un administrador autenticado.
- Resuelve el usuario Auth por el correo de un permiso existente, nunca por un UUID arbitrario recibido del navegador. Impide gestionar contraseñas de administradores desde esta sección.
- Recuperación: `POST /auth/v1/recover` con destino fijo a la pantalla propia. Contraseña temporal: `PUT /auth/v1/admin/users/{id}` desde servidor.
- Estado: actualización condicional por correo, negocio y fecha previa. No inserta ni elimina permisos.
- No se añadieron tablas, funciones SQL ni políticas. Se conservan RLS y las comprobaciones existentes de `dueno_permitido_v53`.

## Correo y redirecciones de Supabase

En Authentication → URL Configuration deben permitirse:

- `https://exhibicionfronteracomalapa.com/panel/restablecer-contrasena.html`
- `https://www.exhibicionfronteracomalapa.com/panel/restablecer-contrasena.html`

Site URL debe apuntar al sitio publicado. El inicio del sitio tiene un encaminador de respaldo para fragmentos `type=recovery` si Auth vuelve a Site URL. Los enlaces antiguos que regresan a `dueno.html` también se encaminan a la pantalla nueva. No se usa PKCE porque el administrador puede solicitar el correo desde un dispositivo distinto al del dueño. Se admite además una plantilla con `token_hash` y `type=recovery`.

El proyecto necesita un servicio de correo operativo y autorizado para los destinatarios. No se modificaron SMTP, remitente, plantillas ni URL Configuration: esas opciones no están expuestas por el conector disponible y el control del navegador se bloqueó. La entrega real y la configuración de redirección quedan pendientes de comprobación con una cuenta de prueba existente.

## Verificación realizada

- `node --test tests/accesos-negocios.mjs`: ocho grupos aprobados; usuarios no administradores, token inválido, confirmación ausente, permiso inexistente, cambios concurrentes, contraseña breve, cuenta administradora, correo fallido, límites y orígenes no autorizados.
- `tests/accesos-negocios-browser.cjs`: panel en 320, 390 y 1280 px; cancelar/confirmar, discrepancia de contraseñas, recuperación, contraseña temporal y desactivar/reactivar con API simulada. Recuperación sin token, vencida, sesión normal, token inválido, válida y token_hash.
- Función desplegada: llamadas reales sin token y con token inválido devuelven HTTP 401.
- Usuario dueño existente: comprobaciones SQL de autorización dentro de una transacción revertida. Conserva acceso a su negocio; no es administrador, no puede listar ni modificar accesos ajenos. No se cambió su contraseña ni se envió correo a ese dueño.
- No se identificó una cuenta existente dedicada a pruebas. No se probó una modificación real de contraseña o entrega de correo.
- Advisors de seguridad ejecutados antes y después del despliegue. Persisten avisos previos: RLS sin políticas en tablas operadas mediante funciones controladas, funciones SECURITY DEFINER ejecutables y protección de contraseñas filtradas desactivada. Este cambio no altera esos objetos.

Referencias de los avisos: [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [SECURITY DEFINER público](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Archivos

Modificados: `index.html`, `panel/administracion.html`, `panel/accesos-duenos.html`, `panel/accesos-duenos.js`, `panel/dueno.html`, `panel/dueno.js`.

Nuevos: `panel/accesos-negocios.css`, `panel/restablecer-contrasena.html`, `panel/restablecer-contrasena.js`, `recuperacion-redireccion.js`, `supabase/config.toml`, `supabase/functions/gestionar-accesos/index.ts`, `supabase/functions/gestionar-accesos/handler.mjs`, `tests/accesos-negocios.mjs`, `tests/accesos-negocios-browser.cjs`, esta guía.
