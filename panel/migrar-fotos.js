'use strict';
let manifestFotos=[],mapasFotos=[];
async function cargarPantalla(){const r=await fetch('migracion-imagenes.json');if(!r.ok)throw Error('No se encontró el inventario de fotos.');manifestFotos=await r.json();mapasFotos=await api('/rest/v1/piloto_menus_completos?select=slug,imagenes');el('cantidad-fotos').textContent=manifestFotos.length+' imágenes originales identificadas.';el('avance-fotos').max=manifestFotos.length;}
el('migrar-fotos').onclick=()=>tarea(async()=>{
 await cargarPantalla();el('errores-fotos').replaceChildren();let hechas=0,fallos=0;const locales=new Map();for(const f of el('carpeta-fotos').files){const ruta=f.webkitRelativePath.replace(/^.*?\//,'');locales.set('imagenes/'+ruta,f);}
 for(const a of manifestFotos){try{
  let ruta=cuenta.user.id+'/migracion/'+a.sha256+'.webp';
  const falta=a.negocios.filter(slug=>!mapasFotos.find(m=>m.slug===slug)?.imagenes?.[a.ruta]);
  if(falta.length){
   let existe=true;try{await api('/storage/v1/object/authenticated/'+BUCKET+'/'+ruta,{blob:true});}catch(e){if(e.estadoHTTP===400||e.estadoHTTP===404)existe=false;else throw e;}
   if(!existe){let original=locales.get(a.ruta);if(!original){const r=await fetch('https://exhibicionfronteracomalapa.com/'+a.ruta.split('/').map(encodeURIComponent).join('/'));if(!r.ok)throw Error('No se encontró la imagen en la web.');const b=await r.blob();original=new File([b],a.ruta,{type:b.type||'image/webp'});}const b=await comprimir(original);try{await api('/storage/v1/object/'+BUCKET+'/'+ruta,{method:'POST',datos:b});}catch(e){if(e.estadoHTTP!==409)throw e;}}
   for(const slug of falta){await api('/rest/v1/rpc/piloto_menu_foto_vincular',{method:'POST',datos:{negocio:slug,origen:a.ruta,ruta}});const mapa=mapasFotos.find(m=>m.slug===slug);if(mapa)mapa.imagenes[a.ruta]=ruta;}
  }
  hechas++;
 }catch(e){fallos++;el('errores-fotos').append(nodo('li',a.ruta+': '+e.message));if(e.estadoHTTP===401)throw e;}
 el('avance-fotos').value=hechas+fallos;el('resultado-fotos').textContent=hechas+' listas · '+fallos+' por reintentar · '+manifestFotos.length+' en total';}
 aviso(fallos?'Traslado parcial: las fotos correctas quedan guardadas. Puedes corregir la conexión o seleccionar la carpeta y reintentar.':'✅ Todas las imágenes del inventario están copiadas y vinculadas a Supabase.');
});
