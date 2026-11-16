const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.join(__dirname,'..'),n=JSON.parse(fs.readFileSync(path.join(root,'cueto-sax.json')));
const server=http.createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(8786,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of [390,1280]){const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let saves=0,uploads=0;
const fixture={slug:n.slug,revision:5,plan:'normal',imagenes:{},original:structuredClone(n),borrador:structuredClone(n)};
await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{const u=route.request().url();let data=[];
if(u.includes('/auth/v1/token'))data={access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'11111111-1111-4111-8111-111111111111',email:'test@example.test'}};
else if(u.includes('/auth/v1/user'))data={id:'11111111-1111-4111-8111-111111111111'};
else if(u.includes('dueno_menus_listar'))data=[fixture];
else if(u.includes('/storage/v1/object/menu-publico/')){uploads++;data={};}
else if(u.includes('cueto_perfil_guardar')){const p=route.request().postDataJSON();assert.equal(p.negocio,'cueto-sax');assert.equal(p.version,fixture.revision);fixture.original={...fixture.original,...p.datos};fixture.borrador={...fixture.borrador,...p.datos};fixture.revision++;saves++;data={publicado:true};}
else if(u.includes('sitio_publicacion'))data={perfiles:[fixture.original],documentos:{categorias:JSON.parse(fs.readFileSync(path.join(root,'categorias.json'))),contactos:{}},promociones:[]};
return route.fulfill({json:data});});
await page.goto('http://127.0.0.1:8786/panel/dueno.html?negocio=cueto-sax');await page.fill('#correo','test@example.test');await page.fill('#clave','test-password');await page.locator('#login button').click();await page.locator('#cueto-editor').waitFor();
assert.equal(await page.locator('#cueto-editor legend').count(),14);assert(await page.locator('.menu-herramientas').isHidden());
const boda=page.locator('#cueto-editor fieldset').first();await boda.getByLabel('Título visible').fill('Bodas elegantes');await boda.getByLabel('Descripción de la tarjeta').fill('Música para tu ceremonia');
const bautizo=page.locator('#cueto-editor fieldset').nth(1);await bautizo.getByLabel('Mostrar esta tarjeta').uncheck();
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
await boda.locator('input[type=file]').setInputFiles({name:'evento.png',mimeType:'image/png',buffer:png});
await page.getByLabel('Agregar fotos al portafolio').setInputFiles([{name:'uno.png',mimeType:'image/png',buffer:png},{name:'dos.png',mimeType:'image/png',buffer:png}]);
const port=page.locator('#cueto-editor section').filter({has:page.getByRole('heading',{name:'Portafolio de presentaciones',exact:true})});await port.getByRole('button',{name:'Bajar posición',exact:true}).first().click();
await page.getByLabel('Slogan',{exact:true}).fill('Sax para tu celebración');await page.getByLabel('Video de presentación',{exact:false}).fill('https://www.youtube.com/watch?v=prueba');
await page.getByRole('button',{name:'Guardar y publicar perfil',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#estado').textContent.includes('Perfil publicado'));
assert.equal(saves,1);assert.equal(uploads,3);assert.equal(fixture.original.servicios[0].nombre,'Bodas elegantes');assert.equal(fixture.original.servicios[1].activo,false);assert.equal(fixture.original.galeria.length,2);
await page.reload();await page.locator('#cueto-editor').waitFor();assert.equal(await page.getByLabel('Slogan',{exact:true}).inputValue(),'Sax para tu celebración');assert.equal(await page.locator('#cueto-editor fieldset').first().getByLabel('Título visible').inputValue(),'Bodas elegantes');
const cards=page.locator('#cueto-editor fieldset');await cards.first().getByRole('button',{name:'Quitar foto',exact:true}).click();const port2=page.locator('#cueto-editor section').filter({has:page.getByRole('heading',{name:'Portafolio de presentaciones',exact:true})});await port2.getByRole('button',{name:'Quitar del portafolio',exact:true}).first().click();
await page.getByRole('button',{name:'Guardar y publicar perfil',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#estado').textContent.includes('Perfil publicado'));assert.equal(saves,2);assert.equal(fixture.original.servicios[0].foto,'');assert.equal(fixture.original.galeria.length,1);
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sin desborde '+width);
await page.goto('http://127.0.0.1:8786/index.html?negocio=cueto-sax');await page.locator('.artista-perfil').waitFor();assert.equal(await page.locator('.artista-perfil .dental-tarjeta').count(),6);assert.equal(await page.getByRole('heading',{name:'Bodas elegantes',exact:true}).count(),1);assert.equal(await page.getByRole('heading',{name:'Bautizos',exact:true}).count(),0);
const url=new URL(await page.locator('.artista-perfil .dental-cita').first().getAttribute('href'));assert.equal(url.pathname,'/529636357763');assert(url.searchParams.get('text').includes('una boda'));assert.deepEqual(errors,[]);console.log('OK Cueto panel/publicación simulada: '+width+'px, 7 tarjetas, editar/ocultar/subir/quitar, portafolio, recarga y CTA');await page.close();}
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
