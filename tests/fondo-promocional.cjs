const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',r=>r.fulfill({json:[]}));
await page.goto('http://127.0.0.1:'+server.address().port+'/panel/recepcion.html');
await page.evaluate(()=>{esMaestroRecepcion=true;fondoGlobal={saldo_centavos:12000,reservado_centavos:2000,disponible_centavos:10000};pintarFondoGlobal();document.getElementById('panel').hidden=false;document.body.classList.add('sesion-autorizada','recepcion-maestra');});
assert.match(await page.locator('#fondo-global').innerText(),/Saldo restante: \$120.*Apoyo pendiente: \$20.*Disponible: \$100/s);
assert.equal(await page.locator('#fondo-global form').count(),1);
await page.getByRole('button',{name:'+$120',exact:true}).click();assert.equal(await page.locator('#fondo-monto').inputValue(),'120');
const messages=await page.evaluate(()=>{const p={cliente:'Prueba',folio:'PRUEBA',tipo:'comida',estado:'cotizado',productos_centavos:15000,servicio_base_centavos:4000,descuento_servicio_centavos:2000,servicio_centavos:2000,entrega:'domicilio',direccion:'Comalapa',pago:'efectivo',minutos:40,lineas:[],detalle:'Prueba',fondo:{estado:'reservada',vigente:true}};const promo=mensajeCotizacion(p),normal=mensajeCotizacion({...p,fondo:null,descuento_servicio_centavos:0,servicio_centavos:4000});return{promo,normal};});
assert.match(messages.promo,/🎉 Servicio a domicilio con 50% de descuento/);assert.match(messages.promo,/🏷️ Descuento aplicado al servicio: \$20/);assert.doesNotMatch(messages.promo,/total a cobrar al cliente|\$120/i);assert.doesNotMatch(messages.normal,/Servicio a domicilio con 50%/);
await page.evaluate(()=>{esMaestroRecepcion=false;pintarFondoGlobal();});assert.equal(await page.locator('#fondo-global form').count(),0);
assert.deepEqual(errors,[]);console.log('PASS: admin topups, reception has no topup control, pending/remaining balances, conditional WhatsApp promo, no public initial balance.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

