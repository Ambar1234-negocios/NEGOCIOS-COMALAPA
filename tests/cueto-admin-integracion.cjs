// Regression for the administrator screen: it has #panel, not #vista-menu.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),ids=new Map();
class Element{
 constructor(tag,text){this.tag=tag;this.textContent=text;this.children=[];this.listeners={};this.hidden=false;this.style={};this.files=[];this.value='';}
 set id(v){this._id=v;ids.set(v,this);}get id(){return this._id;}
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);if(this.id)ids.delete(this.id);}
 addEventListener(e,fn){this.listeners[e]=fn;}
 removeAttribute(k){delete this[k];}
 querySelector(selector){return this.all().find(n=>selector==='input'?n.tag==='input':false);}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}
 querySelectorAll(selector){return this.all().filter(n=>selector.includes(n.tag));}
}
const nodo=(t,s)=>new Element(t,s),panel=nodo('div');panel.id='panel';
for(const id of ['negocio-menu','nuevo-producto','buscar-menu','categoria-menu','conteo-menu','lista-completa','papelera-menu']){const e=nodo(id==='negocio-menu'?'select':'div');e.id=id;panel.append(e);}
const labels=new Map(['buscar-menu','categoria-menu'].map(id=>[id,nodo('label')]));
const n=JSON.parse(fs.readFileSync(path.join(root,'cueto-sax.json'))),fixture={slug:n.slug,original:structuredClone(n),borrador:structuredClone(n),revision:5};
const otro={slug:'otro',original:{nombre:'Otro negocio'},borrador:{nombre:'Otro negocio'}};
let saves=0,baseCalls=0;
const ctx={structuredClone,console,URL,Blob,crypto:globalThis.crypto,document:{querySelector:s=>{const m=s.match(/^label\[for="(.+)"\]$/);return m?labels.get(m[1])||null:null;}},window:{addEventListener(){},ConsultoriosExhibicion:{enlaceEvento:()=> 'https://wa.me/529636357763'}},el:id=>ids.get(id)||null,nodo,
 entrada(g,id,t,tipo){const e=nodo(tipo==='textarea'?'textarea':'input');e.id=id;e.type=tipo;g.append(e);return e;},dias:['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],menuCompleto:null,negocioActivo:'cueto-sax',cuenta:{user:{id:'test'}},BASE:'https://example.test',confirm:()=>true,aviso:t=>ctx.message=t,
 pintarMenuCompleto(){baseCalls++;ids.get('papelera-menu').hidden=true;},
 async cargarMenuCompleto(){ctx.menuCompleto=ctx.negocioActivo==='cueto-sax'?fixture:otro;ids.get('negocio-menu').value=ctx.menuCompleto.slug;ctx.pintarMenuCompleto();},
 tarea(fn){ctx.pending=fn();return ctx.pending;},
 async api(url,{datos}){assert(url.endsWith('/cueto_perfil_guardar'));assert.equal(datos.negocio,'cueto-sax');assert.equal(datos.version,fixture.revision);fixture.original={...fixture.original,...datos.datos};fixture.borrador={...fixture.borrador,...datos.datos};fixture.revision++;saves++;return {publicado:true};}
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'panel/cueto-editor.js'),'utf8'),ctx);
(async()=>{
 await ctx.cargarMenuCompleto();let editor=ids.get('cueto-editor');assert(editor);assert.equal(editor.parentElement,panel);assert.equal(editor.all().filter(n=>n.tag==='legend').length,14);assert.equal(ids.get('nuevo-producto').hidden,true);assert.equal(ids.get('negocio-menu').hidden,false);
 const form=editor.children.find(e=>e.tag==='form'),fields=editor.all().filter(e=>e.tag==='fieldset'),boda=fields[0];
 boda.querySelector('input').value='Bodas personalizadas';boda.all().find(e=>e.type==='checkbox').checked=false;form.listeners.input();ctx.confirm=()=>false;ctx.negocioActivo='otro';await ctx.cargarMenuCompleto();assert.equal(ctx.negocioActivo,'cueto-sax');assert.equal(ids.get('negocio-menu').value,'cueto-sax');assert.equal(ctx.menuCompleto.slug,'cueto-sax');
 form.onsubmit({preventDefault(){}});await ctx.pending;assert.equal(saves,1);assert.equal(fixture.original.servicios[0].nombre,'Bodas personalizadas');assert.equal(fixture.original.servicios[0].activo,false);assert.equal(fixture.original.whatsapp,'9636357763');assert.equal(fixture.borrador.servicios[0].nombre,'Bodas personalizadas');
 ctx.negocioActivo='otro';await ctx.cargarMenuCompleto();assert.equal(ids.has('cueto-editor'),false);assert.equal(ids.get('nuevo-producto').hidden,false);assert.equal(labels.get('buscar-menu').hidden,false);
 ctx.negocioActivo='cueto-sax';await ctx.cargarMenuCompleto();assert(ids.get('cueto-editor'));assert.equal(ids.get('cueto-editor').all().find(e=>e.tag==='fieldset').querySelector('input').value,'Bodas personalizadas');assert(baseCalls>=4);
 const html=fs.readFileSync(path.join(root,'panel/menu-completo.html'),'utf8');assert(html.includes('cueto-editor.js?v=cueto-panel-integrado-20261116'));assert(html.includes('../consultorios.js?v=cueto-panel-integrado-20261116'));assert(html.includes('sayer-catalogo.js'));
 console.log('OK: editor en #panel de administración, siete tarjetas, selector visible, guardar y recargar, cancelar cambio, restaurar controles de otro negocio y conservar Sayer.');
})().catch(e=>{console.error(e);process.exitCode=1;});
