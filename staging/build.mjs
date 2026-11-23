import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const productionProject = 'gyvoyzxsgckpfkagzjtf';
const productionHost = 'exhibicionfronteracomalapa.com';
const url = process.env.STAGING_SUPABASE_URL?.trim() ?? '';
const key = process.env.STAGING_SUPABASE_ANON_KEY?.trim() ?? '';

function isPublicKey(value, project) {
  if (/^sb_publishable_[\w-]+$/.test(value)) return true;
  try {
    const segments = value.split('.');
    if (segments.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString());
    return payload.role === 'anon' && payload.ref === project;
  } catch {
    return false;
  }
}

if (url || key) {
  const project = /^https:\/\/([a-z0-9]{20})\.supabase\.co$/.exec(url)?.[1];
  if (!project || project === productionProject || !isPublicKey(key, project)) {
    throw new Error('Usa una URL de Supabase separada y su clave pública (publishable o anon).');
  }
}

const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(name =>
    /\.(html|css|js|json|svg|png|jpe?g|webp|gif|ico|avif|woff2?|wasm|mp4|pdf)$/i.test(name) &&
    !/^(\.|staging\/|tests\/|supabase\/|sql\/|docs\/)|backup|respaldo/i.test(name) &&
    !/^(package(?:-lock)?\.json)$/i.test(name)
  );
const routes = ['index.html', 'panel/administracion.html', 'panel/recepcion.html',
  'panel/menu-completo.html', 'panel/dueno.html'];
for (const route of routes) {
  if (!files.includes(route)) throw new Error(`Falta la ruta ${route}`);
}

const output = mkdtempSync(join(root, '.staging-build-'));
const api = url || 'https://supabase-pruebas.invalid';
const productionApi = `https://${productionProject}.supabase.co`;
const escapedHost = value => new URL(value).hostname.replaceAll('.', '\\.');
const productionOrigin = /https?:\/\/(?:www\.)?exhibicionfronteracomalapa\.com(?=[/?#"'\x60\s]|$)/gi;
const bootstrap = '<meta charset="utf-8"><script src="/entorno-pruebas.js"></script>';
const banner = '<aside id="aviso-entorno-pruebas">🧪 MODO DE PRUEBAS — Nada de lo que hagas aquí afecta la página real</aside>';
const css = '<link rel="stylesheet" href="/entorno-pruebas.css">';

for (const name of files) {
  const source = join(root, name);
  const target = join(output, name);
  mkdirSync(dirname(target), { recursive: true });
  if (!['.html', '.css', '.js', '.json', '.svg'].includes(extname(name).toLowerCase())) {
    copyFileSync(source, target);
    continue;
  }

  let content = readFileSync(source, 'utf8');
  if (!name.startsWith('panel/vendor/')) {
    content = content.replaceAll(productionApi, api)
      .replaceAll(escapedHost(productionApi), escapedHost(api))
      .replace(/\bsb_publishable_[\w-]+/g, key || 'pruebas-sin-supabase')
      .replace(productionOrigin, '');
    if (content.includes(productionProject) || /\bsb_secret_[\w-]+/.test(content)) {
      throw new Error(`Referencia de producción o clave privada en ${name}`);
    }
  }
  if (name.endsWith('.html')) {
    if (!/<head(?:\s[^>]*)?>/i.test(content)) {
      content = content.replace(/<html(?:\s[^>]*)?>/i, '$&<head></head>');
    }
    if (!/<head(?:\s[^>]*)?>/i.test(content)) throw new Error(`Falta la cabecera en ${name}`);
    content = content.replace(/<head(?:\s[^>]*)?>/i, `$&${bootstrap}${css}`);
    content = /<body(?:\s[^>]*)?>/i.test(content)
      ? content.replace(/<body(?:\s[^>]*)?>/i, `$&${banner}`)
      : content.replace(/<\/head>/i, `$&${banner}`);
  }
  writeFileSync(target, content);
}

const guard = readFileSync(join(root, 'staging/guard.js'), 'utf8');
writeFileSync(join(output, 'entorno-pruebas.js'),
  `Object.defineProperty(window, 'ENTORNO', { value: Object.freeze(${JSON.stringify({
    ambiente: 'staging', supabaseConfigurado: Boolean(url), accionesExternas: false, productionHost
  })}) });\n${guard}`);
copyFileSync(join(root, 'staging/banner.css'), join(output, 'entorno-pruebas.css'));
copyFileSync(join(root, '_redirects'), join(output, '_redirects'));
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self'${url ? ` ${url}/rest/v1/ ${url}/auth/v1/ ${url}/storage/v1/` : ''}`,
  `img-src 'self' data: blob:${url ? ` ${url}/storage/v1/` : ''}`,
  "font-src 'self' data:",
  "frame-src 'none'", "worker-src 'none'", "object-src 'none'", "base-uri 'none'",
  "frame-ancestors 'none'", "form-action 'none'"
].join('; ');
writeFileSync(join(output, '_headers'), `/*
  Content-Security-Policy: ${csp}
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-store
`);
writeFileSync(join(output, 'wrangler.json'), JSON.stringify({
  name: 'negocios-comalapa-staging',
  compatibility_date: '2026-11-23',
  workers_dev: true,
  preview_urls: false,
  routes: [{ pattern: 'pruebas.exhibicionfronteracomalapa.com', custom_domain: true }],
  assets: { directory: '.', html_handling: 'none', not_found_handling: 'none' }
}, null, 2));
writeFileSync(join(output, '.assetsignore'), 'wrangler.json\n');
process.stdout.write(output + '\n');
