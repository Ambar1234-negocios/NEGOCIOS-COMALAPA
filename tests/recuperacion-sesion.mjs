import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../panel/restablecer-contrasena.js',import.meta.url),'utf8');
async function run({method='otp',type='recovery',invalid=false,expired=false,sub='owner',tokenHash=false,missing=false}={}){
 const claims={sub,exp:Math.floor(Date.now()/1000)+(expired?-10:3600),amr:[{method}]};
 const token='a.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.c';
 const elements=Object.fromEntries(['recuperacion-estado','nueva-contrasena','guardar-contrasena','nueva','repetir'].map(id=>[id,{hidden:id==='nueva-contrasena',textContent:'',value:'Personal-prueba123',reportValidity:()=>true,reset(){this.resetDone=true;}}]));
 const calls=[],removed=[];let cleaned=false;
 const promise=vm.runInNewContext(code,{
  document:{getElementById:id=>elements[id]},location:{pathname:'/panel/restablecer-contrasena.html',hash:missing?'':tokenHash?'':'#type='+type+'&access_token='+token,search:tokenHash?'?type=recovery&token_hash=one-time-hash':''},
  history:{replaceState(){cleaned=true;}},URLSearchParams,atob:s=>Buffer.from(s,'base64').toString('binary'),Date,Number,sessionStorage:{removeItem:k=>removed.push(k)},
  fetch:async(url,opts)=>{calls.push({url,opts});return{ok:!invalid,status:invalid?401:200,json:async()=>url.endsWith('/verify')?{access_token:token}:{id:'owner',email:'test@example.com'}};}
 });
 await promise;return{elements,calls,removed,cleaned};
}
test('real implicit recovery token uses otp and enables password form',async()=>{const r=await run();assert.equal(r.elements['nueva-contrasena'].hidden,false);assert.match(r.elements['recuperacion-estado'].textContent,/Enlace válido/);assert.equal(r.calls.length,1);assert(r.cleaned);});
test('accepts recovery AMR and verified token_hash carrying OTP',async()=>{for(const settings of [{method:'recovery'},{tokenHash:true}]){const r=await run(settings);assert.equal(r.elements['nueva-contrasena'].hidden,false);}});
test('rejects normal password sessions, non-recovery callbacks, absent token, expired and mismatched identity',async()=>{for(const settings of [{method:'password'},{type:'magiclink'},{missing:true},{expired:true},{sub:'other'},{invalid:true}]){const r=await run(settings);assert.equal(r.elements['nueva-contrasena'].hidden,true);assert(!r.calls.some(c=>c.opts.method==='PUT'));}});
test('valid recovery updates only own password and clears session after explicit submit',async()=>{const r=await run();assert(!r.calls.some(c=>c.opts.method==='PUT'));await r.elements['nueva-contrasena'].onsubmit({preventDefault(){}});const changed=r.calls.find(c=>c.opts.method==='PUT');assert(changed.url.endsWith('/auth/v1/user'));assert.deepEqual(JSON.parse(changed.opts.body),{password:'Personal-prueba123'});assert.equal(r.elements['nueva-contrasena'].hidden,true);assert.match(r.elements['recuperacion-estado'].textContent,/Contraseña actualizada/);});

