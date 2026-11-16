const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(ok=>server.listen(8774,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();const errors=[],actions=[];let active=true;
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{
    const url=new URL(route.request().url()),data=route.request().postDataJSON();let result;
    if(url.pathname==='/auth/v1/user')result={id:'admin',email:'admin@example.com'};
    else if(url.pathname.endsWith('/piloto_es_admin'))result=true;
    else if(url.pathname.includes('piloto_menus_completos'))result=[{slug:'prueba',original:{nombre:'Negocio de prueba'}}];
    else if(url.pathname.endsWith('/gestionar-accesos')){
     if(data.accion==='listar')result={accesos:[{correo:'test@example.com',negocio:'prueba',nombre:'Negocio de prueba',activo:active,actualizado_en:'2026-11-16T12:00:00+00:00'}]};
     else{actions.push(data);if(data.accion==='estado')active=data.activo;result={mensaje:'Operación completada'};}
    }else throw Error(url.pathname);
    await route.fulfill({json:result});
   });
   await page.addInitScript(()=>sessionStorage.setItem('exhibicionPilotoSesion',JSON.stringify({access_token:'test-token',expires_at:Math.floor(Date.now()/1000)+3600,user:{email:'admin@example.com'}})));
   await page.goto('http://127.0.0.1:8774/panel/accesos-duenos.html');
   await page.getByRole('heading',{name:'Negocio de prueba'}).waitFor();assert(await page.locator('#lista-duenos').innerText().then(s=>s.includes('Actualizado:')));
   await page.getByRole('button',{name:'Enviar recuperación',exact:true}).click();assert.equal(actions.length,0);
   await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(actions.length,0);
   await page.getByRole('button',{name:'Enviar recuperación',exact:true}).click();await page.getByRole('button',{name:'Confirmar acción'}).click();await page.locator('#confirmar-accion').waitFor({state:'hidden'});assert.equal(actions.at(-1).accion,'recuperacion');
   await page.getByRole('button',{name:'Asignar contraseña temporal',exact:true}).click();await page.locator('#temporal').fill('Temporal-Prueba123');await page.locator('#temporal-confirmar').fill('Diferente-Prueba123');await page.getByRole('button',{name:'Confirmar acción'}).click();await page.getByText('Las contraseñas no coinciden.',{exact:true}).first().waitFor();assert.equal(actions.length,1);
   await page.locator('#temporal-confirmar').fill('Temporal-Prueba123');await page.getByRole('button',{name:'Confirmar acción'}).click();await page.locator('#confirmar-accion').waitFor({state:'hidden'});assert.equal(actions.at(-1).accion,'temporal');assert.equal(await page.locator('#temporal').inputValue(),'');
   for(const name of ['Desactivar acceso','Reactivar acceso']){await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Confirmar acción'}).click();await page.locator('#confirmar-accion').waitFor({state:'hidden'});}
   assert.equal(actions.at(-1).activo,true);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
   console.log(JSON.stringify({width,adminUI:'confirmations, cancel, recovery, password mismatch, temporary password, disable/reactivate, responsive: OK'}));await context.close();
  }
  const token=method=>'a.'+Buffer.from(JSON.stringify({sub:'owner',exp:Math.floor(Date.now()/1000)+3600,amr:[{method}]})).toString('base64url')+'.c';
  for(const scenario of ['missing','expired','normal','invalid','recovery','token_hash']){
   const context=await browser.newContext(),page=await context.newPage();let updates=0;
   await page.route('**/gyvoyzxsgckpfkagzjtf.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(scenario==='invalid')return route.fulfill({status:401,json:{}});
    if(url.pathname.endsWith('/verify'))return route.fulfill({json:{access_token:token('otp')}});
    if(req.method()==='PUT'){updates++;assert.deepEqual(req.postDataJSON(),{password:'Personal-Prueba123'});}
    return route.fulfill({json:{id:'owner',email:'test@example.com'}});
   });
   const suffix=scenario==='missing'?'':scenario==='expired'?'#error=access_denied&error_code=otp_expired':scenario==='token_hash'?'?type=recovery&token_hash=test-hash':'#type=recovery&access_token='+token(scenario==='normal'?'password':'otp');
   await page.goto('http://127.0.0.1:8774/panel/restablecer-contrasena.html'+suffix);
   await page.waitForFunction(()=>!document.getElementById('recuperacion-estado').textContent.includes('Validando'));
   assert.equal(new URL(page.url()).hash,'');assert.equal(new URL(page.url()).search,'');
   if(['recovery','token_hash'].includes(scenario)){
    assert(await page.locator('#nueva-contrasena').isVisible());await page.locator('#nueva').fill('Personal-Prueba123');await page.locator('#repetir').fill('Personal-Prueba123');await page.getByRole('button',{name:'Guardar nueva contraseña'}).click();await page.getByText('Contraseña actualizada.',{exact:false}).waitFor();assert.equal(updates,1);
   }else{assert(await page.locator('#nueva-contrasena').isHidden());assert.equal(updates,0);}
   assert.equal(await page.evaluate(()=>sessionStorage.length),0);await context.close();console.log(JSON.stringify({recovery:scenario,result:'OK'}));
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
