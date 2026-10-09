(() => {
  'use strict';
  function editor(parent,obj,precio,permitida=()=>true){
    const d=document.createElement('details');d.className='producto-extras promo-editor';
    const s=document.createElement('summary');s.textContent='Promoción';d.append(s);
    const inputs={};
    function campo(nombre,tipo,clave,valor){const label=document.createElement('label');label.textContent=nombre;const el=document.createElement('input');el.type=tipo;el.dataset.promo=clave;if(tipo==='checkbox')el.checked=valor===true;else el.value=valor??'';inputs[clave]=el;label.append(el);d.append(label);return el;}
    const actual=obj.promocion||{};
    campo('Activar promoción','checkbox','activa',actual.activa);
    const anterior=document.createElement('p');d.append(anterior);
    function select(nombre,clave,opciones,valor){const label=document.createElement('label');label.textContent=nombre;const el=document.createElement('select');opciones.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;el.append(o);});el.value=valor;inputs[clave]=el;label.append(el);d.append(label);}
    select('Tipo de promoción','tipo',[['precio','Precio especial'],['2x1','2×1 · dos iguales por el precio de uno']],actual.tipo||'precio');
    const titulo=campo('Texto visible de la promoción (opcional)','text','etiqueta',actual.etiqueta);titulo.maxLength=60;titulo.placeholder='Ejemplo: Promo chida';
    const nuevo=campo('Precio promocional en MXN','number','precio',actual.precio);nuevo.min='0';nuevo.max='100000';nuevo.step='0.01';
    campo('Fecha de inicio','date','inicio',actual.inicio);campo('Fecha de fin','date','fin',actual.fin);
    campo('Hora de inicio diaria (opcional)','time','horaInicio',actual.horaInicio);campo('Hora de fin diaria (opcional)','time','horaFin',actual.horaFin);
    const horario=document.createElement('p');horario.textContent='Horario de Comalapa. Vacío: todo el día. Ejemplo: 13:00 a 21:00. Si termina antes de iniciar, cruza medianoche. La fecha de fin sigue siendo el último día permitido.';d.append(horario);
    select('Color','color',[['verde','Verde'],['dorado','Dorado']],actual.color||'verde');campo('Brillo suave','checkbox','brillo',actual.brillo);
    const ayuda=document.createElement('p');ayuda.textContent='Reutiliza foto y nombre. Sin porcentaje. El 2×1 se aplica a la misma preparación; adicionales y extras se cobran por cada unidad. Si hay opciones con precio propio, configura la oferta en la opción.';d.append(ayuda);
    const leer=()=>({activa:inputs.activa.checked,tipo:inputs.tipo.value,etiqueta:inputs.etiqueta.value.trim(),horaInicio:inputs.horaInicio.value,horaFin:inputs.horaFin.value,precio:inputs.precio.value.trim()?Number(inputs.precio.value):null,inicio:inputs.inicio.value,fin:inputs.fin.value,color:inputs.color.value,brillo:inputs.brillo.checked});
    function refrescar(){
      const esOpcion=parent.classList.contains('producto-opcion-editor');const nombre=parent.querySelector(esOpcion?'[data-campo=opcion-nombre]':'[data-campo=nombre]')?.value.trim()||'sin nombre';
      const habilitada=permitida();const activa=inputs.activa.checked;
      s.textContent=(activa?'✓ Promoción activada':'○ Sin promoción')+' · '+nombre+(activa&&!habilitada?' · Revisar ubicación':'');
      d.classList.toggle('promo-configurada',activa);d.classList.toggle('promo-ubicacion-invalida',activa&&!habilitada);
      ayuda.textContent=!habilitada?(esOpcion?'Esta opción suma un adicional. Para promocionar solo este sabor, necesita el precio completo de la bebida como precio propio, dentro de un grupo de selección única.':'Este producto tiene opciones con su propio precio. Abre Grupos de opciones y configura la promoción dentro del sabor o presentación que quieras. Deja desactivada esta promoción general.'):'Esta promoción corresponde únicamente a '+nombre+'. El 2×1 se aplica a dos preparaciones iguales; extras y adicionales se cobran por unidad.';
      anterior.textContent='Precio normal: $'+Number(precio()||0).toFixed(2);for(const [k,el] of Object.entries(inputs))if(k!=='activa')el.disabled=!inputs.activa.checked;inputs.precio.disabled=!inputs.activa.checked||inputs.tipo.value==='2x1';inputs.precio.required=inputs.activa.checked&&inputs.tipo.value==='precio';inputs.inicio.required=inputs.fin.required=inputs.activa.checked;}
    d.addEventListener('input',()=>{obj.promocion=leer();refrescar();});d.addEventListener('toggle',refrescar);parent.addEventListener('input',refrescar);parent.append(d);refrescar();
    parent._leerPromocion=()=>{if(!actual.activa&&!inputs.activa.checked&&!obj.promocion)return {};const promocion=leer();if(promocion.activa&&!permitida())throw Error('Configura la promoción en cada opción de precio propio, no en el precio base.');PromosProductos.validar(promocion,Number(precio()));return {promocion};};
  }
  window.PromosEditor={editor};
})();
