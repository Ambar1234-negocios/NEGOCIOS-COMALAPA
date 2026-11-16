const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const document={addEventListener(){},documentElement:{dataset:{}}};
const window={MesasExhibicion:{mesa:()=>null}};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../comida.js'),'utf8'),{window,document,Intl,console,URLSearchParams,location:{search:''},setInterval(){}});
const producto={id:'uno',nombre:'Producto existente',precio:0,seccion:'Pintura para casa',soloInformativo:true,disponible:false,fichaAvanzada:{activa:true,fotos:['imagenes/el-titan-de-las-pinturas/foto-1.webp'],secciones:[{titulo:'Rendimiento',contenido:'Contenido original'}]}};
const render=ps=>window.ComidaExhibicion.menu({slug:'el-titan-de-las-pinturas',nombre:'Sayer',whatsapp:'9633245310',productos:ps});
for(const precio of [0,null,undefined]){const html=render([{...producto,precio}]);assert(html.includes('Ver producto'));assert(!html.includes('$0'));assert(!html.includes('<details'));assert(html.includes('Pintura para casa'));assert(html.includes('Contenido original'));assert(html.includes('foto-1.webp'));assert(!html.includes('talla'));}
assert(render([{...producto,precio:125}]).includes('$125.00'));
assert(!render([{...producto,eliminado:true}]).includes('Ver producto'));
const orden=render([{...producto,id:'segundo',nombre:'Segundo',ordenCatalogo:20},{...producto,id:'primero',nombre:'Primero',ordenCatalogo:1}]);assert(orden.indexOf('data-producto-id="primero"')<orden.indexOf('data-producto-id="segundo"'));
assert(!render([producto]).includes('Vestidos'));
console.log('Sayer: categorías abiertas, precios opcionales, fichas, fotos, informativos y orden OK');
