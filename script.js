// =========================
// DATOS DE NEGOCIOS POR CATEGORÍA
// Aquí agregas o quitas negocios de cada categoría.
// =========================

const negocios = {
  streaming: [
    ["📺 Ámbar Streaming", "Netflix, Disney+, Max, Prime Video, VIX y más.", "Ámbar Streaming", "99"],
    ["🎵 Spotify Premium", "Música sin anuncios.", "Spotify Premium", "95"],
    ["🎬 VIX Premium", "Series, películas y deportes.", "VIX Premium", "70"],
    ["🎥 Netflix Premium", "Películas y series en alta calidad.", "Netflix Premium", "99"],
    ["🏰 Disney Premium", "Películas, series y contenido familiar.", "Disney Premium", "80"],
    ["🎞️ Max HBO", "Películas, series y estrenos.", "Max HBO", "80"],
    ["📦 Prime Video", "Películas, series y beneficios Prime.", "Prime Video", "70"],
    ["🎭 Paramount Plus", "Series, películas y entretenimiento.", "Paramount Plus", "70"],
    ["🍥 Crunchyroll", "Anime y estrenos japoneses.", "Crunchyroll", "70"],
    ["▶️ YouTube Premium", "Videos sin anuncios y música.", "YouTube Premium", "95"]
  ],

  construccion: [
    ["🏗️ Materiales Díaz", "Cemento, block, varilla y agregados."],
    ["🔧 Ferretería Central", "Herramientas, pinturas y accesorios."],
    ["🏢 Aceros del Sur", "Lámina, perfiles y estructuras metálicas."],
    ["👷 Albañil de confianza", "Construcción, remodelación y reparaciones."],
    ["🧱 Venta de block", "Block, grava, arena y material para obra."]
  ],

  comida: [
    ["🍔 Restaurante El Buen Sabor", "Comida local y pedidos especiales."],
    ["🌮 Tacos Don Pepe", "Tacos, gringas y quesadillas."],
    ["🍗 Pollería Dos Hermanos", "Pollo fresco y pedidos por WhatsApp."],
    ["🍕 Pizzería Comalapa", "Pizzas, alitas y promociones."],
    ["☕ Cafetería La Plaza", "Café, postres y desayunos."]
  ],

  salud: [
    ["🦷 Clínica Dental M", "Consultas, limpiezas y citas dentales."],
    ["👨‍⚕️ Consultorio Médico San José", "Consulta general y control médico."],
    ["💊 Farmacia La Esperanza", "Medicamentos y productos de salud."],
    ["🧪 Laboratorio Clínico Comalapa", "Análisis clínicos y estudios."],
  ],

  veterinarias: [
  ["🐶 Veterinaria San Francisco", "Atención médica para mascotas."],
  ["🐾 Clínica Veterinaria Comalapa", "Consultas, vacunas y estética canina."],
  ["🦴 Pet Shop Comalapa", "Alimento, accesorios y productos para mascotas."]
],

  hoteles: [
    ["🏨 Hotel Central", "Habitaciones cómodas en Comalapa."],
    ["🛏️ Hotel La Plaza", "Hospedaje familiar y céntrico."],
    ["🏡 Posada El Descanso", "Habitaciones económicas."],
    ["🌙 Hotel Camino Real", "Hospedaje cómodo y seguro."]
  ],

  automotriz: [
    ["🚗 Taller García", "Mecánica general y diagnóstico."],
    ["🏍️ Taller de Motos El Rápido", "Reparación y mantenimiento de motocicletas."],
    ["🔩 Refacciones El Motor", "Refacciones para autos y motos."],
    ["🧽 Lavado El Rápido", "Lavado, aspirado y encerado."],
    ["🛞 Llantera Comalapa", "Venta y reparación de llantas."]
  ],

  servicios: [
    ["🪟 Balconería, Vidrios y Aluminios El Perico", "Ventanas, puertas, vitrinas, espejos, barandales, escaleras, portones, herrería y aluminio."]
  ],

  peluquerias: [
    ["💈 Barbería El Estilo", "Cortes modernos y arreglo de barba."],
    ["💇‍♀️ Estética Bella", "Peinados, tintes y tratamientos."],
    ["✂️ Cortes a Domicilio Luis", "Servicio a domicilio."],
    ["💅 Uñas y Belleza", "Uñas, maquillaje y estética."]
  ],

  mandaditos: [
    ["🛵 Mandaditos Express", "Compras, entregas y mandados."],
    ["🏍️ Moto Envíos Comalapa", "Entrega rápida local."],
    ["🚨 Auxilio Mandaditos", "Servicio urgente en la ciudad."]
  ],

  tiendas: [
    ["🛒 Abarrotes Lupita", "Despensa, bebidas y productos básicos."],
    ["🏪 Tienda El Centro", "Abarrotes y artículos para el hogar."],
    ["🛍️ Mini Súper Comalapa", "Productos variados y servicio rápido."],
    ["👕 Boutique La Moda", "Ropa, accesorios y novedades."],
    ["👟 Zapatería Comalapa", "Calzado para dama, caballero y niños."]
  ],

  profesionales: [
    ["💼 Contador Público Hernández", "Contabilidad, declaraciones y asesoría fiscal."],
    ["⚖️ Abogado Martínez", "Asesoría legal y trámites jurídicos."],
    ["🏛️ Arquitecto López", "Diseño, planos y proyectos de construcción."],
    ["👷 Ingeniero Civil Pérez", "Supervisión de obra y presupuestos."],
    ["📄 Gestoría Comalapa", "Trámites, documentos y asesorías."]
  ],

  belleza: [
  ["💇 Estética Lupita", "Cortes, tintes y peinados."],
  ["💅 Uñas Glamour", "Aplicación de uñas y manicure."],
  ["💄 Makeup Comalapa", "Maquillaje profesional para eventos."]
],

comercios: [
  ["🛒 Abarrotes Lupita", "Despensa y productos básicos."],
  ["🏪 Mini Súper Comalapa", "Bebidas, botanas y abarrotes."],
  ["👕 Boutique La Moda", "Ropa y accesorios."]
],

  bienesraices: [
  ["🏡 Terreno en Venta", "Lote con buena ubicación en Comalapa."],
  ["🏠 Casa Familiar", "Casa amplia con varias habitaciones."],
  ["🏢 Local Comercial", "Renta de local para negocio."],
  ["🌄 Terrenos Comalapa", "Venta de terrenos urbanos y rurales."],
  ["🔑 Inmobiliaria Ámbar", "Compra, venta y renta de propiedades."]
],

agua: [
  ["💧 Purificadora Agua Cristal", "Venta de agua purificada para hogar y negocio."],

  ["💧 Purificadora El Manantial", "Garrafones, recargas y servicio a domicilio."]
]

};


