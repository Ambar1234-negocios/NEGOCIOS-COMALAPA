// ============================================================
// EXHIBICIÓN FRONTERA COMALAPA
// script.js - Versión 1.2
// Perfil inteligente + todos los negocios con "Ver información"
// ============================================================


// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

const WHATSAPP_GENERAL = "529633106862";


// ============================================================
// NOMBRES DE CATEGORÍAS
// ============================================================

const categoriasNombres = {
  streaming: "STREAMING Y TECNOLOGÍA",
  construccion: "CONSTRUCCIÓN Y MATERIALES",
  comida: "COMIDA Y RESTAURANTES",
  salud: "SALUD Y FARMACIAS",
  hoteles: "HOTELES Y HOSPEDAJE",
  automotriz: "TALLERES Y REFACCIONES",
  servicios: "SERVICIOS PARA EL HOGAR",
  belleza: "BELLEZA Y ESTÉTICA",
  mandaditos: "MANDADITOS",
  comercios: "COMERCIOS",
  profesionales: "PROFESIONISTAS",
  bienesraices: "CASAS Y TERRENOS",
  veterinarias: "VETERINARIAS",
  agua: "PURIFICADORAS DE AGUA"
};


// ============================================================
// BASE DE DATOS DE NEGOCIOS
// Aquí vas a agregar, quitar o modificar negocios
// ============================================================

const negocios = {
  streaming: [],
  construccion: [],
  comida: [],
  salud: [],
  hoteles: [],
  automotriz: [],
  servicios: [],
  belleza: [],
  mandaditos: [],
  comercios: [],
  profesionales: [],
  bienesraices: [],
  veterinarias: [],
  agua: []
};
// ============================================================
// CARGAR NEGOCIOS DEL PANEL Y NEGOCIOS PUBLICADOS
// ============================================================

function agregarNegociosDinamicos(listaNegocios) {
  if (!Array.isArray(listaNegocios)) return;

  listaNegocios.forEach(function (nuevoNegocio) {
    if (!nuevoNegocio || nuevoNegocio.activo === false) return;

    const categoria = nuevoNegocio.categoria;
    if (!categoria) return;
    if (!negocios[categoria]) negocios[categoria] = [];

    const yaExiste = negocios[categoria].some((negocio) => {
      if (nuevoNegocio.slug && negocio.slug) {
        return negocio.slug === nuevoNegocio.slug;
      }

      if (nuevoNegocio.id !== undefined && negocio.id !== undefined) {
        return negocio.id === nuevoNegocio.id;
      }

      return negocio.nombre === nuevoNegocio.nombre;
    });

    if (!yaExiste) {
      negocios[categoria].push({
        ...nuevoNegocio,
        perfil: true,
        banner: nuevoNegocio.banner || "",
        logo: nuevoNegocio.logo || "",
        galeria: Array.isArray(nuevoNegocio.galeria)
          ? nuevoNegocio.galeria
          : []
      });
    }
  });
}

function cargarNegociosLocales() {
  try {
    const negociosLocales =
      JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

    agregarNegociosDinamicos(negociosLocales);
  } catch (error) {
    console.error("No se pudieron cargar los negocios locales:", error);
  }
}

