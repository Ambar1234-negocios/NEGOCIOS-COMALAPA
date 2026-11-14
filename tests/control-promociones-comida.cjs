const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class Nodo{constructor(tag,text=''){this.tag=tag;this.textContent=text;this.children=[];this.value='';}append(...n){this.children.push(...n);}prepend(n){this.children.unshift(n);}replaceChildren(...n){this.children=n;}focus(){}remove(){this.removed=true;}}
const mapa=new Map([['vista-promociones',new Nodo('section')]]),llamadas=[];
const ctx={console,esMaestroRecepcion:true,edicionPendiente:false,fondoGlobal:{promociones_comida:[{id:'promo',revision:1,titulo:'Semana de apoyo',porcentaje:50,activa:true,mostrar_anuncio:true}]},nodo:(tag,text)=>new Nodo(tag,text),el:id=>mapa.get(id),entrada:(p,id,tipo,tag)=>{const n=new Nodo(tag);n.id=id;mapa.set(id,n);p.append(n);return n;},api:async(url,args)=>{llamadas.push({url,...args});},cargarOperacion:async()=>{},aviso:()=>{},tarea:fn=>fn()};
const original=ctx.nodo;ctx.nodo=(tag,text)=>{const n=original(tag,text);Object.defineProperty(n,'id',{set(id){mapa.set(id,n);},get(){return ''}});return n;};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../panel/promociones-globales-comida.js'),'utf8'),ctx);
function todos(n){return[n,...n.children.flatMap(todos)];}const caja=mapa.get('control-promo-comida');
(async()=>{
assert(caja,'Missing admin controls');let nodos=todos(caja);
await nodos.find(n=>n.textContent==='⏸ Apagar promoción').onclick();assert.equal(llamadas.at(-1).datos.datos.activa,false);assert.equal(llamadas.at(-1).datos.datos.mostrar_anuncio,true);
await nodos.find(n=>n.textContent==='Ocultar anuncio').onclick();assert.equal(llamadas.at(-1).datos.datos.activa,true);assert.equal(llamadas.at(-1).datos.datos.mostrar_anuncio,false);
nodos.find(n=>n.textContent==='✏️ Editar').onclick();mapa.get('global-comida-porcentaje').value='75';mapa.get('global-comida-titulo').value='Semana nueva';
await todos(caja).find(n=>n.tag==='form').onsubmit({preventDefault(){}});assert.equal(llamadas.at(-1).datos.datos.porcentaje,75);assert.equal(llamadas.at(-1).datos.version,1);
await new Promise(setImmediate);ctx.esMaestroRecepcion=false;ctx.pintarControlPromoComida();assert.equal(caja.removed,true);
// Administration general uses the same renderer and RPC, without reception globals.
delete ctx.esMaestroRecepcion;delete ctx.fondoGlobal;delete ctx.cargarOperacion;delete ctx.edicionPendiente;mapa.delete('control-promo-comida');mapa.set('general',new Nodo('section'));
let recargas=0;ctx.pintarControlPromoComida({esAdmin:true,fondo:{saldo_centavos:12000,reservado_centavos:0,disponible_centavos:12000,promociones_comida:[{id:'promo',revision:1,titulo:'Apoyo de Exhibición',porcentaje:50,activa:true,mostrar_anuncio:true}]},contenedor:'general',mostrarSaldo:true,recargar:async()=>{recargas++;}});
const general=todos(mapa.get('control-promo-comida'));assert(general.some(n=>n.textContent.includes('Saldo del fondo: $120.00')));await general.find(n=>n.textContent==='Ocultar anuncio').onclick();assert.equal(recargas,1);assert.equal(llamadas.at(-1).datos.datos.activa,true);
console.log('PASS: admin can disable, hide independently and edit percentage with revision; reception receives no controls.');
})().catch(e=>{console.error(e);process.exitCode=1;});

