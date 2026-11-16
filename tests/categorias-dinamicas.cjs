const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),vm=require('vm');
const root=path.join(__dirname,'..');
const base=JSON.parse(fs.readFileSync(path.join(root,'negocios.json'))).find(n=>n.slug==='el-titan-de-las-pinturas');
const document={querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},documentElement:{dataset:{}}},window={MesasExhibicion:{mesa:()=>null}};
vm.runInNewContext(fs.readFileSync(path.join(root,'comida.js'),'utf8'),{window,document,Intl,console,URLSearchParams,location:{search:''},setInterval(){}});
const render=n=>window.ComidaExhibicion.menu(n);
const n={...base,tipoCatalogo:'tecnico',categoriasDinamicas:true,seccionesCatalogo:['Accesorios y más','Impermeabilizantes'],seccionesOcultas:[],productos:[{id:'qa',nombre:'Brocha QA',precio:null,seccion:'Accesorios y más',disponible:true},{id:'qa2',nombre:'Imper QA',precio:50,seccion:'Impermeabilizantes',disponible:true}]};
assert(render(n).indexOf('Accesorios y más')<render(n).indexOf('Impermeabilizantes'));
assert(!render({...n,seccionesOcultas:['Accesorios y más']}).includes('Brocha QA'));
assert(render({...n,productos:[{id:'sin',nombre:'Sin categoría',disponible:true}]}).includes('Otros productos'));
assert(!render(n).includes('$0.00'));assert(!render(n).includes('<details'));
assert(render({...n,slug:'futuro-negocio'}).includes('Brocha QA'));
const server=http.createServer((req,res)=>{try{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(ok=>server.listen(8772,'127.0.0.1',ok));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});try{
 for(const pagina of ['dueno.html','menu-completo.html'])for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const perfil={...n,seccionesCatalogo:['Impermeabilizantes'],productos:[n.productos[1]]},fixture={slug:perfil.slug,revision:8,plan:'normal',imagenes:{},original:perfil,borrador:structuredClone(perfil)};
 await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{const u=route.request().url();let data=[];
 if(u.includes('catalogo_seccion_administrar')){const d=route.request().postDataJSON(),p=fixture.borrador;assert.equal(d.version,fixture.revision);
 if(d.accion==='crear')p.seccionesCatalogo.push(d.seccion);
 if(d.accion==='renombrar'){p.seccionesCatalogo=p.seccionesCatalogo.map(c=>c===d.seccion?d.nombre:c);p.productos.forEach(x=>{if(x.seccion===d.seccion)x.seccion=d.nombre;});}
 if(d.accion==='ordenar'){p.seccionesCatalogo.splice(p.seccionesCatalogo.indexOf(d.seccion),1);p.seccionesCatalogo.splice(d.posicion,0,d.seccion);}
 if(d.accion==='ocultar')p.seccionesOcultas.push(d.seccion);
 if(d.accion==='mostrar')p.seccionesOcultas=p.seccionesOcultas.filter(c=>c!==d.seccion);
 fixture.original=structuredClone(p);fixture.revision++;data={seccion:d.nombre||d.seccion,revision:fixture.revision,creada:d.accion==='crear'};
 }else if(u.includes('menu_producto_crear')){const d=route.request().postDataJSON();assert.equal(d.datos.seccion,'Accesorios y más');fixture.borrador.productos.push({...d.datos,id:d.producto});fixture.original=structuredClone(fixture.borrador);fixture.revision++;data={revision:fixture.revision};}
 else if(u.includes('/auth/v1/token'))data={access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'11111111-1111-4111-8111-111111111111',email:'qa@example.test'}};
 else if(u.includes('/auth/v1/user'))data={id:'11111111-1111-4111-8111-111111111111'};
 else if(u.includes('piloto_menus_completos')||u.includes('dueno_menus_listar'))data=[fixture];else if(u.includes('piloto_es_admin'))data=true;
 return route.fulfill({json:data});});
 await page.goto('http://127.0.0.1:8772/panel/'+pagina+'?negocio='+n.slug);await page.fill('#correo','qa@example.test');await page.fill('#clave','fixture-password');await page.locator('#login button').click();await page.locator('#administrar-categorias').waitFor();
 await page.locator('#nueva-seccion-catalogo').click();await page.fill('#nueva-seccion-nombre','Accesorios y más');await page.locator('#nueva-seccion-dialogo').getByRole('button',{name:'Crear sección',exact:true}).click();await page.locator('#nueva-seccion-dialogo').waitFor({state:'hidden'});
 await page.locator('#nuevo-producto').click();assert(await page.locator('#seccion-elegida').isVisible());await page.selectOption('#seccion-elegida','Accesorios y más');await page.fill('#editar-nombre','Brocha QA');await page.fill('#ficha-contenido-0','Ficha técnica de prueba');await page.locator('#guardar-completo').click();try{await page.locator('#editor-menu').waitFor({state:'hidden',timeout:5000});}catch(e){console.log(await page.locator('#estado').textContent(),await page.locator('#error-producto-opciones').textContent());throw e;}
 assert.equal(await page.locator('#administrar-categorias').getAttribute('open'),null);await page.locator('#administrar-categorias summary').click();
 const row=()=>page.locator('#administrar-categorias .acciones-seccion').filter({has:page.locator('input[aria-label="Nombre de Accesorios y más"]')});
 assert(await row().getByRole('button',{name:'Eliminar categoría',exact:true}).isDisabled());
 await row().getByRole('button',{name:'Subir',exact:true}).click();await page.waitForFunction(()=>menuCompleto.borrador.seccionesCatalogo[0]==='Accesorios y más');
 await row().getByRole('button',{name:'Ocultar',exact:true}).click();await row().getByRole('button',{name:'Mostrar',exact:true}).waitFor();assert(!render(fixture.original).includes('Brocha QA'));
 await row().getByRole('button',{name:'Mostrar',exact:true}).click();await row().getByRole('button',{name:'Ocultar',exact:true}).waitFor();assert(render(fixture.original).includes('Brocha QA'));
 await row().locator('input').fill('Accesorios renombrados');await row().getByRole('button',{name:'Renombrar',exact:true}).click();await page.locator('input[aria-label="Nombre de Accesorios renombrados"]').waitFor();
 await page.reload();await page.locator('#administrar-categorias summary').click();await page.locator('input[aria-label="Nombre de Accesorios renombrados"]').waitFor();assert.equal(fixture.borrador.productos.at(-1).seccion,'Accesorios renombrados');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pagina,width,ok:true,checks:'crear, selector, producto, orden, ocultar/mostrar público, renombrar, recargar, eliminación bloqueada'}));await context.close();
 }
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exit(1)});
