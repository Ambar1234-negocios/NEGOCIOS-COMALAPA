import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, REDIRECT } from '../supabase/functions/gestionar-accesos/handler.mjs';
const fixture={correo:'test@example.com',negocio:'tienda-prueba',activo:true,actualizado_en:'2026-11-16T10:00:00+00:00'};
function setup({admin=true,valid=true,targetAdmin=false,missing=false,recoverStatus=200,conflict=false}={}){
 const calls=[];let row={...fixture};
 const handle=createHandler({env:n=>n==='SUPABASE_URL'?'https://test.supabase.co':'SERVER_SECRET',fetcher:async(url,options)=>{
  const u=new URL(url);const body=options.body?JSON.parse(options.body):null;calls.push({url:u,options,body});
  const reply=(data,status=200)=>Response.json(data,{status});
  if(u.pathname==='/auth/v1/user')return reply(valid?{id:'actor'}:{},valid?200:401);
  if(u.pathname==='/rest/v1/piloto_administradores')return reply(u.searchParams.get('usuario_id')==='eq.actor'?(admin?[{usuario_id:'actor'}]:[]):(targetAdmin?[{usuario_id:'target'}]:[]));
  if(u.pathname==='/rest/v1/dueno_accesos_v53'){
   if(options.method==='PATCH'){if(conflict)return reply([]);assert.deepEqual(Object.keys(body).sort(),['activo','actualizado_en']);row={...row,...body};return reply([row]);}
   return reply(missing?[]:[row]);
  }
  if(u.pathname==='/rest/v1/piloto_menus_completos')return reply([{slug:'tienda-prueba',nombre:'Tienda de prueba'}]);
  if(u.pathname==='/auth/v1/admin/users')return reply({users:[{id:'target',email:fixture.correo}]});
  if(u.pathname==='/auth/v1/recover')return reply({},recoverStatus);
  if(u.pathname==='/auth/v1/admin/users/target')return reply({id:'target'});
  throw Error('Unexpected '+url);
 }});
 const send=async(body,headers={Authorization:'Bearer VALID',Origin:'https://exhibicionfronteracomalapa.com'})=>handle(new Request('https://edge.test',{method:'POST',headers,body:JSON.stringify(body)}));
 return{calls,send};
}
const action=(accion,extra={})=>({...fixture,accion,confirmado:true,...extra});
test('no token, invalid session, owner and spoofed metadata cannot access any action',async()=>{
 for(const accion of ['listar','recuperacion','temporal','estado']){
  let x=setup();assert.equal((await x.send(action(accion),{})).status,401);assert.equal(x.calls.length,0);
  x=setup({valid:false});assert.equal((await x.send(action(accion))).status,401);assert.equal(x.calls.length,1);
  x=setup({admin:false});assert.equal((await x.send(action(accion,{app_metadata:{admin:true},password:'Test-password-123'}))).status,403);assert.equal(x.calls.length,2);
 }
});
test('lists names, emails, exact timestamps and state',async()=>{const x=setup(),r=await x.send({accion:'listar'});assert.equal(r.status,200);assert.deepEqual((await r.json()).accesos,[{...fixture,nombre:'Tienda de prueba'}]);});
test('recovery uses official endpoint and fixed site redirect',async()=>{const x=setup(),r=await x.send(action('recuperacion',{redirect:'https://evil.test'}));assert.equal(r.status,200);const c=x.calls.at(-1);assert.equal(c.url.pathname,'/auth/v1/recover');assert.equal(c.url.searchParams.get('redirect_to'),REDIRECT);assert.deepEqual(c.body,{email:fixture.correo});assert(!(await r.text()).includes('SERVER_SECRET'));});
test('temporary password is updated only on linked nonadmin Auth user',async()=>{const x=setup();assert.equal((await x.send(action('temporal',{password:'Temporary-12345'}))).status,200);assert.equal(x.calls.at(-1).url.pathname,'/auth/v1/admin/users/target');assert.deepEqual(x.calls.at(-1).body,{password:'Temporary-12345'});});
test('rejects missing confirmation, stale row, missing link, admin target and short password',async()=>{
 for(const [settings,body,status] of [[{},action('temporal',{confirmado:false}),400],[{},action('estado',{actualizado_en:'old'}),409],[{missing:true},action('temporal'),404],[{targetAdmin:true},action('temporal',{password:'Temporary-12345'}),403],[{},action('temporal',{password:'short'}),400]]){
  const x=setup(settings);assert.equal((await x.send(body)).status,status);assert(!x.calls.some(c=>c.options.method==='PUT'||c.options.method==='PATCH'));
 }
});
test('disable and reactivate update only the selected business access; never deletes Auth',async()=>{
 const x=setup();assert.equal((await x.send(action('estado',{activo:false}))).status,200);const changed=x.calls.at(-1);assert.equal(changed.body.activo,false);assert.equal(changed.url.searchParams.get('correo'),'eq.test@example.com');assert.equal(changed.url.searchParams.get('negocio'),'eq.tienda-prueba');
 assert.equal((await x.send(action('estado',{activo:true,actualizado_en:changed.body.actualizado_en}))).status,200);assert(!x.calls.some(c=>c.url.pathname.startsWith('/auth/v1/admin')));
 const y=setup({conflict:true});assert.equal((await y.send(action('estado',{activo:false}))).status,409);
});
test('mail provider failure and rate limits show clear errors',async()=>{for(const [code,expected]of [[500,502],[429,429]]){const x=setup({recoverStatus:code});assert.equal((await x.send(action('recuperacion'))).status,expected);}});
test('untrusted origins are rejected before privileged reads',async()=>{const x=setup();assert.equal((await x.send({accion:'listar'},{Authorization:'Bearer VALID',Origin:'https://evil.test'})).status,403);assert.equal(x.calls.length,0);});
