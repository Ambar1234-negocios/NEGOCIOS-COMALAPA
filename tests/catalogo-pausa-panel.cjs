const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{try{const file=path.join(root,req.url.split('?')[0]);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(ok=>server.listen(8768,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true}),page=await browser.newPage();
 let fixture,acciones=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{
  const url=route.request().url(),d=route.request().postDataJSON();
  if(url.includes('catalogo_producto_visibilidad')){
   acciones.push(d);assert.equal(d.negocio,'shopping-morales');
   for(const campo of ['original','borrador'])fixture[campo].productos[0].disponible=d.visible;
   fixture.revision++;return route.fulfill({json:{revision:fixture.revision}});
  }
  if(url.includes('catalogo_seccion_administrar')){
   acciones.push(d);for(const campo of ['original','borrador'])fixture[campo].seccionesCatalogo.push(d.seccion);
   fixture.revision++;return route.fulfill({json:{revision:fixture.revision,seccion:d.seccion,creada:true}});
  }
  return route.fulfill({json:url.includes('piloto_menus_completos')||url.includes('dueno_menus_listar')?[fixture]:url.includes('piloto_es_admin')?true:[]});
 });
 for(const pagina of ['menu-completo.html','dueno.html']){
  const perfil={slug:'shopping-morales',nombre:'Shopping Morales',tipoCatalogo:'visual',categoriasDinamicas:true,seccionesCatalogo:['Blusas','Vacía'],seccionesOcultas:[],productos:[{id:'11111111-1111-4111-8111-111111111111',nombre:'Blusa real simulada',seccion:'Blusas',disponible:true,precio:null,foto:'',fichaAvanzada:{activa:true,fotos:[],secciones:[]}}]};
  fixture={slug:perfil.slug,revision:1,plan:'normal',imagenes:{},original:structuredClone(perfil),borrador:structuredClone(perfil)};
  await page.goto('http://127.0.0.1:8768/panel/'+pagina+'?negocio=shopping-morales');
  await page.evaluate(async()=>{cuenta={access_token:'prueba',user:{id:'11111111-1111-4111-8111-111111111111'}};document.getElementById('panel').hidden=false;await cargarMenuCompleto();});
  await page.getByRole('button',{name:'Pausar Blusa real simulada',exact:true}).click();
  await page.getByRole('button',{name:'Reactivar Blusa real simulada',exact:true}).waitFor();
  assert.equal(acciones.at(-1).visible,false);assert.deepEqual(fixture.original.seccionesCatalogo,['Blusas','Vacía']);
  await page.getByRole('button',{name:'Reactivar Blusa real simulada',exact:true}).click();
  await page.getByRole('button',{name:'Pausar Blusa real simulada',exact:true}).waitFor();assert.equal(acciones.at(-1).visible,true);
  await page.locator('#administrar-categorias summary').click();
  for(const nombre of ['Renombrar','Subir','Bajar','Ocultar','Eliminar categoría'])assert(await page.getByRole('button',{name:nombre,exact:true}).count()>=2);
  await page.locator('#nueva-seccion-catalogo').click();await page.fill('#nueva-seccion-nombre','Próximamente');
  await page.getByRole('button',{name:'Crear sección',exact:true}).click();await page.waitForFunction(()=>!document.getElementById('nueva-seccion-dialogo').open);
  assert(fixture.original.seccionesCatalogo.includes('Próximamente'));
  await page.locator('#nuevo-producto').click();assert(await page.locator('#seccion-elegida option[value="Próximamente"]').count());
  await page.locator('#cerrar-editor').click();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,checks:['pausa y reactivación con un clic en ambos paneles','administración de categorías','creación y selector persistente'],errors}));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
