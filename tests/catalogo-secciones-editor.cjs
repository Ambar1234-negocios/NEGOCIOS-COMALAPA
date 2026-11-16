const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.join(__dirname,'..'),base=JSON.parse(fs.readFileSync(path.join(root,'negocios.json'))).find(n=>n.slug==='shopping-morales');
const vestido=base.productos[0];
const prendas=[...Array.from({length:30},(_,i)=>({...vestido,id:'vestido-'+i,nombre:'Vestido de prueba '+i})),{...vestido,id:'blusa',nombre:'Blusa de prueba',seccion:'Blusas'},{...vestido,id:'camisa',nombre:'Camisa de prueba',seccion:'Camisas'},{...vestido,id:'oculta',nombre:'Blusa oculta',seccion:'Blusas',disponible:false},{...vestido,id:'eliminada',nombre:'Blusa eliminada',seccion:'Blusas',eliminado:true}];
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':'application/json');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(ok=>server.listen(8769,'127.0.0.1',ok));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
try{for(const pagina of ['menu-completo.html','dueno.html'])for(const width of [320,390,1280]){
const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage(),errors=[];let saved;
const perfil={...base,productos:structuredClone(prendas)},fixture={slug:perfil.slug,revision:3,plan:'normal',imagenes:{},original:perfil,borrador:structuredClone(perfil)};
page.on('pageerror',e=>errors.push(e.message));await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{const u=route.request().url();let data=[];
if(u.includes('catalogo_visual_modelo_guardar')){saved=route.request().postDataJSON();const nuevo={...saved.datos,id:saved.producto};fixture.borrador.productos.push(nuevo);fixture.revision++;return route.fulfill({json:{revision:fixture.revision}});}
if(u.includes('/auth/v1/token'))data={access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'11111111-1111-4111-8111-111111111111',email:'prueba@example.test'}};
else if(u.includes('/auth/v1/user'))data={id:'11111111-1111-4111-8111-111111111111'};
else if(u.includes('piloto_menus_completos')||u.includes('dueno_menus_listar'))data=[fixture];else if(u.includes('piloto_es_admin'))data=true;return route.fulfill({json:data});});
await page.goto('http://127.0.0.1:8769/panel/'+pagina+'?negocio=shopping-morales');await page.fill('#correo','prueba@example.test');await page.fill('#clave','clave-de-prueba');await page.locator('#login button').click();await page.locator('#catalogo-secciones').waitFor();
const nav=page.locator('#catalogo-secciones');assert.equal(await page.locator('#lista-completa .fila-menu').count(),33);
await nav.getByRole('button',{name:'Vestidos (30)',exact:true}).click();assert.equal(await page.locator('#lista-completa .fila-menu').count(),30);assert.equal(await nav.getByRole('button',{name:'Vestidos (30)',exact:true}).getAttribute('aria-pressed'),'true');
await nav.getByRole('button',{name:'Blusas (2)',exact:true}).click();assert.equal(await page.locator('#lista-completa .fila-menu').count(),2);assert(!(await page.locator('#lista-completa').textContent()).includes('Vestido de prueba'));
await page.locator('#lista-completa .fila-menu').first().getByRole('button',{name:'Editar',exact:false}).click();assert.equal(await page.inputValue('#editar-nombre'),'Blusa de prueba');await page.locator('#cerrar-editor').click();
await page.locator('#nuevo-producto').click();assert.equal(await page.inputValue('#seccion-elegida'),'Blusas');await page.fill('#editar-nombre','Nueva blusa de prueba');await page.locator('#guardar-completo').click();await page.locator('#editor-menu').waitFor({state:'hidden'});
assert.equal(saved.datos.seccion,'Blusas');assert.equal(await nav.getByRole('button',{name:'Blusas (3)',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#lista-completa .fila-menu').count(),3);
await nav.getByRole('button',{name:'Camisas (1)',exact:true}).click();assert.equal(await page.locator('#lista-completa .fila-menu').count(),1);
await page.fill('#buscar-menu','inexistente');assert.equal(await page.locator('#lista-completa .fila-menu').count(),0);await nav.getByRole('button',{name:'Vestidos (30)',exact:true}).click();assert.equal(await page.inputValue('#buscar-menu'),'');assert.equal(await page.locator('#lista-completa .fila-menu').count(),30);
await page.locator('#recargar').click();assert.equal(await nav.getByRole('button',{name:'Vestidos (30)',exact:true}).getAttribute('aria-pressed'),'true');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sin desborde '+width);assert.equal(await nav.evaluate(e=>getComputedStyle(e).position),'sticky');
await page.evaluate(()=>{menuCompleto.borrador.tipoCatalogo='comida';pintarMenuCompleto();});assert(await nav.isHidden());assert(await page.locator('#categoria-menu').isVisible());assert.deepEqual(errors,[]);
console.log(JSON.stringify({pagina,width,ok:true,checks:['filtra 30 vestidos','editar solo la sección elegida','sección automática al crear','conserva filtro al guardar y recargar','incluye secciones propias y prendas ocultas','sin desborde','no cambia menús de otros negocios']}));await context.close();}
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exit(1)});
