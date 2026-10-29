(()=>{'use strict';
const root=document.getElementById('menu-local'),params=new URLSearchParams(location.search),slug=params.get('negocio');
if(slug!=='forno-mexa'){document.getElementById('local-estado').textContent='Este menú no está disponible.';return;}
document.getElementById('local-mesa').textContent='Mesa '+window.MesasExhibicion.mesa()+' · Comer aquí o para llevar';
(async()=>{try{
const r=await fetch('negocios.json',{cache:'no-cache'});if(!r.ok)throw Error('Menú no disponible.');
const perfiles=await window.SitioPublicado.leer('negocios',await r.json());
const negocio=perfiles.find(n=>n.slug===slug&&n.activo!==false);if(!negocio)throw Error('El negocio no está disponible.');
const [n]=await window.MenuPublicado.aplicar([negocio]);
if(n.categoria!=='comida'||n.tipoCatalogo==='digital')throw Error('Este menú no admite pedidos del local.');
root.replaceChildren();const title=document.createElement('div');title.className='perfil-titulo-linea';const h=document.createElement('h3');h.textContent=n.nombre;title.append(h);root.append(title);
const menu=document.createElement('div');menu.innerHTML=window.ComidaExhibicion.menu(n);root.append(menu);window.ComidaExhibicion.conectar(n);
}catch(e){document.getElementById('local-estado')?.replaceChildren(document.createTextNode('No pudimos cargar el menú. Revisa tu conexión y vuelve a intentarlo.'));}})();
})();