async function cargarNegociosPublicados() {
  try {
    const respuesta = await fetch(`negocios.json?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const negociosPublicados = await respuesta.json();
    agregarNegociosDinamicos(negociosPublicados);

    console.log(
      `Negocios publicados cargados: ${Array.isArray(negociosPublicados) ? negociosPublicados.length : 0}`
    );
  } catch (error) {
    console.warn(
      "No se pudo cargar negocios.json. Se usarán los negocios integrados y los guardados localmente.",
      error
    );
  }
}

// El localStorage se mantiene para que el administrador pueda previsualizar
// cambios antes de publicarlos. Los visitantes normales recibirán negocios.json.
cargarNegociosLocales();
const cargaNegociosPublicados = cargarNegociosPublicados();

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function crearLinkWhatsapp(negocio) {
  const numero = negocio.whatsapp || WHATSAPP_GENERAL;
  const mensaje = `Hola, vi ${negocio.nombre} en Exhibición Frontera Comalapa y quiero información.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function crearLinkPedido(negocio) {
  const usaMandaditos = negocio.tipoDelivery !== "gratis";

  const mensaje = usaMandaditos
    ? `Hola, vi ${negocio.nombre} en Exhibición Frontera Comalapa y quiero solicitar entrega por Mandaditos.

Mi pedido es:
Cantidad:
Dirección de entrega:
Referencia:
Forma de pago:`
    : `Hola, vi ${negocio.nombre} en Exhibición Frontera Comalapa y quiero pedir a domicilio.

Mi pedido es:
Cantidad:
Dirección:
Referencia:
Forma de pago:`;

  const numero = usaMandaditos
    ? WHATSAPP_GENERAL
    : (negocio.whatsapp || WHATSAPP_GENERAL);

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function tieneDato(valor) {
  return valor !== undefined && valor !== null && valor !== "";
}


// ============================================================
// HORARIOS INTELIGENTES / ABIERTO O CERRADO
// ============================================================

const ZONA_HORARIA_EXHIBICION = "America/Mexico_City";
const DIAS_HORARIO_PUBLICO = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado"
];

function horaAMinutos(hora) {
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const [h, m] = hora.split(":").map(Number);
  return (h * 60) + m;
}

function formatearHora(hora) {
  const minutos = horaAMinutos(hora);
  if (minutos === null) return hora || "";

  const h24 = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  const periodo = h24 >= 12 ? "p.m." : "a.m.";
  const h12 = h24 % 12 || 12;

  return `${h12}:${String(m).padStart(2, "0")} ${periodo}`;
}

function obtenerFechaLocalExhibicion() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_EXHIBICION,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const datos = {};
  partes.forEach((parte) => {
    if (parte.type !== "literal") datos[parte.type] = parte.value;
  });

  const anio = Number(datos.year);
  const mes = Number(datos.month);
  const diaMes = Number(datos.day);
  const hora = Number(datos.hour);
  const minuto = Number(datos.minute);
  const indiceDia = new Date(Date.UTC(anio, mes - 1, diaMes)).getUTCDay();

  return {
    indiceDia,
    minutosActuales: (hora * 60) + minuto
  };
}

function formatearHorarioDia(horarioDia) {
  if (!horarioDia || horarioDia.modo === "cerrado") return "Cerrado";
  if (horarioDia.modo === "24h") return "Abierto 24 horas";

  const turnos = Array.isArray(horarioDia.turnos) ? horarioDia.turnos : [];
  if (turnos.length === 0) return "Horario no disponible";

  return turnos
    .map((turno) => `${formatearHora(turno.inicio)} – ${formatearHora(turno.fin)}`)
    .join(" · ");
}

function buscarProximaApertura(horarios, indiceDia, minutosActuales) {
  for (let desplazamiento = 0; desplazamiento <= 7; desplazamiento++) {
    const indice = (indiceDia + desplazamiento) % 7;
    const clave = DIAS_HORARIO_PUBLICO[indice];
    const dia = horarios[clave];

    if (!dia || dia.modo === "cerrado") continue;

    if (dia.modo === "24h") {
      if (desplazamiento === 0) return null;
      return {
        desplazamiento,
        hora: "00:00"
      };
    }

    const turnos = Array.isArray(dia.turnos) ? dia.turnos : [];

    for (const turno of turnos) {
      const inicio = horaAMinutos(turno.inicio);
      if (inicio === null) continue;

      if (desplazamiento === 0 && inicio <= minutosActuales) continue;

      return {
        desplazamiento,
        hora: turno.inicio
      };
    }
  }

  return null;
}

function textoProximaApertura(proxima) {
  if (!proxima) return "";

  if (proxima.desplazamiento === 0) {
    return `Abre hoy a las ${formatearHora(proxima.hora)}`;
  }

  if (proxima.desplazamiento === 1) {
    return `Abre mañana a las ${formatearHora(proxima.hora)}`;
  }

  const nombres = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const { indiceDia } = obtenerFechaLocalExhibicion();
  const indice = (indiceDia + proxima.desplazamiento) % 7;

  return `Abre el ${nombres[indice]} a las ${formatearHora(proxima.hora)}`;
}

function obtenerEstadoHorario(negocio) {
  const horarios = negocio.horarios;

  if (!horarios || typeof horarios !== "object") {
    return {
      automatico: false,
      estado: "sin-datos",
      texto: negocio.horario || "Horario no disponible",
      horarioHoy: ""
    };
  }

  const { indiceDia, minutosActuales } = obtenerFechaLocalExhibicion();
  const claveHoy = DIAS_HORARIO_PUBLICO[indiceDia];
  const diaHoy = horarios[claveHoy] || { modo: "cerrado", turnos: [] };

  if (diaHoy.modo === "24h") {
    return {
      automatico: true,
      estado: "abierto",
      texto: "🟢 Abierto ahora",
      horarioHoy: "Abierto 24 horas"
    };
  }

  // Revisar un turno nocturno iniciado el día anterior.
  const indiceAnterior = (indiceDia + 6) % 7;
  const claveAnterior = DIAS_HORARIO_PUBLICO[indiceAnterior];
  const diaAnterior = horarios[claveAnterior];

  if (diaAnterior?.modo === "abierto" && Array.isArray(diaAnterior.turnos)) {
    for (const turno of diaAnterior.turnos) {
      const inicio = horaAMinutos(turno.inicio);
      const fin = horaAMinutos(turno.fin);

      if (inicio !== null && fin !== null && fin <= inicio && minutosActuales < fin) {
        return {
          automatico: true,
          estado: "abierto",
          texto: `🟢 Abierto ahora · Cierra a las ${formatearHora(turno.fin)}`,
          horarioHoy: formatearHorarioDia(diaHoy)
        };
      }
    }
  }

  if (diaHoy.modo === "abierto" && Array.isArray(diaHoy.turnos)) {
    const turnos = diaHoy.turnos
      .map((turno) => ({
        ...turno,
        inicioMin: horaAMinutos(turno.inicio),
        finMin: horaAMinutos(turno.fin)
      }))
      .filter((turno) => turno.inicioMin !== null && turno.finMin !== null)
      .sort((a, b) => a.inicioMin - b.inicioMin);

    for (const turno of turnos) {
      const esNocturno = turno.finMin <= turno.inicioMin;
      const abiertoAhora = esNocturno
        ? minutosActuales >= turno.inicioMin
        : minutosActuales >= turno.inicioMin && minutosActuales < turno.finMin;

      if (abiertoAhora) {
        return {
          automatico: true,
          estado: "abierto",
          texto: `🟢 Abierto ahora · Cierra a las ${formatearHora(turno.fin)}`,
          horarioHoy: formatearHorarioDia(diaHoy)
        };
      }
    }

    const siguienteTurnoHoy = turnos.find((turno) => turno.inicioMin > minutosActuales);

    if (siguienteTurnoHoy) {
      const yaHuboTurno = turnos.some((turno) => {
        if (turno.finMin <= turno.inicioMin) return false;
        return turno.finMin <= minutosActuales;
      });

      return {
        automatico: true,
        estado: yaHuboTurno ? "descanso" : "cerrado",
        texto: `${yaHuboTurno ? "🟠 Cerrado temporalmente" : "🔴 Cerrado"} · Abre a las ${formatearHora(siguienteTurnoHoy.inicio)}`,
        horarioHoy: formatearHorarioDia(diaHoy)
      };
    }
  }

  const proxima = buscarProximaApertura(horarios, indiceDia, minutosActuales);

  return {
    automatico: true,
    estado: "cerrado",
    texto: `🔴 Cerrado${proxima ? ` · ${textoProximaApertura(proxima)}` : ""}`,
    horarioHoy: formatearHorarioDia(diaHoy)
  };
}


// ============================================================
// NAVEGACIÓN / HISTORIAL DEL NAVEGADOR
// Inicio → Categoría → Perfil
// Compatible con botón Atrás del celular y flecha del navegador
// ============================================================

function construirURL(parametros = {}) {
  const url = new URL(window.location.href);
  url.search = "";

  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      url.searchParams.set(clave, valor);
    }
  });

  return `${url.pathname}${url.search}`;
}

