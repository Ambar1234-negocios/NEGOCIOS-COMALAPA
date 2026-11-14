const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.html')?'text/html':'image/webp');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of [390,320]){
 const page=await browser.newPage({viewport:{width,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let activa=true;
 await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',r=>r.fulfill({json:r.request().url().includes('exhibicion_promocion_publica')?(activa?{porcentaje:50,negocios:['la-casa-del-cofi']}:{porcentaje:0,negocios:[]}):[]}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
 await page.waitForFunction(()=>typeof negocios!=='undefined'&&negocios.comida?.some(n=>n.slug==='la-casa-del-cofi'));
 await page.locator('#cinta-promos button').click();assert.equal(new URL(page.url()).searchParams.get('categoria'),'comida');assert.equal(await page.locator('#promo-terminos').count(),0);
 await page.evaluate(()=>verPerfil('comida',negocios.comida.findIndex(n=>n.slug==='la-casa-del-cofi')));
 const perfil=page.locator('.perfil-negocio');await perfil.locator('.promo-envio-contexto').waitFor();
 assert.equal(await perfil.locator('.promo-envio-contexto').count(),1);assert.equal(await perfil.locator('.comida-menu .promo-envio-contexto').count(),0);
 assert.equal(await perfil.getByText(/50% de descuento en envío/).count(),1);
 const trigger=perfil.getByRole('button',{name:'Términos y condiciones',exact:true});await trigger.click();await page.locator('#promo-terminos').waitFor();await page.keyboard.press('Escape');assert(await trigger.evaluate(n=>n===document.activeElement));
 await trigger.scrollIntoViewIfNeeded();const b=await perfil.locator('.promo-envio-contexto').boundingBox();assert(b.x>=0&&b.x+b.width<=width,'Aviso fuera de pantalla');
 if(process.env.TEST_OUTPUT_DIR){fs.mkdirSync(process.env.TEST_OUTPUT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.TEST_OUTPUT_DIR,'cofi-promo-'+width+'.png')});}
 activa=false;await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));});await perfil.locator('.promo-envio-contexto').waitFor({state:'detached'});assert.deepEqual(errors,[]);
 await page.close();console.log('PASS: perfil real La Casa del Cofi, una mención, modal y desactivación en '+width+'px');
}}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
