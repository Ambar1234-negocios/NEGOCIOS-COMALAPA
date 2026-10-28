/* Productos aprobados por administración; nunca consulta borradores. */
(()=>{'use strict';
const BASE='https://gyvoyzxsgckpfkagzjtf.supabase.co',KEY='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
let mapaAprobado=new Map(),formatosMenu=new Map();
function combinar(n,mapa){
 const anteriores=Array.isArray(n.productos)?n.productos:[];
 const lista=anteriores.map(p=>mapa.get(n.slug+'|'+p.id)||p),ids=new Set(lista.map(p=>p.id));
 for(const[k,p]of mapa)if(k.startsWith(n.slug+'|')&&!ids.has(p.id)){lista.push(p);ids.add(p.id);}
 // Existing menus retain their layout; new businesses infer it after their products arrive.
 if(!formatosMenu.has(n.slug)&&anteriores.length)formatosMenu.set(n.slug,anteriores.every(p=>!!String(p.seccion||'').trim()));
 if(!formatosMenu.has(n.slug)&&lista.length)formatosMenu.set(n.slug,lista.every(p=>!!String(p.seccion||'').trim()));
 n.menuConSecciones=formatosMenu.get(n.slug)??false;return lista;
}
window.MenuPublicado={actualizarExistentes(categorias){for(const lista of Object.values(categorias))for(const n of lista)n.productos=combinar(n,mapaAprobado);},async aplicar(lista){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),8000);
 try{const r=await fetch(BASE+'/rest/v1/rpc/menu_catalogo_publicado',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',signal:control.signal,cache:'no-store'});if(!r.ok)throw Error('Catálogo no disponible');const cambios=await r.json();if(!Array.isArray(cambios))throw Error('Catálogo inválido');
 const mapa=new Map(cambios.filter(c=>c&&typeof c.negocio==='string'&&typeof c.producto==='string'&&c.contenido?.id===c.producto).map(c=>[c.negocio+'|'+c.producto,c.contenido]));
 mapaAprobado=mapa;return lista.map(n=>{const productos=combinar(n,mapa);return {...n,productos};});
 }catch(e){console.warn('No se pudieron actualizar los productos publicados.',e);return lista;}finally{clearTimeout(timer);}
}};
})();
