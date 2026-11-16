const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.join(__dirname,'..'),perfil=JSON.parse(fs.readFileSync(path.join(root,'negocios.json'))).find(n=>n.slug==='shopping-morales');
const prenda={...perfil.productos[0],gruposOpciones:[],extras:[]};
const fixture={slug:perfil.slug,revision:3,plan:'normal',imagenes:{},original:{...perfil,productos:[prenda]},borrador:{...perfil,productos:[prenda]}};
const image=fs.readFileSync(path.join(root,prenda.foto));
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':'application/json');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(ok=>server.listen(8768,'127.0.0.1',ok));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
try{for(const pagina of ['menu-completo.html','dueno.html'])for(const width of [320,390,1280]){
const context=await browser.newContext({viewport:{width,height:740}}),page=await context.newPage(),errors=[];let saved,uploads=0;
page.on('pageerror',e=>errors.push(e.message));
await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{const u=route.request().url();let data=[];
if(u.includes('/object/public/'))return route.fulfill({body:image,contentType:'image/webp'});
if(u.includes('/object/menu-publico/')){uploads++;return route.fulfill({json:{Key:'ok'}});}
if(u.includes('catalogo_visual_modelo_guardar')){saved=route.request().postDataJSON();return route.fulfill({json:{revision:4}});}
if(u.includes('/auth/v1/token'))data={access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'11111111-1111-4111-8111-111111111111',email:'prueba@example.test'}};
else if(u.includes('/auth/v1/user'))data={id:'11111111-1111-4111-8111-111111111111'};
else if(u.includes('piloto_menus_completos')||u.includes('dueno_menus_listar'))data=[fixture];
else if(u.includes('piloto_es_admin'))data=true;
return route.fulfill({json:data});});
await page.goto('http://127.0.0.1:8768/panel/'+pagina+'?negocio=shopping-morales');
await page.fill('#correo','prueba@example.test');await page.fill('#clave','clave-de-prueba');await page.locator('#login button').click();
await page.locator('#lista-completa .fila-menu').waitFor();
for(const crear of [false,true]){
if(crear)await page.locator('#nuevo-producto').click();else await page.locator('#lista-completa .fila-menu').first().getByRole('button',{name:'Editar',exact:false}).click();
await page.locator('#editor-menu').waitFor();
assert.equal(await page.locator('.editor-foto #ficha-agregar').count(),1,'El selector debe estar en Fotos, arriba del formulario: '+pagina);
const control=await page.locator('#ficha-agregar').boundingBox(),dialogo=await page.locator('#editor-menu').boundingBox();assert(control&&control.y>=dialogo.y&&control.y+control.height<=dialogo.y+dialogo.height,'El selector debe verse al abrir la tarjeta');
assert(await page.locator('#ficha-agregar').isEnabled());assert(await page.locator('label[for="ficha-agregar"]').isVisible());
if(!crear)await page.waitForFunction(()=>document.querySelector('#ficha-fotos img')?.naturalWidth>0);
const elegir=page.waitForEvent('filechooser');await page.locator('#ficha-agregar').click();const chooser=await elegir;assert(chooser.isMultiple());
await chooser.setFiles([{name:'nueva-foto.webp',mimeType:'image/webp',buffer:image}]);await page.waitForFunction(n=>fichaFotos.length===n,crear?1:2);
if(!crear){const reemplazar=page.waitForEvent('filechooser');await page.locator('#ficha-fotos>div').first().getByRole('button',{name:'Reemplazar',exact:true}).click();await(await reemplazar).setFiles({name:'reemplazo.webp',mimeType:'image/webp',buffer:image});await page.waitForFunction(()=>!!fichaFotos[0].blob);}
await page.fill('#editar-nombre',crear?'Prenda de prueba nueva':'Prenda de prueba editada');await page.locator('#guardar-completo').click();await page.locator('#editor-menu').waitFor({state:'hidden'});
assert(saved);assert.equal(saved.datos.precio,null);assert.equal(saved.datos.fichaAvanzada.fotos.length,crear?1:2);assert(saved.datos.fichaAvanzada.fotos.every(src=>src.includes('/storage/v1/object/public/menu-publico/')));assert(uploads>=1);
}
await page.evaluate(p=>{menuCompleto.borrador.tipoCatalogo='comida';abrirProducto({...p,precio:100});},prenda);
assert.equal(await page.locator('.editor-foto #ficha-editor').count(),0);assert(await page.locator('#ficha-activa').isVisible());
await page.locator('#cerrar-editor').click();
assert.deepEqual(errors,[]);console.log(JSON.stringify({pagina,width,ok:true,checks:['selector visible al abrir','abre selector nativo múltiple','miniatura local visible','subir y reemplazar','guardar foto en prenda nueva y existente sin precio','conserva fichas de otros negocios']}));await context.close();}
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exit(1)});
