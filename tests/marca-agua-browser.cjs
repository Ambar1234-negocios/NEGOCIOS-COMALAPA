const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const raiz = path.resolve(__dirname, '..');
const foto = '/imagenes/foto-prueba.png';
const fila = {slug: 'marca-prueba', usar_negocio: true, usar_exhibicion: true,
  imagen: 'marca-prueba/1.webp', posicion: 'derecha', intensidad: 'media'};
const comun = {id: true, imagen: 'exhibicion/2.webp'};
let png;
let preferencia = fila;
const peticiones = [];
const server = http.createServer((req, res) => {
  const ruta = new URL(req.url, 'http://localhost').pathname;
  if (ruta === foto) {
    res.writeHead(200, {'Content-Type': 'image/png'}).end(png);
    return;
  }
  const archivo = path.join(raiz, ruta);
  const tipo = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css'};
  if (!archivo.startsWith(raiz + path.sep) || !fs.existsSync(archivo)) return res.writeHead(404).end();
  res.writeHead(200, {'Content-Type': tipo[path.extname(archivo)] || 'application/octet-stream'})
    .end(fs.readFileSync(archivo));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origen = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH});
  try {
    const page = await browser.newPage();
    const crear = color => page.evaluate(color => {
      const c = document.createElement('canvas');
      c.width = 100;
      c.height = 90;
      const ctx = c.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, c.width, c.height);
      return c.toDataURL().split(',')[1];
    }, color).then(s => Buffer.from(s, 'base64'));
    png = await crear('white');
    const roja = await crear('red');
    const azul = await crear('blue');
    await page.route('https://**/*', route => {
      const req = route.request();
      const ruta = new URL(req.url()).pathname;
      if (ruta.includes('/object/public/marcas-agua/')) {
        return route.fulfill({contentType: 'image/png',
          headers: {'Access-Control-Allow-Origin': '*'}, body: ruta.includes('/exhibicion/') ? azul : roja});
      }
      if (ruta.includes('/object/marcas-agua/')) {
        peticiones.push(ruta);
        return route.fulfill({json: {Key: ruta}});
      }
      if (ruta.endsWith('/piloto_marca_agua_negocios')) {
        if (req.method() === 'PATCH') {
          preferencia = req.postDataJSON();
          peticiones.push(ruta);
        }
        return route.fulfill({json: [preferencia]});
      }
      if (ruta.endsWith('/piloto_marca_agua_global')) return route.fulfill({json: [comun]});
      return route.fulfill({json: []});
    });
    for (const [propia, exhibicion] of [[false, false], [true, false], [false, true], [true, true]]) {
      preferencia = {...fila, usar_negocio: propia, usar_exhibicion: exhibicion};
      for (const posicion of ['derecha', 'izquierda', 'centro']) {
        preferencia.posicion = posicion;
        await page.goto(origen + '/menu-local.html');
        await page.evaluate(async ({foto, slug}) => {
          await window.MarcaAgua.cargar();
          document.body.innerHTML = '<img id="con"><img id="sin"><img id="logo">';
          window.MarcaAgua.asignar(document.querySelector('#con'), foto, slug);
          window.MarcaAgua.asignar(document.querySelector('#sin'), foto, 'otro');
          document.querySelector('#logo').src = foto;
        }, {foto, slug: fila.slug});
        await page.waitForFunction(() => [...document.images].every(img =>
          img.complete && img.naturalWidth && !img.hasAttribute('data-marca-pendiente')));
        assert.equal(await page.locator('#con').evaluate(img => img.src.startsWith('data:')), propia || exhibicion);
        assert.equal(await page.locator('#sin').getAttribute('src'), foto);
        assert.equal(await page.locator('#logo').getAttribute('src'), foto);
        const pixeles = await page.locator('#con').evaluate(img => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return Object.fromEntries([['izquierda', 12, 77], ['derecha', 87, 77], ['centro', 48, 48]]
            .map(([nombre, x, y]) => [nombre, [...ctx.getImageData(x, y, 1, 1).data]]));
        });
        if (propia || exhibicion) assert(Math.min(...pixeles[posicion]) < 240);
        for (const otra of Object.keys(pixeles).filter(x => x !== posicion)) {
          assert(Math.min(...pixeles[otra]) > 247);
        }
      }
    }
    await page.goto(origen + '/panel/menu-completo.html');
    await page.evaluate(({slug, foto}) => {
      cuenta = {access_token: 'prueba'};
      menuCompleto = {slug, borrador: {nombre: 'Negocio de prueba'},
        original: {productos: [{nombre: 'Foto de prueba', foto: foto.slice(1)}]}};
      document.getElementById('panel').hidden = false;
    }, {slug: fila.slug, foto});
    await page.locator('#abrir-marca-agua').evaluate(button => button.click());
    await page.waitForFunction(() => document.getElementById('marca-agua-preview').src.startsWith('data:'));
    await page.locator('#marca-agua-posicion').selectOption('izquierda');
    await page.locator('#marca-agua-intensidad').selectOption('fuerte');
    await page.locator('#marca-agua-exhibicion').uncheck();
    await page.locator('#marca-agua-archivo').setInputFiles({name: 'marca.png', mimeType: 'image/png', buffer: roja});
    assert.equal(peticiones.length, 0);
    await page.getByRole('button', {name: 'Guardar preferencias del negocio'}).click();
    await page.waitForFunction(() => document.getElementById('marca-agua-estado').textContent.includes('guardadas'));
    assert.equal(preferencia.usar_negocio, true);
    assert.equal(preferencia.usar_exhibicion, false);
    assert.equal(preferencia.intensidad, 'fuerte');
    assert.equal(preferencia.posicion, 'izquierda');
    assert.match(preferencia.imagen, /^marca-prueba\/[0-9a-f-]+\.webp$/);
    assert.equal(peticiones.length, 2);
    console.log('OK: cuatro combinaciones, tres posiciones, aislamiento, vista previa, carga y guardado.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => server.close());
