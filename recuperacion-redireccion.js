'use strict';
// Auth falls back to Site URL when a redirect is not allowlisted. Preserve the
// recovery fragment and route it before loading any other scripts on the home page.
(()=>{const h=new URLSearchParams(location.hash.slice(1));if(h.get('type')==='recovery'&&h.has('access_token'))location.replace('/panel/restablecer-contrasena.html'+location.hash);})();
