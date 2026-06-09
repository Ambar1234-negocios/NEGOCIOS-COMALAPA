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
  ]
};

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
        <a class="btn-whatsapp" href="https://wa.me/529631181819?text=Hola,%20vi%20${encodeURIComponent(negocio[0])}%20en%20Ámbar%20Negocios%20Comalapa%20y%20quiero%20información">
          WhatsApp
        </a>
      </div>
    `;
  });

  document.querySelector(".resultado").scrollIntoView({ behavior: "smooth" });
}