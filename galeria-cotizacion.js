/* Catálogo de galería optativo: conserva las rutas y nunca interpreta nombres de archivo. */
(()=>{'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const seguro=src=>typeof src==='string'&&(/^imagenes\/[\w./-]+$/.test(src)&&!src.includes('..')||/^https:\/\//.test(src));
 function elementos(n){return (n.galeria||[]).filter(seguro).map(src=>({src,...(n.catalogoGaleria?.elementos?.[src]||{})}));}
 function enlace(n,f){
  const numero=window.ContactosExhibicion?.actual?.mandaditos?.numero||'';
  if(!/^\d{11,15}$/.test(numero)||f.cotizacion===false)return '';
  const nombre=String(f.nombre||'').trim();
  const mensaje='Hola, quiero cotizar este arreglo de '+n.nombre+(nombre?' ('+nombre+')':'')+' y saber si pueden entregarlo a domicilio.\nReferencia de la foto: '+new URL(f.src,location.origin+'/').href;
  return 'https://wa.me/'+numero+'?text='+encodeURIComponent(mensaje);
 }
 function cta(n,f){const url=enlace(n,f);return f.cotizacion===false?'':url?'<a class="cotizar-arreglo" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Solicitar cotización y entrega</a>':'<p>Contacto de Mandaditos pendiente de configurar.</p>';}
 function html(n){if(!n.catalogoGaleria?.activa||n.mostrarGaleria===false)return '';const fs=elementos(n);return '<section class="galeria-cotizacion" aria-label="Catálogo visual"><h4>Catálogo de arreglos</h4><div class="arreglos-fila">'+fs.map((f,i)=>'<article class="arreglo-tarjeta"><button type="button" data-arreglo="'+i+'" aria-label="Ampliar '+esc(f.nombre||'foto del arreglo')+'"><img'+(window.MarcaAgua?.atributo(n.slug)||'')+' loading="lazy" src="'+esc(f.src)+'" alt="'+esc(f.nombre||'Arreglo de '+n.nombre)+'"></button>'+(f.nombre?'<h5>'+esc(f.nombre)+'</h5>':'')+cta(n,f)+'</article>').join('')+'</div><template class="arreglos-datos">'+esc(JSON.stringify(n))+'</template></section>';}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-arreglo]');if(!b)return;const n=JSON.parse(b.closest('.galeria-cotizacion').querySelector('template').content.textContent),fs=elementos(n),inicio=Number(b.dataset.arreglo),d=document.createElement('dialog');d.className='arreglo-ampliado';
  d.innerHTML='<button type="button" class="arreglo-cerrar">Cerrar ×</button><h2>'+esc(n.nombre)+'</h2><div class="arreglo-pista" tabindex="0" aria-label="Fotos de los arreglos">'+fs.map(f=>'<div><img'+(window.MarcaAgua?.atributo(n.slug)||'')+' src="'+esc(f.src)+'" alt="'+esc(f.nombre||'Arreglo de '+n.nombre)+'"></div>').join('')+'</div><nav aria-label="Navegar fotos"><button type="button" data-paso="-1" aria-label="Foto anterior">‹</button><button type="button" data-paso="1" aria-label="Foto siguiente">›</button></nav><div class="arreglo-informacion"></div>';
  const pista=d.querySelector('.arreglo-pista');let indice=inicio;
  function info(){const f=fs[indice];d.querySelector('.arreglo-informacion').innerHTML=(f.nombre?'<h3>'+esc(f.nombre)+'</h3>':'')+cta(n,f);}
  function mover(paso){indice=(indice+paso+fs.length)%fs.length;pista.scrollTo({left:indice*pista.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});info();}
  pista.addEventListener('scroll',()=>{indice=Math.max(0,Math.min(fs.length-1,Math.round(pista.scrollLeft/pista.clientWidth)));info();});
  d.querySelector('.arreglo-cerrar').onclick=()=>d.close();d.querySelectorAll('[data-paso]').forEach(x=>x.onclick=()=>mover(Number(x.dataset.paso)));
  d.addEventListener('keydown',ev=>{if(['ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();mover(ev.key==='ArrowRight'?1:-1);}});
  d.addEventListener('close',()=>{d.remove();if(b.isConnected)b.focus();},{once:true});document.body.append(d);d.showModal();pista.scrollLeft=inicio*pista.clientWidth;info();
 });
 window.GaleriaCotizacion={html,enlace,elementos};
})();
