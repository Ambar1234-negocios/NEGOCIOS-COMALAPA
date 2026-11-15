const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage(),errors=[],requests=[],ledger=new Map();let saldo=8000,reservado=0,accept=true,loseResponse=false,stale=false;
 const state=()=>({saldo_centavos:saldo,reservado_centavos:reservado,disponible_centavos:saldo-reservado});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',async d=>{assert.match(d.message(),/Saldo actual:.*Monto ingresado:.*Diferencia:.*Saldo final:/s);await(accept?d.accept():d.dismiss());});
 // All Supabase traffic is intercepted. These tests cannot mutate the real fund.
 await page.route('https://gyvoyzxsgckpfkagzjtf.supabase.co/**',async r=>{
  const url=r.request().url();
  if(url.endsWith('/exhibicion_fondo_estado'))return r.fulfill({json:state()});
  if(url.endsWith('/exhibicion_fondo_ajustar')){
   const p=r.request().postDataJSON();requests.push(p);
   if(stale){stale=false;saldo+=100;return r.fulfill({status:409,json:{message:'El saldo cambió. Actualiza el fondo y confirma nuevamente.'}});}
   if(!ledger.has(p.p_clave)){assert.equal(p.p_saldo_esperado,saldo);saldo=p.p_accion==='fijar'?p.p_monto_centavos:saldo+(p.p_accion==='restar'?-p.p_monto_centavos:p.p_monto_centavos);ledger.set(p.p_clave,{...p});}
   else assert.deepEqual(p,ledger.get(p.p_clave));
   await new Promise(resolve=>setTimeout(resolve,100));
   if(loseResponse){loseResponse=false;return r.abort('failed');}
   return r.fulfill({json:state()});
  }
  return r.fulfill({json:[]});
 });
 await page.goto('http://127.0.0.1:'+server.address().port+'/panel/recepcion.html');
 await page.evaluate(s=>{esMaestroRecepcion=true;fondoGlobal=s;pintarFondoGlobal();document.getElementById('panel').hidden=false;document.body.classList.add('sesion-autorizada','recepcion-maestra');},state());
 const action=page.locator('#fondo-accion'),amount=page.locator('#fondo-monto'),button=()=>page.locator('#fondo-global form button');
 const waitIdle=()=>page.waitForFunction(()=>!ajustandoFondo&&!trabajando);
 for(const [a,m,expected] of [['agregar','12.34',9234],['restar','20',7234],['fijar','100',10000],['fijar','0',0]]){
  await action.selectOption(a);await amount.fill(m);
  assert.match(await page.locator('#fondo-confirmacion').innerText(),/Saldo actual:.*Monto ingresado:.*Diferencia:.*Saldo final:/);
  await button().click();await waitIdle();assert.equal(saldo,expected);
  assert((await page.locator('#fondo-global').innerText()).includes('Saldo restante: '+await page.evaluate(n=>dineroOperacion(n),expected)));
 }
 // Cancel: no adjustment request.
 accept=false;await amount.fill('10');const before=requests.length;await button().click();await waitIdle();assert.equal(requests.length,before);accept=true;
 for(const bad of ['','-1','1.001','1e2','NaN','100000.01']){await amount.fill(bad);assert(await button().isDisabled(),bad);}
 await action.selectOption('restar');await amount.fill('1');assert(await button().isDisabled());
 await action.selectOption('agregar');await amount.fill('5');
 // Lost response after commit: preserve key, lock editing, survive redraw, retry once.
 loseResponse=true;await button().click();await waitIdle();assert.equal(saldo,500);assert(await amount.isDisabled());
 await page.evaluate(()=>pintarFondoGlobal());assert(await action.isDisabled());
 const count=ledger.size;await button().click();await waitIdle();assert.equal(ledger.size,count);assert.equal(saldo,500);
 assert.deepEqual(requests.at(-1),requests.at(-2));
 // Duplicate submit while the request is pending makes exactly one call.
 await amount.fill('10');const duplicateBefore=requests.length;
 await page.evaluate(()=>{const f=document.querySelector('#fondo-global form');f.requestSubmit();f.requestSubmit();});await waitIdle();assert.equal(requests.length,duplicateBefore+1);
 // Server detects a change after review: clear pending key and show refreshed balance.
 stale=true;await amount.fill('1');await button().click();await waitIdle();assert.equal(await page.evaluate(()=>cargaFondoPendiente),null);
 assert((await page.locator('#fondo-global').innerText()).includes('Saldo restante: $16'));
 await page.evaluate(()=>{esMaestroRecepcion=false;pintarFondoGlobal();});assert.equal(await page.locator('#fondo-global form').count(),0);
 if(process.env.FONDO_PREVIEW_PATH){
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{esMaestroRecepcion=true;fondoGlobal={saldo_centavos:8000,reservado_centavos:0,disponible_centavos:8000};pintarFondoGlobal();document.getElementById('estado').style.display='none';document.getElementById('fondo-global').prepend(nodo('p','VISTA PREVIA · DATOS SIMULADOS'));});
  await action.selectOption('restar');await amount.fill('20');
  await page.locator('#fondo-global').screenshot({path:process.env.FONDO_PREVIEW_PATH});
 }
 assert.deepEqual(errors,[]);console.log('PASS: isolated browser add/subtract/set/zero, preview, confirm/cancel, validation, immediate balance refresh, lost-response retry with identical key, double submit, stale balance recovery, admin-only controls.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
