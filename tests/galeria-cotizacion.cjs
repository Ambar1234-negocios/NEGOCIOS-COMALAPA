const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),cp=require('child_process'),path=require('path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ns=JSON.parse(read('negocios.json')),n=ns.find(n=>n.slug==='elegans-floreria');
const base=JSON.parse(cp.execFileSync('git',['show','HEAD:negocios.json'],{cwd:root,encoding:'utf8'}));
assert.deepEqual(ns.filter(x=>x.slug!==n.slug),base.filter(x=>x.slug!==n.slug));
assert.deepEqual(n.galeria,base.find(x=>x.slug===n.slug).galeria);assert.equal(n.galeria.length,10);
const ctx={window:{ContactosExhibicion:{actual:{mandaditos:{numero:'529631891480'}}}},document:{addEventListener(){}},location:{origin:'https://exhibicionfronteracomalapa.com'},URL};vm.createContext(ctx);vm.runInContext(read('galeria-cotizacion.js'),ctx);
const g=ctx.window.GaleriaCotizacion,html=g.html(n);assert.equal((html.match(/class="cotizar-arreglo"/g)||[]).length,10);assert(!html.includes('<h5>'));assert(!html.includes('$'));
const f=g.elementos(n)[0],url=g.enlace(n,f);assert(url.startsWith('https://wa.me/529631891480?text='));assert(new URL(url).searchParams.get('text').includes('Referencia de la foto: https://exhibicionfronteracomalapa.com/'+f.src));assert(!url.includes('9631731610'));
assert.equal(g.enlace({...n,galeria:[...n.galeria].reverse()},f),url);assert.equal(g.enlace(n,{...f,cotizacion:false}),'');assert(new URL(g.enlace(n,{...f,nombre:'Referencia de prueba'})).searchParams.get('text').includes('(Referencia de prueba)'));
assert.equal(g.html({...n,catalogoGaleria:{activa:false}}),'');assert.equal(g.html({...n,mostrarGaleria:false}),'');
const code=read('script.js'),horarios=code.slice(code.indexOf('const ZONA_HORARIA_EXHIBICION'),code.indexOf('const mesaEntrada'));
Object.assign(ctx,{setInterval(){},Intl,Date});vm.runInContext(horarios,ctx);
for(let dia=0;dia<7;dia++)for(const [minuto,esperado]of [[419,'cerrado'],[420,'abierto'],[1319,'abierto'],[1320,'cerrado']]){vm.runInContext('obtenerFechaLocalExhibicion=()=>({indiceDia:'+dia+',minutosActuales:'+minuto+'})',ctx);assert.equal(ctx.obtenerEstadoHorario(n).estado,esperado);}
const inputs=[],lectores=[],editor={lectoresGestion:lectores,nodo:()=>({style:{},append(){}}),campoGestion(z,o,k){inputs.push({o,k});lectores.push(()=>{});return {};}};vm.createContext(editor);const gestion=read('panel/gestion.js');vm.runInContext(gestion.slice(gestion.indexOf('function editorGaleriaCotizacion')),editor);const edit=structuredClone(n);editor.editorGaleriaCotizacion({append(){}},edit);inputs.find(x=>x.k==='nombre').o.nombre='Referencia de prueba';inputs.find(x=>x.k==='cotizacion').o.cotizacion=false;lectores.forEach(f=>f());assert.equal(edit.catalogoGaleria.elementos[f.src].nombre,'Referencia de prueba');assert.equal(edit.catalogoGaleria.elementos[f.src].cotizacion,false);assert.deepEqual(edit.galeria,n.galeria);
console.log('OK: 10 fotos originales, aislamiento de otros negocios, CTA Mandaditos, referencia estable, desactivación, editor y 28 límites de horario.');

