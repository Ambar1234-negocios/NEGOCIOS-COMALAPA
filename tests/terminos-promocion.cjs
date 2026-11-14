const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]){
  const page=await browser.newPage({viewport});let activa=true;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/rest/v1/rpc/exhibicion_promocion_publica',r=>r.fulfill({json:activa?{porcentaje:50,negocios:['prueba']}:{porcentaje:0,negocios:[]}}));
  const banner=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<aside id="cinta-promos"[\s\S]*?<\/aside>/)[0];
  await page.setContent('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+banner+'<div id="lista-negocios"><div class="perfil-titulo-oficial" data-promo-contexto="prueba"></div></div></body></html>');
  await page.addStyleTag({path:path.join(root,'cinta-promociones.css')});
  await page.evaluate(()=>{window.negocios={comida:[{slug:'prueba'}]};window.mostrarCategoria=c=>{window.categoriaVisitada=c;};const interval=window.setInterval;window.setInterval=(fn,ms)=>{window.consultarPromo=fn;return interval(fn,ms);};});
  await page.addScriptTag({path:path.join(root,'cinta-promociones.js')});
  await page.locator('#cinta-promos button').click();assert.equal(await page.evaluate(()=>window.categoriaVisitada),'comida');assert.equal(await page.getByRole('dialog').count(),0);
  const trigger=page.getByRole('button',{name:'Términos y condiciones',exact:true}),dialog=page.getByRole('dialog');
  assert.equal(await page.locator('.promo-envio-contexto').count(),1);
  await trigger.click();await dialog.waitFor({state:'visible'});
  assert.equal(await dialog.locator('li').count(),8);assert.match(await dialog.innerText(),/50% de descuento/);assert.doesNotMatch(await dialog.innerText(),/\$|120|saldo_centavos/);
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Cerrar');
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('dialog')));
  const box=await dialog.boundingBox();assert(box.x>=0&&box.width<=viewport.width&&box.y>=0&&box.y+box.height<=viewport.height);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(n=>n===document.activeElement));
  await page.keyboard.press('Enter');await dialog.waitFor({state:'visible'});await page.getByRole('button',{name:'Cerrar',exact:true}).click();await dialog.waitFor({state:'hidden'});
  await trigger.click();await page.mouse.click(2,2);await dialog.waitFor({state:'hidden'});
  await trigger.click();activa=false;await page.evaluate(()=>window.consultarPromo());await dialog.waitFor({state:'hidden'});assert(await page.locator('#cinta-promos').evaluate(n=>n.hidden));assert.equal(await page.locator('.promo-envio-contexto').count(),0);
  activa=true;await page.evaluate(()=>window.consultarPromo());await page.locator('.perfil-titulo-oficial').evaluate(n=>n.replaceWith(n.cloneNode(false)));await trigger.click();await dialog.waitFor({state:'visible'});await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(n=>n===document.activeElement));
  assert.deepEqual(errors,[]);await page.close();console.log('PASS: términos, foco, teclado, cierre y promoción inactiva en '+viewport.width+'x'+viewport.height);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
