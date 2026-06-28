const WHATSAPP_GENERAL = "529631181819";

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
    { nombre: "🍔 Restaurante El Buen Sabor", descripcion: "Comida local y pedidos especiales." },
    { nombre: "🌮 Tacos Don Pepe", descripcion: "Tacos, gringas y quesadillas." },
    { nombre: "🍗 Pollería Dos Hermanos", descripcion: "Pollo fresco y pedidos por WhatsApp." },
    { nombre: "🍕 Pizzería Comalapa", descripcion: "Pizzas, alitas y promociones." },
    { nombre: "☕ Cafetería La Plaza", descripcion: "Café, postres y desayunos." }
  ],

  salud: [
    { nombre: "🦷 Clínica Dental M", descripcion: "Consultas, limpiezas y citas dentales." },
    { nombre: "👨‍⚕️ Consultorio Médico San José", descripcion: "Consulta general y control médico." },
    { nombre: "💊 Farmacia La Esperanza", descripcion: "Medicamentos y productos de salud." },
    { nombre: "🧪 Laboratorio Clínico Comalapa", descripcion: "Análisis clínicos y estudios." }
  ],

  veterinarias: [
    { nombre: "🐶 Veterinaria San Francisco", descripcion: "Atención médica para mascotas." },
    { nombre: "🐾 Clínica Veterinaria Comalapa", descripcion: "Consultas, vacunas y estética canina." },
    { nombre: "🦴 Pet Shop Comalapa", descripcion: "Alimento, accesorios y productos para mascotas." }
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
      descripcion: "Ventanas, puertas, vitrinas, espejos, barandales, escaleras, portones, herrería y aluminio.",
      perfil: true,
      imagen: "imagenes/perico.webp",
      direccion: "Barrio Agua Zarca y Barrio La Alborada, Frontera Comalapa",
      telefono: "963 635 0461",
      whatsapp: "529636350461",
      horario: "Lunes a sábado de 8:00 a.m. a 5:00 p.m."
    }
  ],

  belleza: [
    { nombre: "💇 Estética Lupita", descripcion: "Cortes, tintes y peinados." },
    { nombre: "💅 Uñas Glamour", descripcion: "Aplicación de uñas y manicure." },
    { nombre: "💄 Makeup Comalapa", descripcion: "Maquillaje profesional para eventos." }
  ],

  mandaditos: [
    { nombre: "🛵 Mandaditos Express", descripcion: "Compras, entregas y mandados." },
    { nombre: "🏍️ Moto Envíos Comalapa", descripcion: "Entrega rápida local." },
    { nombre: "🚨 Auxilio Mandaditos", descripcion: "Servicio urgente en la ciudad." }
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

  agua: [
    { nombre: "💧 Purificadora Agua Cristal", descripcion: "Venta de agua purificada para hogar y negocio." },
    { nombre: "💧 Purificadora El Manantial", descripcion: "Garrafones, recargas y servicio a domicilio." }
  ]
};

function crearLinkWhatsapp(negocio) {
  const numero = negocio.whatsapp || WHATSAPP_GENERAL;
  const mensaje = `Hola, vi ${negocio.nombre} en Ámbar Negocios Comalapa y quiero información.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function mostrarCategoria(categoria) {
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");

  if (!negocios[categoria]) return;

  titulo.style.display = "block";
  titulo.textContent = "Negocios de " + (categoriasNombres[categoria] || categoria.toUpperCase());
  lista.innerHTML = "";

  negocios[categoria].forEach(function(negocio, index) {
    const boton = negocio.perfil
      ? `<button class="btn-whatsapp" onclick="verPerfil('${categoria}', ${index})">Ver información</button>`
      : `<a class="btn-whatsapp" href="${crearLinkWhatsapp(negocio)}">WhatsApp</a>`;

    lista.innerHTML += `
      <div class="card">
        <h3>${negocio.nombre}</h3>
        <p>${negocio.descripcion}</p>
        ${boton}
      </div>
    `;
  });

  document.querySelector(".resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

function buscarNegocios() {
  const texto = document.getElementById("buscador").value.toLowerCase().trim();

  if (texto === "") return;

  for (const categoria in negocios) {
    const encontrados = negocios[categoria].some(negocio => {
      return `${negocio.nombre} ${negocio.descripcion}`.toLowerCase().includes(texto);
    });

    if (encontrados) {
      mostrarCategoria(categoria);
      return;
    }
  }

  alert("No se encontró ningún negocio con esa búsqueda.");
}

function verPerfil(categoria, index) {
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");
  const negocio = negocios[categoria][index];

  if (!negocio) {
    alert("No se encontró la información del negocio.");
    return;
  }

  titulo.style.display = "none";

  lista.innerHTML = `
    <div class="perfil-negocio">
      <div class="perfil-galeria">
        <img src="${negocio.imagen}" class="foto-perfil-banner" alt="${negocio.nombre}">
      </div>

      <div class="perfil-info">
        <h3>${negocio.nombre}</h3>
        <p class="descripcion-perfil">${negocio.descripcion}</p>

        <div class="perfil-detalles">
          <p><strong>📍 Dirección:</strong> ${negocio.direccion}</p>
          <p><strong>📞 Teléfono:</strong> ${negocio.telefono}</p>
          <p><strong>🕒 Horario:</strong> ${negocio.horario}</p>
        </div>

        <div class="perfil-botones">
          <a class="btn-whatsapp" href="${crearLinkWhatsapp(negocio)}">
            Contactar por WhatsApp
          </a>

          <button class="btn-volver" onclick="mostrarCategoria('${categoria}')">
            Volver a la categoría
          </button>
        </div>
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

// ======================================
// CARRUSEL AUTOMÁTICO DE DESTACADOS
// ======================================

const carrusel = document.querySelector(".carrusel-destacados");

if (carrusel) {

    let velocidad = 1;

    function moverCarrusel() {

        carrusel.scrollLeft += velocidad;

        if (
            carrusel.scrollLeft >=
            carrusel.scrollWidth - carrusel.clientWidth
        ) {
            carrusel.scrollLeft = 0;
        }

    }

    let movimiento = setInterval(moverCarrusel, 20);

    let reinicio;

function pausarCarrusel() {
    clearInterval(movimiento);
    clearTimeout(reinicio);
}

function reanudarCarrusel() {
    clearTimeout(reinicio);

    reinicio = setTimeout(() => {
        movimiento = setInterval(moverCarrusel, 20);
    }, 2000); // Espera 2 segundos antes de volver a moverse
}

// Para PC
carrusel.addEventListener("mousedown", pausarCarrusel);
carrusel.addEventListener("mouseup", reanudarCarrusel);

// Para celulares
carrusel.addEventListener("touchstart", pausarCarrusel);
carrusel.addEventListener("touchend", reanudarCarrusel);

}