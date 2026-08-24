// ============================================================
// EXHIBICIÓN FRONTERA COMALAPA
// script.js - Versión 1.2
// Perfil inteligente + todos los negocios con "Ver información"
// ============================================================


// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

const WHATSAPP_GENERAL = "529631181819";


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
  const mensaje = `Hola, quiero pedir a domicilio de ${negocio.nombre}.

Mi pedido es:
Cantidad:
Dirección:
Referencia:
Forma de pago:`;
  return `https://wa.me/${WHATSAPP_GENERAL}?text=${encodeURIComponent(mensaje)}`;
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
// MOSTRAR CATEGORÍA
// ============================================================

function mostrarCategoria(categoria) {
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");

  if (!negocios[categoria]) return;

  titulo.style.display = "block";
  titulo.textContent = "Negocios de " + (categoriasNombres[categoria] || categoria.toUpperCase());
  lista.innerHTML = "";

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

  document.querySelector(".resultado").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
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

function verPerfil(categoria, index) {
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");
  const negocio = negocios[categoria][index];

  if (!negocio) {
    alert("No se encontró la información del negocio.");
    return;
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

      ${negocio.telefono ? `
        <div class="detalle-card">
          <h4>📞 Teléfono / WhatsApp</h4>
          <p>${negocio.telefono}</p>
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

      <a class="accion accion-whatsapp" href="${crearLinkWhatsapp(negocio)}" target="_blank">
        <span>💬</span>
        <div>
          <strong>WhatsApp</strong>
          <small>Enviar mensaje</small>
        </div>
      </a>

      ${negocio.delivery === true ? `
        <a class="accion accion-delivery" href="${crearLinkPedido(negocio)}" target="_blank">
          <span>🛵</span>
          <div>
            <strong>Pedir a domicilio</strong>
            <small>Coordinar entrega</small>
          </div>
        </a>
      ` : ""}

      ${negocio.maps ? `
        <a class="accion accion-maps" href="${negocio.maps}" target="_blank">
          <span>📍</span>
          <div>
            <strong>Cómo llegar</strong>
            <small>Ver en mapa</small>
          </div>
        </a>
      ` : ""}

      ${negocio.video ? `
        <a class="accion accion-video" href="${negocio.video}" target="_blank">
          <span>▶️</span>
          <div>
            <strong>Ver video</strong>
            <small>Facebook Exhibición</small>
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

      <button class="btn-regresar-perfil" onclick="mostrarCategoria('${categoria}')">
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
// CARRUSEL INFINITO DE DESTACADOS
// ============================================================

const carrusel = document.querySelector(".carrusel-destacados");

if (carrusel) {

  carrusel.innerHTML += carrusel.innerHTML;

  let velocidad = 1;
  let movimiento;
  let reinicio;

  function moverCarrusel() {
    carrusel.scrollLeft += velocidad;

    if (carrusel.scrollLeft >= carrusel.scrollWidth / 2) {
      carrusel.scrollLeft -= carrusel.scrollWidth / 2;
    }
  }

  function iniciar() {
    movimiento = setInterval(moverCarrusel, 20);
  }

  function detener() {
    clearInterval(movimiento);
    clearTimeout(reinicio);
  }

  function continuar() {
    clearTimeout(reinicio);

    reinicio = setTimeout(() => {
      iniciar();
    }, 2000);
  }

  iniciar();

  carrusel.addEventListener("mousedown", detener);
  carrusel.addEventListener("mouseup", continuar);

  carrusel.addEventListener("touchstart", detener);
  carrusel.addEventListener("touchend", continuar);
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
// ABRIR PERFIL DESDE EL PANEL
// ============================================================

function abrirNegocioDesdeURL() {
  const parametros = new URLSearchParams(window.location.search);
  const slugBuscado = parametros.get("negocio");

  if (!slugBuscado) return;

  for (const categoria in negocios) {
    const index = negocios[categoria].findIndex(
      (negocio) => negocio.slug === slugBuscado
    );

    if (index !== -1) {
      setTimeout(() => {
        verPerfil(categoria, index);
      }, 200);

      return;
    }
  }
}

cargaNegociosPublicados.finally(() => abrirNegocioDesdeURL());