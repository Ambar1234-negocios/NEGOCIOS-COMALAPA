/* Cueto keeps the existing servicios/galeria JSON and owner authorization RPC. */
(()=>{'use strict';
let dirty=false,serial=0,ocultados=[];
function restaurarControlesCueto(){for(const [e,hidden] of ocultados)e.hidden=hidden;ocultados=[];}
const basePintar=pintarMenuCompleto;
pintarMenuCompleto=function(){restaurarControlesCueto();basePintar();pintarCueto();};
const baseCarga=cargarMenuCompleto;
cargarMenuCompleto=async function(){
 if(dirty&&!confirm('¿Descartar los cambios sin publicar de Cueto Sax?')){negocioActivo=menuCompleto.slug;el('negocio-menu').value=negocioActivo;return;}
 await baseCarga();
};
function pintarCueto(){
 el('cueto-editor')?.remove();dirty=false;
 const fila=menuCompleto,esCueto=fila?.slug==='cueto-sax';
 if(!esCueto)return;
 // Keep the existing business selector visible in the administrator's screen.
 for(const id of ['nuevo-producto','buscar-menu','categoria-menu','conteo-menu','lista-completa','papelera-menu']){
  for(const e of [el(id),document.querySelector('label[for="'+id+'"]')])if(e){ocultados.push([e,e.hidden]);e.hidden=true;}
 }
 const d=structuredClone(fila.original),z=nodo('section',undefined,'tarjeta');z.id='cueto-editor';
 z.append(nodo('h2','Administrar perfil de Cueto Sax'),nodo('p','Los cambios se publican juntos al pulsar Guardar y publicar perfil. Cotizar conserva el WhatsApp 9636357763.'));
 const form=nodo('form'),lectores=[],fotos=[];z.append(form);(el('vista-menu')||el('panel')).append(z);
 form.addEventListener('input',()=>dirty=true);form.addEventListener('change',()=>dirty=true);
 function grupo(t){const g=nodo('section',undefined,'tarjeta');g.append(nodo('h3',t));form.append(g);return g;}
 function campo(g,obj,k,t,tipo='text'){
  const i=entrada(g,'cueto-'+(++serial),t,tipo);if(tipo==='checkbox')i.checked=obj[k]!==false;else i.value=obj[k]||'';
  lectores.push(()=>obj[k]=tipo==='checkbox'?i.checked:i.value.trim());return i;
 }
 function boton(g,t,fn){const b=nodo('button',t,'secundario');b.type='button';b.onclick=fn;g.append(b);return b;}
 function foto(g,obj,k,t){
  const img=nodo('img');img.alt=t;img.style.cssText='max-width:100%;width:240px;max-height:180px;object-fit:contain';g.append(img);
  const i=entrada(g,'cueto-foto-'+(++serial),t,'file');i.accept='image/jpeg,image/png,image/webp';
  const item={obj,k,input:i,preview:null};fotos.push(item);
  function ver(){const src=item.preview||obj[k];img.hidden=!src;if(src)img.src=src.startsWith('imagenes/')?'/'+src:src;else img.removeAttribute('src');}
  i.onchange=()=>{if(item.preview)URL.revokeObjectURL(item.preview);item.preview=i.files[0]?URL.createObjectURL(i.files[0]):null;ver();};
  boton(g,'Quitar foto',()=>{if(item.preview)URL.revokeObjectURL(item.preview);item.preview=null;obj[k]='';i.value='';dirty=true;ver();});ver();
 }
 const eventos=grupo('Tarjetas de eventos');
 for(const s of d.servicios||[]){if(s?.tipo!=='evento')continue;const g=nodo('fieldset');g.append(nodo('legend',s.nombre));eventos.append(g);
  campo(g,s,'nombre','Título visible').required=true;campo(g,s,'descripcion','Descripción de la tarjeta','textarea');campo(g,s,'activo','Mostrar esta tarjeta','checkbox');foto(g,s,'foto','Foto de '+s.nombre);
  const a=nodo('a','Probar Cotizar');a.target='_blank';a.rel='noopener';
  const actualizar=()=>{const copia={...s,nombre:g.querySelector('input').value.trim()};a.href=window.ConsultoriosExhibicion.enlaceEvento(d,copia);};g.addEventListener('input',actualizar);actualizar();g.append(a);
 }
 const port=grupo('Portafolio de presentaciones');campo(port,d,'mostrarGaleria','Mostrar portafolio','checkbox');
 const lista=nodo('div');port.append(lista);const items=(d.galeria||[]).map(src=>({src}));
 function pintarFotos(){lista.replaceChildren();for(const item of items){const g=nodo('article');const img=nodo('img');img.src=item.src;img.alt='Presentación '+(items.indexOf(item)+1);img.style.cssText='width:160px;max-width:100%;height:120px;object-fit:contain';g.append(img);
  for(const [t,delta] of [['Subir posición',-1],['Bajar posición',1]]){const b=boton(g,t,()=>{const i=items.indexOf(item),j=i+delta;if(j<0||j>=items.length)return;[items[i],items[j]]=[items[j],items[i]];dirty=true;pintarFotos();});b.disabled=items.indexOf(item)+delta<0||items.indexOf(item)+delta>=items.length;}
  boton(g,'Quitar del portafolio',()=>{items.splice(items.indexOf(item),1);if(item.file)URL.revokeObjectURL(item.src);dirty=true;pintarFotos();});lista.append(g);
 }}pintarFotos();
 const agregar=entrada(port,'cueto-agregar-fotos','Agregar fotos al portafolio','file');agregar.multiple=true;agregar.accept='image/jpeg,image/png,image/webp';
 agregar.onchange=()=>{const files=Array.from(agregar.files);if(items.length+files.length>20){aviso('El portafolio admite hasta 20 fotos.');agregar.value='';return;}for(const file of files)items.push({file,src:URL.createObjectURL(file)});agregar.value='';dirty=true;pintarFotos();};
 campo(port,d,'video','Video de presentación · enlace https://','url');port.append(nodo('p','El perfil admite un enlace de video; las fotos se pueden subir, quitar y ordenar.'));
 const general=grupo('Descripción, slogan y redes');for(const [k,t]of [['slogan','Slogan'],['descripcion','Descripción'],['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok'],['sitioWeb','Sitio web']])campo(general,d,k,t,k==='descripcion'?'textarea':['slogan'].includes(k)?'text':'url');
 const horarios=grupo('Horarios');d.horarios??={};
 for(const dia of dias){const h=d.horarios[dia]||{modo:'cerrado',turnos:[]};d.horarios[dia]=h;const g=nodo('fieldset');g.append(nodo('legend',dia));horarios.append(g);
  const l=nodo('label','Estado del día'),s=nodo('select');s.id='cueto-'+(++serial);l.htmlFor=s.id;for(const [v,t]of [['abierto','Abierto'],['cerrado','Cerrado'],['24h','24 horas'],['sin_confirmar','Sin confirmar']]){const o=nodo('option',t);o.value=v;s.append(o);}s.value=h.modo;g.append(l,s);
  const turnos=[0,1].map(j=>({...h.turnos?.[j]||{inicio:'',fin:''}}));for(const [j,t]of turnos.entries()){campo(g,t,'inicio','Turno '+(j+1)+' · desde','time');campo(g,t,'fin','Hasta','time');}
  lectores.push(()=>{h.modo=s.value;h.turnos=turnos.filter(t=>t.inicio||t.fin);if(h.modo==='abierto'&&(!h.turnos.length||h.turnos.some(t=>!t.inicio||!t.fin||t.inicio===t.fin)))throw Error('Revisa los turnos de '+dia);});
 }
 const guardar=nodo('button','Guardar y publicar perfil');form.append(guardar);
 async function subirFoto(file){const blob=await comprimir(file),ruta=cuenta.user.id+'/'+crypto.randomUUID()+'.webp';await api('/storage/v1/object/menu-publico/'+ruta,{method:'POST',datos:blob});return BASE+'/storage/v1/object/public/menu-publico/'+ruta;}
 form.onsubmit=e=>{e.preventDefault();tarea(async()=>{
  const controles=Array.from(form.querySelectorAll('input,textarea,select'));controles.forEach(c=>c.disabled=true);
  try{for(const leer of lectores)leer();for(const f of fotos)if(f.input.files[0]){f.obj[f.k]=await subirFoto(f.input.files[0]);f.input.value='';}
   for(const item of items)if(item.file){const src=await subirFoto(item.file);URL.revokeObjectURL(item.src);item.src=src;delete item.file;}
   d.galeria=items.map(i=>i.src);const claves=['servicios','galeria','mostrarGaleria','video','slogan','descripcion','horarios','facebook','instagram','tiktok','sitioWeb'];const datos=Object.fromEntries(claves.map(k=>[k,d[k]??'']));
   await api('/rest/v1/rpc/cueto_perfil_guardar',{method:'POST',datos:{negocio:fila.slug,version:fila.revision,datos}});
   dirty=false;await cargarMenuCompleto();aviso('Perfil publicado. Ver perfil público muestra los cambios guardados.');
  }finally{controles.forEach(c=>c.disabled=false);}
 });};
}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
if(menuCompleto)pintarCueto();
})();
