// =========================
// DATOS DE NEGOCIOS POR CATEGORÍA
// Aquí agregas o quitas negocios de cada categoría.
// =========================

const negocios = {
  construccion: [
    ["Materiales Díaz", "Cemento, block, varilla y agregados."],
    ["Ferretería Central", "Herramientas, pinturas y accesorios."],
    ["Aceros del Sur", "Lámina, perfiles y estructuras metálicas."]
  ],

  comida: [
    ["Restaurante El Buen Sabor", "Comida local y antojitos."],
    ["Tacos Don Pepe", "Tacos, gringas y quesadillas."],
    ["Pollería Dos Hermanos", "Pollo fresco y pedidos por WhatsApp."]
  ],

  salud: [
    ["Clínica Dental M", "Consultas, limpiezas y ortodoncia."],
    ["Consultorio Médico San José", "Consulta general y control médico."],
    ["Farmacia La Esperanza", "Medicamentos y productos de salud."]
  ],

  hoteles: [
    ["Hotel Central", "Habitaciones cómodas en Comalapa."],
    ["Hotel La Plaza", "Hospedaje familiar y céntrico."],
    ["Posada El Descanso", "Habitaciones económicas."]
  ],

  automotriz: [
    ["Taller García", "Mecánica general y diagnóstico."],
    ["Refacciones El Motor", "Refacciones para autos y motos."],
    ["Lavado El Rápido", "Lavado, aspirado y encerado."]
  ],

  servicios: [
    ["Herrería López", "Portones, puertas y estructuras."],
    ["Vidriería Comalapa", "Cristales, ventanas y aluminio."],
    ["Electricista Ramos", "Instalaciones y reparaciones."]
  ],

  peluquerias: [
    ["Barbería El Estilo", "Cortes modernos y arreglo de barba."],
    ["Estética Bella", "Peinados, tintes y tratamientos."],
    ["Cortes a Domicilio Luis", "Servicio a domicilio."]
  ],

  mandaditos: [
    ["Mandaditos Express", "Compras, entregas y mandados."],
    ["Moto Envíos Comalapa", "Entrega rápida local."],
    ["Auxilio Mandaditos", "Servicio urgente en la ciudad."]
  ],

 tiendas: [
  ["Abarrotes Lupita", "Despensa, bebidas y productos básicos."],
  ["Tienda El Centro", "Abarrotes y artículos para el hogar."],
  ["Mini Súper Comalapa", "Productos variados y servicio rápido."]
],

streaming: [
  ["🎬 Netflix Premium", "Mensualidad: $99 MXN", "Netflix Premium", "99"],
  ["🏰 Disney+ Premium", "Mensualidad: $80 MXN", "Disney+ Premium", "80"],
  ["🎥 Max / HBO Max", "Mensualidad: $80 MXN", "Max / HBO Max", "80"],
  ["📦 Prime Video", "Mensualidad: $70 MXN", "Prime Video", "70"],
  ["⚽ VIX Premium", "Mensualidad: $70 MXN", "VIX Premium", "70"],
  ["🎞️ Paramount+", "Mensualidad: $70 MXN", "Paramount+", "70"],
  ["🍥 Crunchyroll", "Mensualidad: $70 MXN", "Crunchyroll", "70"],
  ["🎵 Spotify Premium", "Mensualidad: $95 MXN", "Spotify Premium", "95"],
  ["▶️ YouTube Premium", "Mensualidad: $95 MXN", "YouTube Premium", "95"]
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
        <a class="btn-whatsapp" href="https://wa.me/529631181819?text=${categoria === 'streaming'
  ? encodeURIComponent('Hola, quiero comprar ' + negocio[2] + ' por $' + negocio[3] + ' pesos.')
  : encodeURIComponent('Hola, vi ' + negocio[0] + ' en Ámbar Negocios Comalapa y quiero información.')
}">
  ${categoria === 'streaming' ? 'Comprar' : 'WhatsApp'}
</a>
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
