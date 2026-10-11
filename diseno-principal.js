(() => {
'use strict';
const temas={morado:['Morado','#321344','#703a85'],azul:['Azul','#123552','#286986'],verde:['Verde','#164334','#307257'],cafe:['Café','#43291e','#82533a'],dorado:['Dorado','#f3cb65','#ffe6a2'],blanco:['Blanco','#ffffff','#edf2f7']};
function luminancia(hex){const a=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
function estilo(tema,color){const t=temas[tema]||temas.morado;const a=tema==='personalizado'&&/^#[0-9a-f]{6}$/i.test(color||'')?color:t[1],b=tema==='personalizado'?a:t[2];const l=[luminancia(a),luminancia(b)],blanco=Math.min(...l.map(x=>1.05/(x+.05))),negro=Math.min(...l.map(x=>(x+.05)/.05));const claro=negro>=blanco;return '--anuncio-fondo:linear-gradient(120deg,'+a+','+b+');--anuncio-tinta:'+(claro?'#111111':'#ffffff')+';--anuncio-acento:'+(claro?'#442600':'#ffe17b')+';--anuncio-boton:'+(claro?'#203544':'#ffd13d')+';--anuncio-boton-tinta:'+(claro?'#ffffff':'#171717')+';';}
function aplicar(card,tema,color){if(!card)return;card.dataset.disenoPrincipal='true';card.style.cssText=estilo(tema,color);}
window.DisenoPrincipal={temas,estilo,aplicar,luminancia};
})();