// =========================
// FUNCIÓN PARA MOSTRAR NEGOCIOS POR CATEGORÍA
// Se activa cuando das clic en una categoría.
// =========================

function mostrarCategoria(categoria) {
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");

  titulo.textContent = "Negocios de " + categoria.toUpperCase();
  lista.innerHTML = "";

  negocios[categoria].forEach(function(negocio) {
    lista.innerHTML += `
      <div class="card">
        <h3>${negocio[0]}</h3>
        <p>${negocio[1]}</p>
        <button class="btn-whatsapp" onclick="verPerfil('${categoria}', '${negocio[0]}')">
  ${categoria === 'streaming' ? 'Comprar' : 'Ver información'}
</button>
      </div>
    `;
  });

  document.querySelector(".resultado").scrollIntoView({ behavior: "smooth" });
}


// =========================
// CARRUSEL AUTOMÁTICO INFINITO DE NEGOCIOS DESTACADOS
// =========================

const carruselDestacados = document.querySelector(".carrusel-destacados");

if (carruselDestacados) {
  const tarjetas = Array.from(carruselDestacados.children);

  tarjetas.forEach((tarjeta) => {
    const copia = tarjeta.cloneNode(true);
    carruselDestacados.appendChild(copia);
  });

  let velocidad = 1;

  setInterval(() => {
    carruselDestacados.scrollLeft += velocidad;

    if (carruselDestacados.scrollLeft >= carruselDestacados.scrollWidth / 2) {
      carruselDestacados.scrollLeft = 0;
    }
  }, 30);
}

// =========================
// DETENER CARRUSEL SI EL USUARIO TOCA EN MÓVIL
// =========================

if (carruselDestacados) {
  carruselDestacados.addEventListener("touchstart", () => {
    clearInterval(movimientoCarrusel);
  });
}
// =========================
// BUSCADOR INTELIGENTE
// =========================

function buscarNegocios() {
    const texto = document
        .getElementById("buscador")
        .value
        .toLowerCase();

    for (const categoria in negocios) {

        const encontrados = negocios[categoria].some(negocio =>
            negocio.join(" ").toLowerCase().includes(texto)
        );

        if (encontrados) {
            mostrarCategoria(categoria);
            return;
        }
    }
}
// =========================
// PERFIL DE NEGOCIO
// =========================

function verPerfil(categoria, nombreNegocio) {
  const titulo = document.getElementById("titulo-categoria");
  const lista = document.getElementById("lista-negocios");

  let negocioEncontrado = null;

  negocios[categoria].forEach(function(negocio) {
    if (negocio[0] === nombreNegocio) {
      negocioEncontrado = negocio;
    }
  });

  if (!negocioEncontrado) {
    alert("No se encontró la información del negocio.");
    return;
  }

  const nombre = negocioEncontrado[0];
  const descripcion = negocioEncontrado[1];

  titulo.style.display = "none";

  lista.innerHTML = `
    <div class="perfil-negocio">
      
      <div class="perfil-galeria">
  <img src="imagenes/perico.webp" class="foto-perfil-banner">
</div>

      <div class="perfil-info">
        <h3>${nombre}</h3>
        <p class="descripcion-perfil">${descripcion}</p>

        <div class="perfil-detalles">
          <div>
            

          <p><strong>📍 Dirección:</strong> Barrio Agua Zarca y Barrio La Alborada, Frontera Comalapa</p>

<p><strong>📞 Teléfono:</strong> 963 635 0461</p>

<p><strong>🕒 Horario:</strong> Lunes a sábado de 8:00 a.m. a 5:00 p.m.</p>
<a class="btn-whatsapp"
href="https://wa.me/529636350461?text=${encodeURIComponent('Hola, vi ' + nombre + ' en Ámbar Negocios Comalapa y me gustaría recibir información.')}">
Contactar por WhatsApp
</a>
        <button class="btn-volver" onclick="mostrarCategoria('${categoria}')">
          Volver a la categoría
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
  document.querySelector(".perfil-galeria").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}, 100);
}
