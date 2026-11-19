const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',r=>r.fulfill({json:[]}));
await page.goto('http://127.0.0.1:'+server.address().port+'/panel/recepcion.html');
await page.evaluate(()=>{esMaestroRecepcion=true;aplicarPermisosRecepcion();fondoGlobal={saldo_centavos:12000,reservado_centavos:2000,disponible_centavos:10000};pintarFondoGlobal();document.getElementById('panel').hidden=false;document.body.classList.add('sesion-autorizada','recepcion-maestra');});
const fondo=page.locator('#fondo-global');
for(const nombre of ['Por cotizar','En camino','Historial por fecha','Clientes','Resumen']){
  await page.getByRole('button',{name:nombre}).first().click();
  assert.equal(await fondo.isVisible(),false,nombre);
  assert.equal(await fondo.boundingBox(),null,nombre);
}
await page.locator('#abrir-promociones').click();
assert.equal(await fondo.isVisible(),true);
assert.match(await fondo.innerText(),/Saldo restante: \$120.*Descuento pendiente: \$20.*Disponible: \$100/s);
assert.equal(await fondo.locator('form').count(),1);
await fondo.getByRole('button',{name:'Administrar promoción de envío'}).click();
assert.equal(await page.locator('#control-promo-comida').isVisible(),true);
for(const importe of [100,120]){
  await fondo.getByRole('button',{name:'+$'+importe,exact:true}).click();
  assert.equal(await fondo.locator('#fondo-monto').inputValue(),String(importe));
}
await page.evaluate(()=>{
  const apiOriginal=api;
  api=async (ruta,opciones)=>{
    if(ruta!=='/rest/v1/rpc/exhibicion_fondo_cargar')return apiOriginal(ruta,opciones);
    window.cargaSimulada=opciones;
  };
  cargarOperacion=async()=>{window.fondoRecargado=true;};
});
await fondo.getByRole('button',{name:'Cargar saldo',exact:true}).click();
await page.waitForFunction(()=>window.fondoRecargado===true);
const carga=await page.evaluate(()=>window.cargaSimulada);
assert.equal(carga.method,'POST');
assert.equal(carga.datos.monto_centavos,12000);
assert.ok(carga.datos.clave);
const messages=await page.evaluate(()=>{const p={cliente:'Prueba',folio:'PRUEBA',tipo:'comida',estado:'cotizado',productos_centavos:15000,servicio_base_centavos:4000,descuento_servicio_centavos:2000,servicio_centavos:2000,entrega:'domicilio',direccion:'Comalapa',pago:'efectivo',minutos:40,lineas:[],detalle:'Prueba',fondo:{estado:'reservada',vigente:true}};const promo=mensajeCotizacion(p),normal=mensajeCotizacion({...p,fondo:null,descuento_servicio_centavos:0,servicio_centavos:4000});return{promo,normal};});
assert.match(messages.promo,/🎉 Servicio a domicilio con 50% de descuento/);assert.match(messages.promo,/🏷️ Descuento aplicado al servicio: \$20/);assert.doesNotMatch(messages.promo,/total a cobrar al cliente|\$120/i);assert.doesNotMatch(messages.normal,/Servicio a domicilio con 50%/);
await page.evaluate(()=>{esMaestroRecepcion=false;pintarFondoGlobal();});assert.equal(await page.locator('#fondo-global form').count(),0);
assert.deepEqual(errors,[]);console.log('PASS: admin topups, reception has no topup control, pending/remaining balances, conditional WhatsApp promo, no public initial balance.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

