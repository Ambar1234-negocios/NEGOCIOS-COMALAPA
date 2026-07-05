// ============================================================
// ÁMBAR NEGOCIOS COMALAPA
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

  streaming: [
    { nombre: "📺 Ámbar Streaming", descripcion: "Netflix, Disney+, Max, Prime Video, VIX y más.", precio: "99" },
    { nombre: "🎵 Spotify Premium", descripcion: "Música sin anuncios.", precio: "95" },
    { nombre: "🎬 VIX Premium", descripcion: "Series, películas y deportes.", precio: "70" },
    { nombre: "🎥 Netflix Premium", descripcion: "Películas y series en alta calidad.", precio: "99" },
    { nombre: "🏰 Disney Premium", descripcion: "Películas, series y contenido familiar.", precio: "80" },
    { nombre: "🎞️ Max HBO", descripcion: "Películas, series y estrenos.", precio: "80" },
    { nombre: "📦 Prime Video", descripcion: "Películas, series y beneficios Prime.", precio: "70" },
    { nombre: "🎭 Paramount Plus", descripcion: "Series, películas y entretenimiento.", precio: "70" },
    { nombre: "🍥 Crunchyroll", descripcion: "Anime y estrenos japoneses.", precio: "70" },
    { nombre: "▶️ YouTube Premium", descripcion: "Videos sin anuncios y música.", precio: "95" }
  ],

  construccion: [
    { nombre: "🏗️ Materiales Díaz", descripcion: "Cemento, block, varilla y agregados." },
    { nombre: "🔧 Ferretería Central", descripcion: "Herramientas, pinturas y accesorios." },
    { nombre: "🏢 Aceros del Sur", descripcion: "Lámina, perfiles y estructuras metálicas." },
    { nombre: "👷 Albañil de confianza", descripcion: "Construcción, remodelación y reparaciones." },
    { nombre: "🧱 Venta de block", descripcion: "Block, grava, arena y material para obra." }
  ],

  comida: [
    { nombre: "🍔 Restaurante El Buen Sabor", descripcion: "Comida local y pedidos especiales.", delivery: true },
    { nombre: "🌮 Tacos Don Pepe", descripcion: "Tacos, gringas y quesadillas.", delivery: true },
    { nombre: "🍗 Pollería Dos Hermanos", descripcion: "Pollo fresco y pedidos por WhatsApp.", delivery: true },
    { nombre: "🍕 Pizzería Comalapa", descripcion: "Pizzas, alitas y promociones.", delivery: true },
    { nombre: "☕ Cafetería La Plaza", descripcion: "Café, postres y desayunos.", delivery: true }
  ],

  salud: [
    { nombre: "🦷 Clínica Dental M", descripcion: "Consultas, limpiezas y citas dentales." },
    { nombre: "👨‍⚕️ Consultorio Médico San José", descripcion: "Consulta general y control médico." },
    { nombre: "💊 Farmacia La Esperanza", descripcion: "Medicamentos y productos de salud." },
    { nombre: "🧪 Laboratorio Clínico Comalapa", descripcion: "Análisis clínicos y estudios." }
  ],

  hoteles: [
    { nombre: "🏨 Hotel Central", descripcion: "Habitaciones cómodas en Comalapa." },
    { nombre: "🛏️ Hotel La Plaza", descripcion: "Hospedaje familiar y céntrico." },
    { nombre: "🏡 Posada El Descanso", descripcion: "Habitaciones económicas." },
    { nombre: "🌙 Hotel Camino Real", descripcion: "Hospedaje cómodo y seguro." }
  ],

  automotriz: [
    { nombre: "🚗 Taller García", descripcion: "Mecánica general y diagnóstico." },
    { nombre: "🏍️ Taller de Motos El Rápido", descripcion: "Reparación y mantenimiento de motocicletas." },
    { nombre: "🔩 Refacciones El Motor", descripcion: "Refacciones para autos y motos." },
    { nombre: "🧽 Lavado El Rápido", descripcion: "Lavado, aspirado y encerado." },
    { nombre: "🛞 Llantera Comalapa", descripcion: "Venta y reparación de llantas." }
  ],

  servicios: [
    {
      nombre: "🪟 Balconería, Vidrios y Aluminios El Perico",
      descripcion: "Especialistas en fabricación e instalación de aluminio, vidrio y herrería.",
      perfil: true,
      plan: "basico",
      destacado: false,

      imagen: "imagenes/perico.webp",

      servicios: [
        "Ventanas",
        "Puertas",
        "Vitrinas",
        "Espejos",
        "Barandales",
        "Escaleras",
        "Portones",
        "Herrería",
        "Aluminio"
      ],

      direccion: "Barrio Agua Zarca y Barrio La Alborada, Frontera Comalapa",
      telefono: "963 635 0461",
      whatsapp: "529636350461",
      horario: "Lunes a sábado de 8:00 a.m. a 5:00 p.m.",

      maps: "https://www.google.com/maps/search/?api=1&query=Balconeria+Vidrios+Aluminios+El+Perico+Frontera+Comalapa",
      video: "https://www.facebook.com/",
      delivery: false
    }
  ],

  belleza: [
    { nombre: "💇 Estética Lupita", descripcion: "Cortes, tintes y peinados." },
    { nombre: "💅 Uñas Glamour", descripcion: "Aplicación de uñas y manicure." },
    { nombre: "💄 Makeup Comalapa", descripcion: "Maquillaje profesional para eventos." }
  ],

  mandaditos: [
    { nombre: "🛵 Mandaditos Express", descripcion: "Compras, entregas y mandados.", delivery: true },
    { nombre: "🏍️ Moto Envíos Comalapa", descripcion: "Entrega rápida local.", delivery: true },
    { nombre: "🚨 Auxilio Mandaditos", descripcion: "Servicio urgente en la ciudad.", delivery: true }
  ],

  comercios: [
    { nombre: "🛒 Abarrotes Lupita", descripcion: "Despensa y productos básicos." },
    { nombre: "🏪 Mini Súper Comalapa", descripcion: "Bebidas, botanas y abarrotes." },
    { nombre: "👕 Boutique La Moda", descripcion: "Ropa y accesorios." }
  ],

  profesionales: [
    { nombre: "💼 Contador Público Hernández", descripcion: "Contabilidad, declaraciones y asesoría fiscal." },
    { nombre: "⚖️ Abogado Martínez", descripcion: "Asesoría legal y trámites jurídicos." },
    { nombre: "🏛️ Arquitecto López", descripcion: "Diseño, planos y proyectos de construcción." },
    { nombre: "👷 Ingeniero Civil Pérez", descripcion: "Supervisión de obra y presupuestos." },
    { nombre: "📄 Gestoría Comalapa", descripcion: "Trámites, documentos y asesorías." }
  ],

  bienesraices: [
    { nombre: "🏡 Terreno en Venta", descripcion: "Lote con buena ubicación en Comalapa." },
    { nombre: "🏠 Casa Familiar", descripcion: "Casa amplia con varias habitaciones." },
    { nombre: "🏢 Local Comercial", descripcion: "Renta de local para negocio." },
    { nombre: "🌄 Terrenos Comalapa", descripcion: "Venta de terrenos urbanos y rurales." },
    { nombre: "🔑 Inmobiliaria Ámbar", descripcion: "Compra, venta y renta de propiedades." }
  ],

  veterinarias: [
    { nombre: "🐶 Veterinaria San Francisco", descripcion: "Atención médica para mascotas." },
    { nombre: "🐾 Clínica Veterinaria Comalapa", descripcion: "Consultas, vacunas y estética canina." },
    { nombre: "🦴 Pet Shop Comalapa", descripcion: "Alimento, accesorios y productos para mascotas." }
  ],

  agua: [
    { nombre: "💧 Purificadora Agua Cristal", descripcion: "Venta de agua purificada para hogar y negocio." },
    { nombre: "💧 Purificadora El Manantial", descripcion: "Garrafones, recargas y servicio a domicilio.", delivery: true }
  ]
};


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function crearLinkWhatsapp(negocio) {
  const numero = negocio.whatsapp || WHATSAPP_GENERAL;
  const mensaje = `Hola, vi ${negocio.nombre} en Ámbar Negocios Comalapa y quiero información.`;
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

  const imagenHTML = tieneDato(negocio.imagen)
    ? `
      <div class="perfil-galeria">
        <img src="${negocio.imagen}" class="foto-perfil-banner" alt="${negocio.nombre}">
      </div>
    `
    : "";

  const serviciosHTML = negocio.servicios && negocio.servicios.length > 0
    ? `
      <h4>🛠️ Servicios</h4>
      <ul class="lista-servicios">
        ${negocio.servicios.map(servicio => `<li>✔ ${servicio}</li>`).join("")}
      </ul>
    `
    : "";

  const detallesHTML = `
    <div class="perfil-detalles">
      ${tieneDato(negocio.direccion) ? `<p><strong>📍 Dirección:</strong> ${negocio.direccion}</p>` : ""}
      ${tieneDato(negocio.telefono) ? `<p><strong>📞 Teléfono:</strong> ${negocio.telefono}</p>` : ""}
      ${tieneDato(negocio.horario) ? `<p><strong>🕒 Horario:</strong> ${negocio.horario}</p>` : ""}
    </div>
  `;

  const botonesHTML = `
    <div class="perfil-botones">

      <a class="btn-whatsapp" href="${crearLinkWhatsapp(negocio)}" target="_blank">
        WhatsApp
      </a>

      ${tieneDato(negocio.maps) ? `
        <a class="btn-volver" href="${negocio.maps}" target="_blank">
          Cómo llegar
        </a>
      ` : ""}

      ${tieneDato(negocio.video) ? `
        <a class="btn-volver" href="${negocio.video}" target="_blank">
          Ver video informativo
        </a>
      ` : ""}

      ${negocio.delivery === true ? `
        <a class="btn-whatsapp" href="${crearLinkPedido(negocio)}" target="_blank">
          Pedir a domicilio
        </a>
      ` : ""}

      <button class="btn-volver" onclick="mostrarCategoria('${categoria}')">
        Volver a la categoría
      </button>

    </div>
  `;

  lista.innerHTML = `
    <div class="perfil-negocio">

      ${imagenHTML}

      <div class="perfil-info">
        <h3>${negocio.nombre}</h3>

        <div class="perfil-grid">

          <div class="perfil-columna">
            ${tieneDato(negocio.descripcion) ? `<p class="descripcion-perfil">${negocio.descripcion}</p>` : ""}
            ${serviciosHTML}
          </div>

          <div class="perfil-columna">
            ${detallesHTML}
          </div>

        </div>

        ${botonesHTML}
      </div>

    </div>
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