function mostrarInicio(opciones = {}) {
  const { actualizarHistorial = true, desplazar = true } = opciones;
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");

  if (titulo) {
    titulo.style.display = "block";
    titulo.textContent = "Selecciona una categoría";
  }

  if (lista) {
    lista.innerHTML = "";
  }

  if (actualizarHistorial) {
    history.pushState({ vista: "inicio" }, "", construirURL());
  }

  if (desplazar) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function encontrarNegocioPorSlug(slug) {
  if (!slug) return null;

  for (const categoria in negocios) {
    const index = negocios[categoria].findIndex(
      (negocio) => negocio.slug === slug
    );

    if (index !== -1) {
      return {
        categoria,
        index,
        negocio: negocios[categoria][index]
      };
    }
  }

  return null;
}

function volverCategoriaDesdePerfil(categoria) {
  const estado = history.state;

  if (estado?.vista === "perfil" && estado?.categoria === categoria) {
    history.back();
    return;
  }

  mostrarCategoria(categoria);
}


// ============================================================
// MOSTRAR CATEGORÍA
// ============================================================

function mostrarCategoria(categoria, opciones = {}) {
  const { actualizarHistorial = true, desplazar = true } = opciones;
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");

  if (!negocios[categoria]) return;

  titulo.style.display = "block";
  titulo.textContent = "Negocios de " + (categoriasNombres[categoria] || categoria.toUpperCase());
  lista.innerHTML = "";

  if (negocios[categoria].length === 0) {
    lista.innerHTML = `
      <div class="card">
        <h3>Próximamente</h3>
        <p>Aún no hay negocios registrados en esta categoría.</p>
      </div>
    `;
  } else {
    negocios[categoria].forEach(function(negocio, index) {
      lista.innerHTML += `
        <div class="card ${negocio.destacado ? "card-premium" : ""}">
          <h3>${negocio.nombre}</h3>
          <p>${negocio.descripcion}</p>

          <button class="btn-whatsapp" onclick="verPerfil('${categoria}', ${index})">
            Ver información
          </button>
        </div>
      `;
    });
  }

  if (actualizarHistorial) {
    history.pushState(
      { vista: "categoria", categoria },
      "",
      construirURL({ categoria })
    );
  }

  if (desplazar) {
    document.querySelector(".resultado").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


// ============================================================
// BUSCADOR
// ============================================================

function buscarNegocios() {
  const texto = document.getElementById("buscador").value.toLowerCase().trim();

  if (texto === "") return;

  for (const categoria in negocios) {
    const encontrados = negocios[categoria].some(negocio => {
      const servicios = negocio.servicios ? negocio.servicios.join(" ") : "";
      const contenido = `${negocio.nombre} ${negocio.descripcion} ${servicios}`.toLowerCase();
      return contenido.includes(texto);
    });

    if (encontrados) {
      mostrarCategoria(categoria);
      return;
    }
  }

  alert("No se encontró ningún negocio con esa búsqueda.");
}


// ============================================================
// PERFIL INTELIGENTE DEL NEGOCIO
// ============================================================

function verPerfil(categoria, index, opciones = {}) {
  const { actualizarHistorial = true } = opciones;
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");
  const negocio = negocios[categoria][index];

  if (!negocio) {
    alert("No se encontró la información del negocio.");
    return;
  }

  if (actualizarHistorial && negocio.slug) {
    history.pushState(
      { vista: "perfil", categoria, slug: negocio.slug },
      "",
      construirURL({ negocio: negocio.slug })
    );
  }

  titulo.style.display = "none";

  const banner = negocio.banner || negocio.imagen || "";
  const logo = negocio.logo || "";
  const estadoHorario = obtenerEstadoHorario(negocio);

  const serviciosHTML = negocio.servicios && negocio.servicios.length > 0
    ? `
      <section class="perfil-seccion">
        <h4>🛠️ Servicios</h4>
        <div class="servicios-pills">
          ${negocio.servicios.map(servicio => `<span>✔ ${servicio}</span>`).join("")}
        </div>
      </section>
    `
    : "";

  const detallesHTML = `
    <section class="perfil-detalles-oficial">
      ${negocio.direccion ? `
        <div class="detalle-card">
          <h4>📍 Dirección</h4>
          <p>${negocio.direccion}</p>
        </div>
      ` : ""}

      

      ${(negocio.horarios || negocio.horario) ? `
        <div class="detalle-card">
          <h4>🕒 Horario</h4>
          <p><strong>${estadoHorario.texto}</strong></p>
          ${estadoHorario.automatico && estadoHorario.horarioHoy
            ? `<small>Hoy: ${estadoHorario.horarioHoy}</small>`
            : ""}
        </div>
      ` : ""}
    </section>
  `;

  const botonesHTML = `
    <section class="perfil-acciones-oficial">

      ${negocio.telefono ? `
        <a class="accion accion-telefono" href="tel:${negocio.telefono}">
          <span>📞</span>
          <div>
            <strong>Llamar</strong>
            <small>${negocio.telefono}</small>
          </div>
        </a>
      ` : ""}

      ${negocio.whatsapp ? `
        <a class="accion accion-whatsapp" href="${crearLinkWhatsapp(negocio)}" target="_blank" rel="noopener noreferrer">
          <span>💬</span>
          <div>
            <strong>WhatsApp</strong>
            <small>Enviar mensaje</small>
          </div>
        </a>
      ` : ""}

      ${negocio.delivery === true ? `
        <a class="accion accion-delivery" href="${crearLinkPedido(negocio)}" target="_blank" rel="noopener noreferrer">
          <span>🛵</span>
          <div>
            <strong>Pedir a domicilio</strong>
            <small>${negocio.tipoDelivery === "gratis"
              ? "Envío gratis"
              : "Con costo · Mandaditos"}</small>
          </div>
        </a>
      ` : ""}

      ${negocio.maps ? `
        <a class="accion accion-maps" href="${negocio.maps}" target="_blank" rel="noopener noreferrer">
          <span>📍</span>
          <div>
            <strong>Cómo llegar</strong>
            <small>Ver en mapa</small>
          </div>
        </a>
      ` : ""}

      ${negocio.video ? `
        <a class="accion accion-video" href="${negocio.video}" target="_blank" rel="noopener noreferrer">
          <span>▶️</span>
          <div>
            <strong>Ver video</strong>
            <small>Video del negocio</small>
          </div>
        </a>
      ` : ""}

      ${negocio.facebook ? `
        <a class="accion accion-facebook" href="${negocio.facebook}" target="_blank" rel="noopener noreferrer">
          <span>f</span>
          <div>
            <strong>Facebook</strong>
            <small>Visitar página</small>
          </div>
        </a>
      ` : ""}

      ${negocio.instagram ? `
        <a class="accion accion-instagram" href="${negocio.instagram}" target="_blank" rel="noopener noreferrer">
          <span>◎</span>
          <div>
            <strong>Instagram</strong>
            <small>Ver perfil</small>
          </div>
        </a>
      ` : ""}

      ${negocio.tiktok ? `
        <a class="accion accion-tiktok" href="${negocio.tiktok}" target="_blank" rel="noopener noreferrer">
          <span>♪</span>
          <div>
            <strong>TikTok</strong>
            <small>Ver perfil</small>
          </div>
        </a>
      ` : ""}

      ${negocio.sitioWeb ? `
        <a class="accion accion-web" href="${negocio.sitioWeb}" target="_blank" rel="noopener noreferrer">
          <span>🌐</span>
          <div>
            <strong>Sitio web</strong>
            <small>Visitar página</small>
          </div>
        </a>
      ` : ""}

    </section>
  `;
  
const galeriaHTML = negocio.galeria && negocio.galeria.length > 0 ? `
  <section class="perfil-galeria-fotos">
    <h4>📷 Galería</h4>
    <div class="galeria-grid">
      ${negocio.galeria.map((foto, i) => `
        <img src="${foto}" alt="${negocio.nombre}" onclick="abrirLightbox('${categoria}', ${index}, ${i})">
      `).join("")}
    </div>
  </section>
` : "";
  lista.innerHTML = `
    <article class="perfil-negocio perfil-oficial">

      <button class="btn-regresar-perfil" onclick="volverCategoriaDesdePerfil('${categoria}')">
        ← Volver a la categoría
      </button>

      ${banner ? `
  <div class="perfil-hero-oficial">
    <img src="${banner}" alt="${negocio.nombre}">

    ${negocio.verificado === true
      ? '<span class="badge-verificado">✓ Negocio verificado</span>'
      : ''
    }
  </div>
` : ""}

      <div class="perfil-cabecera-oficial">

        ${logo ? `
          <div class="perfil-logo-oficial">
            <img src="${logo}" alt="Logo de ${negocio.nombre}">
          </div>
        ` : ""}

        <div class="perfil-titulo-oficial">
          <div class="perfil-titulo-linea">
            <h3>${negocio.nombre}</h3>
            
          </div>
          <p class="perfil-subtitulo">
            ${negocio.slogan || "Servicio local en Frontera Comalapa"}
          </p>
        </div>
      </div>

      <div class="perfil-contenido-oficial">

        ${negocio.descripcion ? `
          <section class="perfil-descripcion-oficial">
            <p>${negocio.descripcion}</p>
          </section>
        ` : ""}
        ${galeriaHTML}

        ${botonesHTML}

        ${detallesHTML}

        ${serviciosHTML}

      </div>

    </article>
  `;

  setTimeout(() => {
    document.querySelector(".perfil-negocio").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}


// ============================================================
// DESTACADOS / PROMOCIONES PUBLICADOS
// Lee destacados.json, revisa activo + fechas y abre el perfil
// ============================================================

function obtenerFechaISOExhibicion() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_EXHIBICION,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const datos = {};

  partes.forEach((parte) => {
    if (parte.type !== "literal") {
      datos[parte.type] = parte.value;
    }
  });

  return `${datos.year}-${datos.month}-${datos.day}`;
}

function destacadoVigente(destacado, fechaActual) {
  if (!destacado || destacado.activo === false) return false;

  if (destacado.fechaInicio && fechaActual < destacado.fechaInicio) {
    return false;
  }

  if (destacado.fechaFin && fechaActual > destacado.fechaFin) {
    return false;
  }

  return true;
}

function mezclarLista(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function abrirDestacado(slug) {
  const encontrado = encontrarNegocioPorSlug(slug);

  if (!encontrado) {
    alert("Este negocio ya no está disponible.");
    return;
  }

  verPerfil(encontrado.categoria, encontrado.index);
}

function crearTarjetaDestacado(destacado) {
  const etiqueta = destacado.etiqueta || "PROMOCIÓN";
  const titulo = destacado.titulo || destacado.negocioNombre || "Promoción";
  const texto = destacado.texto || "";
  const precio = destacado.precio || "";
  const slug = destacado.negocioSlug || "";

  return `
    <article
      class="card card-premium destacado-publicado"
      role="link"
      tabindex="0"
      aria-label="Abrir promoción de ${destacado.negocioNombre || titulo}"
      onclick="abrirDestacado('${slug}')"
      onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); abrirDestacado('${slug}'); }"
    >
      <div class="destacado-contenido">
        <span class="destacado-etiqueta">${etiqueta}</span>

        <h3>${titulo}</h3>

        ${texto ? `<p>${texto}</p>` : ""}

        ${precio
          ? `<div class="destacado-precio">${precio}</div>`
          : ""
        }

        ${destacado.negocioNombre && titulo !== destacado.negocioNombre
          ? `<small class="destacado-negocio">${destacado.negocioNombre}</small>`
          : ""
        }
      </div>

      <div class="destacado-decoracion" aria-hidden="true"></div>
    </article>
  `;
}

function crearDestacadoProximamente(numero) {
  return `
    <article class="card card-premium destacado-publicado destacado-placeholder destacado-demo-${numero}" aria-hidden="true">
      <div class="destacado-contenido">
        <span class="destacado-etiqueta">PRÓXIMAMENTE</span>
        <h3>Nueva promoción</h3>
        <p>Muy pronto encontrarás otra oferta de un negocio de Frontera Comalapa.</p>
        <small class="destacado-negocio">Exhibición Frontera Comalapa</small>
      </div>
      <div class="destacado-decoracion" aria-hidden="true"></div>
    </article>
  `;
}

let intervaloCarruselDestacados = null;
let timeoutCarruselDestacados = null;
let indiceCarruselDestacados = 1;
let ajusteInfinitoDestacados = null;

function detenerCarruselDestacados() {
  if (intervaloCarruselDestacados) {
    clearInterval(intervaloCarruselDestacados);
    intervaloCarruselDestacados = null;
  }

  if (timeoutCarruselDestacados) {
    clearTimeout(timeoutCarruselDestacados);
    timeoutCarruselDestacados = null;
  }

  if (ajusteInfinitoDestacados) {
    clearTimeout(ajusteInfinitoDestacados);
    ajusteInfinitoDestacados = null;
  }
}

function obtenerTarjetaVisibleDestacados(carrusel) {
  const tarjetas = [...carrusel.querySelectorAll(".destacado-publicado")];
  if (!tarjetas.length) return 0;

  const centro = carrusel.scrollLeft + (carrusel.clientWidth / 2);
  let mejorIndice = 0;
  let mejorDistancia = Infinity;

  tarjetas.forEach((tarjeta, indice) => {
    const centroTarjeta = tarjeta.offsetLeft + (tarjeta.offsetWidth / 2);
    const distancia = Math.abs(centro - centroTarjeta);

    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejorIndice = indice;
    }
  });

  return mejorIndice;
}

function irATarjetaDestacada(carrusel, indice, suave = true) {
  const tarjetas = [...carrusel.querySelectorAll(".destacado-publicado")];
  if (!tarjetas[indice]) return;

  carrusel.scrollTo({
    left: tarjetas[indice].offsetLeft - carrusel.offsetLeft,
    behavior: suave ? "smooth" : "auto"
  });

  indiceCarruselDestacados = indice;
}

function normalizarCarruselInfinito(carrusel) {
  const tarjetas = [...carrusel.querySelectorAll(".destacado-publicado")];
  if (tarjetas.length <= 2) return;

  // Estructura: [clon último] [originales...] [clon primero]
  const ultimoIndice = tarjetas.length - 1;

  if (indiceCarruselDestacados === 0) {
    // Si llegamos al clon del último por la izquierda,
    // saltamos sin animación al último original.
    indiceCarruselDestacados = ultimoIndice - 1;
    irATarjetaDestacada(carrusel, indiceCarruselDestacados, false);
  } else if (indiceCarruselDestacados === ultimoIndice) {
    // Si llegamos al clon del primero por la derecha,
    // saltamos sin animación al primer original.
    indiceCarruselDestacados = 1;
    irATarjetaDestacada(carrusel, 1, false);
  }
}

function iniciarCarruselDestacados() {
  const carrusel = document.querySelector(".carrusel-destacados");

  detenerCarruselDestacados();
  if (!carrusel) return;

  // Limpiar clones anteriores por si se reinicia el carrusel.
  carrusel.querySelectorAll(".destacado-clon-infinito").forEach((clon) => clon.remove());

  const originales = [...carrusel.querySelectorAll(".destacado-publicado")];

  // Sin puntos/contadores debajo.
  const indicadores = carrusel.parentElement?.querySelector(".destacados-indicadores");
  if (indicadores) indicadores.remove();

  if (originales.length <= 1) return;

  // Clonamos último y primero para lograr el efecto infinito.
  const clonUltimo = originales[originales.length - 1].cloneNode(true);
  clonUltimo.classList.add("destacado-clon-infinito");
  clonUltimo.setAttribute("aria-hidden", "true");

  const clonPrimero = originales[0].cloneNode(true);
  clonPrimero.classList.add("destacado-clon-infinito");
  clonPrimero.setAttribute("aria-hidden", "true");

  carrusel.prepend(clonUltimo);
  carrusel.append(clonPrimero);

  // Empezamos en el primer anuncio real.
  requestAnimationFrame(() => {
    indiceCarruselDestacados = 1;
    irATarjetaDestacada(carrusel, 1, false);
  });

  const programarRotacion = () => {
    if (intervaloCarruselDestacados) clearInterval(intervaloCarruselDestacados);

    intervaloCarruselDestacados = setInterval(() => {
      const tarjetas = [...carrusel.querySelectorAll(".destacado-publicado")];
      const siguiente = indiceCarruselDestacados + 1;

      irATarjetaDestacada(carrusel, siguiente, true);

      // Después de llegar suavemente al clon, reposicionamos sin que se note.
      if (siguiente === tarjetas.length - 1) {
        if (ajusteInfinitoDestacados) clearTimeout(ajusteInfinitoDestacados);

        ajusteInfinitoDestacados = setTimeout(() => {
          indiceCarruselDestacados = 1;
          irATarjetaDestacada(carrusel, 1, false);
        }, 650);
      }
    }, 4000);
  };

  const reanudarDespuesDeInteraccion = () => {
    detenerCarruselDestacados();

    timeoutCarruselDestacados = setTimeout(() => {
      indiceCarruselDestacados = obtenerTarjetaVisibleDestacados(carrusel);
      normalizarCarruselInfinito(carrusel);
      programarRotacion();
    }, 1200);
  };

  // Detectar en qué tarjeta quedó el usuario al deslizar.
  let rafScroll = null;
  let timeoutFinScroll = null;

  carrusel.onscroll = () => {
    if (rafScroll) cancelAnimationFrame(rafScroll);

    rafScroll = requestAnimationFrame(() => {
      indiceCarruselDestacados = obtenerTarjetaVisibleDestacados(carrusel);
    });

    if (timeoutFinScroll) clearTimeout(timeoutFinScroll);
    timeoutFinScroll = setTimeout(() => {
      indiceCarruselDestacados = obtenerTarjetaVisibleDestacados(carrusel);
      normalizarCarruselInfinito(carrusel);
    }, 180);
  };

  // Móvil / puntero: solo pausa si realmente presiona.
  carrusel.onpointerdown = () => detenerCarruselDestacados();
  carrusel.onpointerup = reanudarDespuesDeInteraccion;
  carrusel.onpointercancel = reanudarDespuesDeInteraccion;

  // Arrastre real con mouse en PC sin seleccionar texto.
  let arrastrandoMouse = false;
  let movioMouse = false;
  let inicioMouseX = 0;
  let scrollInicioMouse = 0;

  carrusel.onmousedown = (e) => {
    if (e.button !== 0) return;

    arrastrandoMouse = true;
    movioMouse = false;
    inicioMouseX = e.pageX;
    scrollInicioMouse = carrusel.scrollLeft;

    detenerCarruselDestacados();
    carrusel.classList.add("arrastrando");
    e.preventDefault();
  };

  carrusel.onmousemove = (e) => {
    if (!arrastrandoMouse) return;

    const distancia = e.pageX - inicioMouseX;

    if (Math.abs(distancia) > 5) movioMouse = true;

    carrusel.scrollLeft = scrollInicioMouse - distancia;
    e.preventDefault();
  };

  const terminarArrastreMouse = () => {
    if (!arrastrandoMouse) return;

    arrastrandoMouse = false;
    carrusel.classList.remove("arrastrando");

    indiceCarruselDestacados = obtenerTarjetaVisibleDestacados(carrusel);
    normalizarCarruselInfinito(carrusel);
    reanudarDespuesDeInteraccion();
  };

  carrusel.onmouseup = terminarArrastreMouse;

  carrusel.onmouseleave = () => {
    if (arrastrandoMouse) terminarArrastreMouse();
  };

  // Evita abrir un anuncio por accidente después de arrastrarlo con mouse.
  if (!carrusel.dataset.bloqueoClickArrastre) {
    carrusel.dataset.bloqueoClickArrastre = "1";

    carrusel.addEventListener("click", (e) => {
      if (movioMouse) {
        e.preventDefault();
        e.stopPropagation();
        movioMouse = false;
      }
    }, true);
  }

  programarRotacion();
}


async function cargarDestacadosPublicados() {
  const carrusel = document.querySelector(".carrusel-destacados");

  if (!carrusel) return;

  try {
    const respuesta = await fetch(`destacados.json?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const destacados = await respuesta.json();
    const fechaActual = obtenerFechaISOExhibicion();

    const visibles = mezclarLista(
      (Array.isArray(destacados) ? destacados : [])
        .filter((item) => destacadoVigente(item, fechaActual))
        .filter((item) => encontrarNegocioPorSlug(item.negocioSlug))
    );

    detenerCarruselDestacados();

    if (visibles.length === 0) {
      carrusel.innerHTML = [1, 2, 3, 4]
        .map(crearDestacadoProximamente)
        .join("");
      iniciarCarruselDestacados();
      return;
    }

    const tarjetasReales = visibles.map(crearTarjetaDestacado);
    const tarjetasDemo = [];

    // SOLO PARA ESTA PRUEBA VISUAL: completamos hasta 4 tarjetas
    // con "Próximamente" para poder probar el carrusel y la rotación.
    for (let i = tarjetasReales.length; i < 4; i++) {
      tarjetasDemo.push(crearDestacadoProximamente(i + 1));
    }

    carrusel.innerHTML = [...tarjetasReales, ...tarjetasDemo].join("");

    iniciarCarruselDestacados();

  } catch (error) {
    console.warn("No se pudo cargar destacados.json:", error);

    carrusel.innerHTML = `
      <div class="card">
        <h3>⭐ Próximamente</h3>
        <p>Muy pronto encontrarás aquí promociones destacadas de Frontera Comalapa.</p>
      </div>
    `;
  }
}


function abrirLightbox(categoria, index, fotoIndex) {

    const negocio = negocios[categoria][index];
    const foto = negocio.galeria[fotoIndex];

    document.body.insertAdjacentHTML("beforeend", `
        <div class="lightbox">

            <button class="lightbox-anterior" onclick="cambiarFoto(-1)">❮</button>

            <img id="lightbox-img"
                 src="${foto}"
                 draggable="false"
                 data-categoria="${categoria}"
                 data-index="${index}"
                 data-foto="${fotoIndex}">
                 

            <button class="lightbox-siguiente" onclick="cambiarFoto(1)">❯</button>

            <button class="lightbox-cerrar" onclick="cerrarLightbox()">✕</button>
            <div class="lightbox-contador">
    ${fotoIndex + 1} / ${negocio.galeria.length}
</div>

        </div>
    `);

}

function cerrarLightbox() {
  const lightbox = document.querySelector(".lightbox");
  if (lightbox) lightbox.remove();
}
function cambiarFoto(direccion) {
  const img = document.getElementById("lightbox-img");

  if (!img) return;

  const categoria = img.dataset.categoria;
  const index = Number(img.dataset.index);
  let fotoIndex = Number(img.dataset.foto);

  const negocio = negocios[categoria][index];
  const totalFotos = negocio.galeria.length;

  fotoIndex = fotoIndex + direccion;

  if (fotoIndex < 0) {
    fotoIndex = totalFotos - 1;
  }

  if (fotoIndex >= totalFotos) {
    fotoIndex = 0;
  }

  img.src = negocio.galeria[fotoIndex];
  img.dataset.foto = fotoIndex;
  const contador = document.querySelector(".lightbox-contador");
if (contador) {
  contador.textContent = `${fotoIndex + 1} / ${totalFotos}`;
}
}

document.addEventListener("keydown", function(event) {
  const lightbox = document.querySelector(".lightbox");

  if (!lightbox) return;

  if (event.key === "ArrowRight") {
    cambiarFoto(1);
  }

  if (event.key === "ArrowLeft") {
    cambiarFoto(-1);
  }

  if (event.key === "Escape") {
    cerrarLightbox();
  }
});
let touchInicioX = 0;

document.addEventListener("touchstart", function(event) {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  touchInicioX = event.touches[0].clientX;
});

document.addEventListener("touchend", function(event) {
  const lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;

  const touchFinalX = event.changedTouches[0].clientX;
  const diferencia = touchInicioX - touchFinalX;

  if (diferencia > 50) {
    cambiarFoto(1);
  }

  if (diferencia < -50) {
    cambiarFoto(-1);
  }
});

// ============================================================
// ABRIR VISTA DESDE URL / INICIALIZAR HISTORIAL
// ============================================================

function renderizarEstadoNavegacion(estado) {
  if (!estado || estado.vista === "inicio") {
    mostrarInicio({
      actualizarHistorial: false,
      desplazar: false
    });
    return;
  }

  if (estado.vista === "categoria" && estado.categoria) {
    mostrarCategoria(estado.categoria, {
      actualizarHistorial: false
    });
    return;
  }

  if (estado.vista === "perfil" && estado.slug) {
    const encontrado = encontrarNegocioPorSlug(estado.slug);

    if (encontrado) {
      verPerfil(encontrado.categoria, encontrado.index, {
        actualizarHistorial: false
      });
      return;
    }
  }

  mostrarInicio({
    actualizarHistorial: false,
    desplazar: false
  });
}

function prepararNavegacionInicial() {
  const parametros = new URLSearchParams(window.location.search);
  const slugBuscado = parametros.get("negocio");
  const categoriaBuscada = parametros.get("categoria");

  if (slugBuscado) {
    const encontrado = encontrarNegocioPorSlug(slugBuscado);

    if (encontrado) {
      history.replaceState(
        { vista: "inicio" },
        "",
        construirURL()
      );

      history.pushState(
        { vista: "categoria", categoria: encontrado.categoria },
        "",
        construirURL({ categoria: encontrado.categoria })
      );

      history.pushState(
        { vista: "perfil", categoria: encontrado.categoria, slug: slugBuscado },
        "",
        construirURL({ negocio: slugBuscado })
      );

      verPerfil(encontrado.categoria, encontrado.index, {
        actualizarHistorial: false
      });

      return;
    }
  }

  if (categoriaBuscada && negocios[categoriaBuscada]) {
    history.replaceState(
      { vista: "inicio" },
      "",
      construirURL()
    );

    history.pushState(
      { vista: "categoria", categoria: categoriaBuscada },
      "",
      construirURL({ categoria: categoriaBuscada })
    );

    mostrarCategoria(categoriaBuscada, {
      actualizarHistorial: false
    });

    return;
  }

  history.replaceState(
    { vista: "inicio" },
    "",
    construirURL()
  );

  mostrarInicio({
    actualizarHistorial: false,
    desplazar: false
  });
}

window.addEventListener("popstate", function(event) {
  renderizarEstadoNavegacion(event.state);
});

cargaNegociosPublicados.finally(async () => {
  prepararNavegacionInicial();
  await cargarDestacadosPublicados();
});
