/* Desvío reversible: los contactos originales nunca se sobrescriben. */
(()=>{'use strict';
 const api=window.ContactosPrueba={listo:false,activo:false,numero:''};
 const base='https://gyvoyzxsgckpfkagzjtf.supabase.co',key='sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD';
 api.publicacion=(async()=>{const r=await fetch(base+'/rest/v1/rpc/sitio_publicacion',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(7000),cache:'no-store'});if(!r.ok)throw Error('No se pudo verificar el contacto. Actualiza antes de enviar.');const d=await r.json(),c=d.documentos?.contactos||{};api.activo=c.modoPruebaContactos===true;api.numero=String(c.numeroPruebaContactos||'');if(api.activo&&!/^52\d{10}$/.test(api.numero))throw Error('Contacto de prueba inválido.');api.listo=true;return d;})();
 api.publicacion.catch(()=>{});
 api.destino=n=>{if(!api.listo)throw Error('Estamos verificando el contacto. Espera unos segundos o actualiza.');return api.activo?api.numero:n;};
 api.url=valor=>{if(!valor)return valor;let u;try{u=new URL(String(valor),location.href);}catch{return valor;}const tel=u.protocol==='tel:',wa=['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(u.hostname)||u.protocol==='whatsapp:';if(!tel&&!wa)return valor;if(!api.listo)throw Error('Estamos verificando el contacto. Espera unos segundos o actualiza.');if(!api.activo)return valor;if(tel)return 'tel:+'+api.numero;if(u.hostname==='wa.me'){if(!/^\/\+?\d+\/?$/.test(u.pathname))return valor;u.pathname='/'+api.numero;}else u.searchParams.set('phone',api.numero);return u.href;};
 api.aplicar=d=>{if(!api.activo)return d;const c=structuredClone(d);for(const p of c.perfiles||[]){if(p.telefono)p.telefono=api.numero;if(p.whatsapp)p.whatsapp=api.numero;}for(const v of Object.values(c.documentos?.contactos||{}))if(v&&typeof v==='object'&&'numero'in v)v.numero=api.numero;return c;};
 const abrir=window.open.bind(window);window.open=(url,...args)=>abrir(api.url(url),...args);
 document.addEventListener('click',e=>{const a=e.target?.closest?.('a[href]');if(!a||a.hasAttribute('data-contacto-cliente'))return;try{a.href=api.url(a.href);}catch(err){e.preventDefault();e.stopImmediatePropagation();alert(err.message);}},true);
})();
