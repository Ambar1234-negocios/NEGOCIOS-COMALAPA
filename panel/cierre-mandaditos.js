'use strict';

(() => {
  const token = location.hash.slice(1);
  const lista = document.getElementById('pedidos-lote');
  const estado = document.getElementById('estado-lote');
  const reintentar = document.getElementById('reintentar-lote');
  const opciones = {
    entregado: 'Sí se entregó',
    no_realizado: 'No se hizo la entrega'
  };
  const resultados = {
    entregado: 'Entregado confirmado',
    cliente_cancelo: opciones.no_realizado,
    negocio_cerrado: opciones.no_realizado,
    no_realizado: opciones.no_realizado,
    cancelado: opciones.no_realizado,
    incidencia: 'Incidencia enviada a recepción'
  };
  const tarjetas = new Map();

  function nodo(tipo, texto, clase) {
    const elemento = document.createElement(tipo);
    elemento.textContent = texto;
    if (clase) elemento.className = clase;
    return elemento;
  }

  function mostrarPedido(pedido) {
    const anterior = tarjetas.get(pedido.folio);
    if (anterior?.resultado === pedido.resultado) return;
    const tarjeta = nodo('article', '', 'tarjeta');
    tarjeta.append(nodo('h2', pedido.folio));
    const referencia = nodo('dl', '', 'referencia-pedido');
    const destino = pedido.entrega === 'recoger'
      ? 'Recoge en el negocio' : pedido.direccion || 'Dirección no disponible en este enlace';
    for (const [label, valor] of [
      ['Cliente', pedido.cliente || 'Sin nombre registrado'],
      ['Restaurante o negocio', pedido.negocio || 'Sin negocio registrado'],
      ['Dirección de entrega', destino],
      ['Forma de pago', pedido.pago === 'efectivo' ? 'Efectivo' : 'Transferencia']
    ]) {
      referencia.append(nodo('dt', label), nodo('dd', valor));
    }
    tarjeta.append(referencia);
    const respuesta = nodo('p', resultados[pedido.resultado] || '', 'resultado');
    respuesta.setAttribute('role', 'status');
    if (!pedido.resultado) {
      const acciones = nodo('div', '', 'decisiones');
      for (const [decision, texto] of Object.entries(opciones)) {
        const boton = nodo('button', texto, decision === 'entregado' ? '' : 'secundario');
        boton.type = 'button';
        boton.addEventListener('click', async () => {
          const pregunta = decision === 'entregado' && pedido.pago === 'efectivo'
            ? '¿Confirmas que el pedido se entregó y que Mandaditos cobró al cliente el total acordado?'
            : '¿Registrar «' + texto + '» para ' + pedido.folio + '?';
          if (!window.confirm(pregunta)) return;
          const botones = acciones.querySelectorAll('button');
          botones.forEach(b => { b.disabled = true; });
          respuesta.textContent = 'Guardando…';
          await consultar(pedido.folio, decision, respuesta);
          botones.forEach(b => { b.disabled = false; });
        });
        acciones.append(boton);
      }
      tarjeta.append(acciones);
    }
    tarjeta.append(respuesta);
    if (anterior) anterior.tarjeta.replaceWith(tarjeta);
    else lista.append(tarjeta);
    tarjetas.set(pedido.folio, { tarjeta, resultado: pedido.resultado });
  }

  function enlaceInvalido() {
    lista.replaceChildren();
    tarjetas.clear();
    reintentar.hidden = true;
    estado.textContent = 'Este enlace es inválido o venció. Solicita un enlace vigente a recepción.';
  }

  let consultando = false;
  async function consultar(folio = null, decision = null, respuesta = estado) {
    if (!/^[0-9a-f]{64}$/.test(token)) {
      enlaceInvalido();
      return;
    }
    if (consultando) {
      respuesta.textContent = 'Espera a que termine el guardado anterior y vuelve a intentarlo.';
      return;
    }
    consultando = true;
    reintentar.hidden = true;
    try {
      const r = await fetch('https://gyvoyzxsgckpfkagzjtf.supabase.co/rest/v1/rpc/piloto_cierre_mandaditos_responder', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          apikey: 'sb_publishable_i9NtjLajxExcefezErM2wQ_JDHUPvlD',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, folio_pedido: folio, decision })
      });
      const datos = await r.json();
      if (!r.ok) {
        const mensaje = datos.message?.startsWith('Recepción debe verificar')
          ? datos.message : 'No se pudo guardar o consultar. Intenta de nuevo.';
        throw Error(mensaje);
      }
      if (!datos.enlace_valido) {
        enlaceInvalido();
        return;
      }
      const pendientes = datos.pedidos.filter(p => !p.resultado).length;
      estado.textContent = datos.jornada + ' · ' + pendientes + ' pendientes de ' + datos.pedidos.length;
      datos.pedidos.forEach(mostrarPedido);
    } catch (error) {
      respuesta.textContent = error.message.startsWith('Recepción debe verificar')
        ? error.message : 'No se pudo guardar o consultar. Intenta de nuevo.';
      reintentar.hidden = decision !== null;
    } finally {
      consultando = false;
    }
  }

  reintentar.addEventListener('click', () => consultar());
  consultar();
})();
