/* Productos aprobados por administración; nunca consulta borradores. */
(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co',KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
let mapaAprobado=new Map();
window.MenuPublicado={actualizarExistentes(categorias){for(const lista of Object.values(categorias))for(const n of lista)n.productos=(n.productos||[]).map(p=>mapaAprobado.get(n.slug+'|'+p.id)||p);},async aplicar(lista){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),8000);
 try{const r=await fetch(BASE+'/rest/v1/rpc/menu_catalogo_publicado',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',signal:control.signal,cache:'no-store'});if(!r.ok)throw Error('Catálogo no disponible');const cambios=await r.json();if(!Array.isArray(cambios))throw Error('Catálogo inválido');
 const mapa=new Map(cambios.filter(c=>c&&typeof c.negocio==='string'&&typeof c.producto==='string'&&c.contenido?.id===c.producto).map(c=>[c.negocio+'|'+c.producto,c.contenido]));
 mapaAprobado=mapa;return lista.map(n=>({...n,productos:(n.productos||[]).map(p=>mapa.get(n.slug+'|'+p.id)||p)}));
 }catch(e){console.warn('No se pudieron actualizar los productos publicados.',e);return lista;}finally{clearTimeout(timer);}
}};
})();
