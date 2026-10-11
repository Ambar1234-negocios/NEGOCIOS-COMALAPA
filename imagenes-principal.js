/* Copia local de las imágenes del anuncio para editar y previsualizar. */
(() => {
'use strict';const urls=new Map();
const db=new Promise((resolve,reject)=>{const r=indexedDB.open('exhibicionImagenesPrincipalV1',1);r.onupgradeneeded=()=>r.result.createObjectStore('imagenes',{keyPath:'ruta'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const api=window.ImagenesPrincipal={url:r=>urls.get(r)||r,lista:null,
async guardar(ruta,archivo){const d=await db;await new Promise((resolve,reject)=>{const t=d.transaction('imagenes','readwrite');t.objectStore('imagenes').put({ruta,archivo});t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});const old=urls.get(ruta);if(old)URL.revokeObjectURL(old);urls.set(ruta,URL.createObjectURL(archivo));},
async descargar(ruta){try{const d=await db;const item=await new Promise((resolve,reject)=>{const r=d.transaction('imagenes').objectStore('imagenes').get(ruta);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const a=document.createElement('a');a.href=item?URL.createObjectURL(item.archivo):ruta;a.download=ruta.split('/').pop();document.body.append(a);a.click();a.remove();if(item)setTimeout(()=>URL.revokeObjectURL(a.href),1000);}catch{alert('No se pudo recuperar la foto. Usa la imagen original y cópiala a '+ruta);}}};
api.lista=db.then(d=>new Promise((resolve,reject)=>{const r=d.transaction('imagenes').objectStore('imagenes').getAll();r.onsuccess=()=>{for(const item of r.result)urls.set(item.ruta,URL.createObjectURL(item.archivo));resolve();};r.onerror=()=>reject(r.error);})).catch(()=>{});
api.lista.then(()=>{window.actualizarSelectorImagenPrincipal?.();window.actualizarPreviewPrincipal?.();});
})();
