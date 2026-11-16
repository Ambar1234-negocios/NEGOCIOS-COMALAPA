const SITE = 'https://exhibicionfronteracomalapa.com';
export const REDIRECT = SITE + '/panel/restablecer-contrasena.html';
const origins = new Set([SITE, 'https://www.exhibicionfronteracomalapa.com']);
class Failure extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// No credentials, passwords, tokens or upstream response bodies are logged.
export function createHandler({ env, fetcher = fetch }) {
  return async function handle(req) {
    const origin = req.headers.get('origin');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'Vary': 'Origin', ...(origins.has(origin) ? { 'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS' } : {}) };
    const respond = (status, data) => new Response(JSON.stringify(data), { status, headers });
    try {
      if (origin && !origins.has(origin)) throw new Failure(403, 'Origen no autorizado.');
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      if (req.method !== 'POST') throw new Failure(405, 'Usa POST.');
      const authorization = req.headers.get('authorization');
      if (!/^Bearer \S+$/i.test(authorization || '')) throw new Failure(401, 'Inicia sesión como administrador.');
      const base = env('SUPABASE_URL'), secret = env('SUPABASE_SERVICE_ROLE_KEY');
      if (!base || !secret) throw new Failure(503, 'Servicio no configurado.');
      async function call(path, { method = 'GET', body, asUser = false } = {}) {
        const r = await fetcher(base + path, { method, headers: { apikey: secret,
          Authorization: asUser ? authorization : 'Bearer ' + secret,
          'Content-Type': 'application/json', Prefer: 'return=representation' },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          if (asUser) throw new Failure(401, 'La sesión venció. Vuelve a entrar.');
          if (r.status === 429) throw new Failure(429, 'Demasiados intentos. Espera unos minutos.');
          if (path.startsWith('/auth/v1/recover')) throw new Failure(502, 'Supabase no pudo enviar el correo. Revisa el servicio de correo o intenta más tarde.');
          if (path.startsWith('/auth/v1/admin/users/') && method === 'PUT') throw new Failure(422, 'Supabase rechazó la contraseña. Revisa sus requisitos e intenta con otra de al menos 12 caracteres.');
          throw new Failure(502, 'No se pudo completar la operación en Supabase.');
        }
        return data;
      }
      // Fresh identity AND database membership on every call, before privileged reads.
      const actor = await call('/auth/v1/user', { asUser: true });
      if (!actor?.id) throw new Failure(401, 'Sesión inválida.');
      const admin = await call('/rest/v1/piloto_administradores?select=usuario_id&usuario_id=eq.' + encodeURIComponent(actor.id));
      if (!admin.length) throw new Failure(403, 'Solo administradores autorizados gestionan accesos.');
      const raw = await req.text();
      if (raw.length > 4096) throw new Failure(413, 'Solicitud demasiado grande.');
      let body;
      try { body = JSON.parse(raw); } catch { throw new Failure(400, 'Solicitud inválida.'); }
      const { accion, correo, negocio } = body || {};
      if (accion === 'listar') {
        const [accesos, menus] = await Promise.all([
          call('/rest/v1/dueno_accesos_v53?select=correo,negocio,activo,actualizado_en&order=negocio,correo'),
          call('/rest/v1/piloto_menus_completos?select=slug,original->>nombre&order=slug')
        ]);
        return respond(200, { accesos: accesos.map(a => ({ ...a,
          nombre: menus.find(m => m.slug === a.negocio)?.nombre || a.negocio })) });
      }
      if (!['recuperacion', 'temporal', 'estado'].includes(accion) || typeof correo !== 'string' || typeof negocio !== 'string') throw new Failure(400, 'Acción o acceso inválido.');
      if (body.confirmado !== true) throw new Failure(400, 'Confirma la acción antes de continuar.');
      const email = correo.trim().toLowerCase();
      const filter = 'correo=eq.' + encodeURIComponent(email) + '&negocio=eq.' + encodeURIComponent(negocio);
      const rows = await call('/rest/v1/dueno_accesos_v53?select=correo,negocio,activo,actualizado_en&' + filter);
      if (rows.length !== 1) throw new Failure(404, 'El acceso ya no existe. Actualiza la lista.');
      const access = rows[0];
      if (body.actualizado_en !== access.actualizado_en) throw new Failure(409, 'El acceso cambió. Actualiza la lista antes de continuar.');
      if (accion === 'estado') {
        if (typeof body.activo !== 'boolean') throw new Failure(400, 'Estado inválido.');
        const changed = await call('/rest/v1/dueno_accesos_v53?' + filter + '&actualizado_en=eq.' + encodeURIComponent(access.actualizado_en),
          { method: 'PATCH', body: { activo: body.activo, actualizado_en: new Date().toISOString() } });
        if (changed.length !== 1) throw new Failure(409, 'El acceso cambió. Actualiza la lista.');
        return respond(200, { mensaje: body.activo ? 'Acceso reactivado.' : 'Acceso desactivado. La cuenta y los datos del negocio se conservan.' });
      }
      // Resolve only existing linked accounts. Never accept an arbitrary Auth UUID.
      let target;
      for (let page = 1; page <= 100; page++) {
        const data = await call('/auth/v1/admin/users?page=' + page + '&per_page=100');
        target = data.users?.find(u => u.email?.toLowerCase() === email);
        if (target || !data.users || data.users.length < 100) break;
      }
      if (!target) throw new Failure(404, 'No existe la cuenta de Auth para este correo. Preparar un acceso no crea la cuenta.');
      const targetAdmin = await call('/rest/v1/piloto_administradores?select=usuario_id&usuario_id=eq.' + encodeURIComponent(target.id));
      if (targetAdmin.length) throw new Failure(403, 'Esta sección solo gestiona contraseñas de dueños, no de administradores.');
      if (accion === 'recuperacion') {
        await call('/auth/v1/recover?redirect_to=' + encodeURIComponent(REDIRECT), { method: 'POST', body: { email } });
        return respond(200, { mensaje: 'Solicitud de recuperación aceptada por Supabase. Pide al dueño revisar su correo y spam; la entrega depende del servicio de correo.' });
      }
      if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) throw new Failure(400, 'Usa una contraseña de entre 12 y 128 caracteres.');
      await call('/auth/v1/admin/users/' + encodeURIComponent(target.id), { method: 'PUT', body: { password: body.password } });
      return respond(200, { mensaje: 'Contraseña temporal asignada. Compártela por un medio privado y pide al dueño cambiarla desde Recuperar contraseña. Afecta todos sus negocios; no vence automáticamente.' });
    } catch (e) {
      return respond(e instanceof Failure ? e.status : 500, { message: e instanceof Failure ? e.message : 'No se pudo completar la operación. Intenta de nuevo.' });
    }
  };
}
