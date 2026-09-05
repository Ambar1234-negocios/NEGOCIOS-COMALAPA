// ============================================================
// EXHIBICIÓN FRONTERA COMALAPA
// panel.js - Panel administrativo
// ============================================================


// ============================================================
// REFERENCIA PRINCIPAL DEL FORMULARIO
// ============================================================

const formulario = document.getElementById("form-negocio");

const campoDelivery = document.getElementById("delivery");
const campoTipoDelivery = document.getElementById("tipo-delivery");

function actualizarControlDelivery() {
  if (!campoDelivery || !campoTipoDelivery) return;

  campoTipoDelivery.disabled = !campoDelivery.checked;

  if (!campoDelivery.checked) {
    campoTipoDelivery.value = "gratis";
  }
}

campoDelivery?.addEventListener("change", actualizarControlDelivery);


const campoSlug = document.getElementById("slug");
const rutaImagenes = document.getElementById("ruta-imagenes");

campoSlug.addEventListener("input", function () {
  const slug = campoSlug.value.trim();

  rutaImagenes.textContent = slug
    ? `imagenes/${slug}/`
    : "imagenes/nombre-del-negocio/";
});

const campoGaleria = document.getElementById("galeria");

campoGaleria.addEventListener("change", function () {
  const cantidad = campoGaleria.files.length;

  if (cantidad === 0) return;

  let mensaje = "Las fotos de galería deben llamarse:\n\n";

  for (let i = 1; i <= cantidad; i++) {
    mensaje += `foto-${i}.webp\n`;
  }

  alert(mensaje);
});

const campoBanner = document.getElementById("banner");
const previewBanner = document.getElementById("preview-banner");

campoBanner.addEventListener("change", function () {
  const archivo = campoBanner.files[0];

  if (!archivo) {
    previewBanner.removeAttribute("src");
    return;
  }

  const urlTemporal = URL.createObjectURL(archivo);
  previewBanner.src = urlTemporal;
});

const nombreBanner = document.getElementById("nombre-banner");

campoBanner.addEventListener("change", function () {
  const archivo = campoBanner.files[0];

  nombreBanner.textContent = archivo
    ? archivo.name
    : "Ningún banner seleccionado";
});
const previewGaleria = document.getElementById("preview-galeria");

campoGaleria.addEventListener("change", function () {
  previewGaleria.innerHTML = "";

  const archivos = Array.from(campoGaleria.files);

  archivos.forEach((archivo) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(archivo);
    img.alt = "Vista previa de galería";

    previewGaleria.appendChild(img);
  });
});

const cantidadGaleria = document.getElementById("cantidad-galeria");

campoGaleria.addEventListener("change", function () {
  const cantidad = campoGaleria.files.length;

  cantidadGaleria.textContent =
    cantidad === 1
      ? "1 foto seleccionada"
      : `${cantidad} fotos seleccionadas`;
});

const campoLogo = document.getElementById("logo");
const previewLogo = document.getElementById("preview-logo");

campoLogo.addEventListener("change", function () {
  const archivo = campoLogo.files[0];

  if (!archivo) {
    previewLogo.removeAttribute("src");
    return;
  }

  const urlTemporal = URL.createObjectURL(archivo);
  previewLogo.src = urlTemporal;
});

const nombreLogo = document.getElementById("nombre-logo");

campoLogo.addEventListener("change", function () {
  const archivo = campoLogo.files[0];

  nombreLogo.textContent = archivo
    ? archivo.name
    : "Ningún logo seleccionado";
});


// ============================================================
// HORARIOS DEL NEGOCIO
// ============================================================

const DIAS_HORARIO = [
  ["lunes", "Lunes"],
  ["martes", "Martes"],
  ["miercoles", "Miércoles"],
  ["jueves", "Jueves"],
  ["viernes", "Viernes"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"]
];

function crearHorariosPredeterminados() {
  const horarios = {};

  DIAS_HORARIO.forEach(([clave]) => {
    horarios[clave] = {
      modo: clave === "domingo" ? "cerrado" : "abierto",
      turnos: clave === "domingo"
        ? []
        : [{ inicio: "08:00", fin: "17:00" }]
    };
  });

  return horarios;
}

function normalizarHorarioDia(dia) {
  if (!dia || typeof dia !== "object") {
    return { modo: "cerrado", turnos: [] };
  }

  const modo = ["abierto", "cerrado", "24h"].includes(dia.modo)
    ? dia.modo
    : "cerrado";

  const turnos = Array.isArray(dia.turnos)
    ? dia.turnos.slice(0, 2).map((turno) => ({
        inicio: turno?.inicio || "",
        fin: turno?.fin || ""
      }))
    : [];

  return { modo, turnos };
}

function renderizarHorarios(horarios = crearHorariosPredeterminados()) {
  const contenedor = document.getElementById("horarios-semana");
  if (!contenedor) return;

  contenedor.innerHTML = DIAS_HORARIO.map(([clave, nombre]) => {
    const dia = normalizarHorarioDia(horarios[clave]);
    const turno1 = dia.turnos[0] || { inicio: "08:00", fin: "17:00" };
    const turno2 = dia.turnos[1] || { inicio: "", fin: "" };
    const usaTurno2 = Boolean(turno2.inicio || turno2.fin);

    return `
      <div class="horario-dia modo-${dia.modo}" data-dia="${clave}">
        <div class="horario-dia-cabecera">
          <strong>${nombre}</strong>

          <select class="horario-modo" aria-label="Estado de ${nombre}">
            <option value="abierto" ${dia.modo === "abierto" ? "selected" : ""}>Abierto</option>
            <option value="cerrado" ${dia.modo === "cerrado" ? "selected" : ""}>Cerrado</option>
            <option value="24h" ${dia.modo === "24h" ? "selected" : ""}>Abierto 24 horas</option>
          </select>
        </div>

        <div class="horario-turnos">
          <div class="horario-turno horario-turno-1">
            <span>Turno 1</span>
            <input type="time" class="turno-1-inicio" value="${turno1.inicio}">
            <span class="separador-hora">→</span>
            <input type="time" class="turno-1-fin" value="${turno1.fin}">
          </div>

          <label class="turno-extra-control">
            <input type="checkbox" class="usar-turno-2" ${usaTurno2 ? "checked" : ""}>
            Agregar segundo turno
          </label>

          <div class="horario-turno horario-turno-2 ${usaTurno2 ? "" : "oculto"}">
            <span>Turno 2</span>
            <input type="time" class="turno-2-inicio" value="${turno2.inicio}">
            <span class="separador-hora">→</span>
            <input type="time" class="turno-2-fin" value="${turno2.fin}">
          </div>
        </div>
      </div>
    `;
  }).join("");

  conectarEventosHorarios();
}

function conectarEventosHorarios() {
  document.querySelectorAll(".horario-dia").forEach((fila) => {
    const modo = fila.querySelector(".horario-modo");
    const usarTurno2 = fila.querySelector(".usar-turno-2");
    const turno2 = fila.querySelector(".horario-turno-2");

    modo?.addEventListener("change", function () {
      fila.classList.remove("modo-abierto", "modo-cerrado", "modo-24h");
      fila.classList.add(`modo-${this.value}`);
    });

    usarTurno2?.addEventListener("change", function () {
      turno2?.classList.toggle("oculto", !this.checked);
    });
  });
}

function obtenerHorariosDelFormulario() {
  const horarios = {};

  document.querySelectorAll(".horario-dia").forEach((fila) => {
    const clave = fila.dataset.dia;
    const modo = fila.querySelector(".horario-modo")?.value || "cerrado";
    const turnos = [];

    if (modo === "abierto") {
      const inicio1 = fila.querySelector(".turno-1-inicio")?.value || "";
      const fin1 = fila.querySelector(".turno-1-fin")?.value || "";

      if (!inicio1 || !fin1) {
        throw new Error(`Completa el primer turno de ${clave}.`);
      }

      turnos.push({ inicio: inicio1, fin: fin1 });

      const usarTurno2 = fila.querySelector(".usar-turno-2")?.checked;

      if (usarTurno2) {
        const inicio2 = fila.querySelector(".turno-2-inicio")?.value || "";
        const fin2 = fila.querySelector(".turno-2-fin")?.value || "";

        if (!inicio2 || !fin2) {
          throw new Error(`Completa el segundo turno de ${clave}.`);
        }

        turnos.push({ inicio: inicio2, fin: fin2 });
      }
    }

    horarios[clave] = { modo, turnos };
  });

  return horarios;
}

function copiarHorarioLunes(destinos) {
  const lunes = document.querySelector('.horario-dia[data-dia="lunes"]');
  if (!lunes) return;

  const modo = lunes.querySelector(".horario-modo")?.value || "cerrado";
  const usarTurno2 = lunes.querySelector(".usar-turno-2")?.checked || false;
  const datos = {
    modo,
    t1i: lunes.querySelector(".turno-1-inicio")?.value || "",
    t1f: lunes.querySelector(".turno-1-fin")?.value || "",
    t2i: lunes.querySelector(".turno-2-inicio")?.value || "",
    t2f: lunes.querySelector(".turno-2-fin")?.value || "",
    usarTurno2
  };

  destinos.forEach((clave) => {
    const fila = document.querySelector(`.horario-dia[data-dia="${clave}"]`);
    if (!fila) return;

    fila.querySelector(".horario-modo").value = datos.modo;
    fila.classList.remove("modo-abierto", "modo-cerrado", "modo-24h");
    fila.classList.add(`modo-${datos.modo}`);

    fila.querySelector(".turno-1-inicio").value = datos.t1i;
    fila.querySelector(".turno-1-fin").value = datos.t1f;
    fila.querySelector(".usar-turno-2").checked = datos.usarTurno2;
    fila.querySelector(".turno-2-inicio").value = datos.t2i;
    fila.querySelector(".turno-2-fin").value = datos.t2f;
    fila.querySelector(".horario-turno-2").classList.toggle("oculto", !datos.usarTurno2);
  });
}

document.getElementById("copiar-lunes-semana")?.addEventListener("click", function () {
  copiarHorarioLunes(["martes", "miercoles", "jueves", "viernes", "sabado"]);
});

document.getElementById("copiar-lunes-todos")?.addEventListener("click", function () {
  copiarHorarioLunes(["martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]);
});

renderizarHorarios();


// ============================================================
// VALIDAR TELÉFONO Y WHATSAPP
// ============================================================

["telefono", "whatsapp"].forEach((id) => {
  const campo = document.getElementById(id);

  campo.addEventListener("input", function () {
    this.value = this.value
      .replace(/\D/g, "")
      .slice(0, 10);
  });
});

// ============================================================
// GUARDAR / ACTUALIZAR NEGOCIO
// ============================================================

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const categoria = document.getElementById("categoria").value;

  if (!nombre || !categoria) {
    alert("Completa el nombre y la categoría del negocio.");
    return;
  }

  const slug = document.getElementById("slug").value.trim();

  const bannerSeleccionado =
    document.getElementById("banner").files[0];

  const logoSeleccionado =
    document.getElementById("logo").files[0];

  const galeriaSeleccionada =
    document.getElementById("galeria").files;


  // ============================================================
  // CONSTRUIR DATOS DEL NEGOCIO
  // ============================================================

  let horariosNegocio;

  try {
    horariosNegocio = obtenerHorariosDelFormulario();
  } catch (error) {
    alert(error.message);
    return;
  }

  const negocio = {
    id: Date.now(),
    nombre,
    slug,
    slogan: document.getElementById("slogan").value.trim(),
    categoria,
    descripcion: document.getElementById("descripcion").value.trim(),

    servicios: document
      .getElementById("servicios")
      .value
      .split("\n")
      .map((servicio) => servicio.trim())
      .filter((servicio) => servicio !== ""),

    palabrasClave: document
      .getElementById("palabras-clave")
      .value
      .split(/[,\n]/)
      .map((palabra) => palabra.trim())
      .filter((palabra) => palabra !== ""),

    plan: document.getElementById("plan-negocio").value || "normal",

    telefono: document.getElementById("telefono").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    horarios: horariosNegocio,
    maps: document.getElementById("maps").value.trim(),
    video: document.getElementById("video").value.trim(),
    facebook: document.getElementById("facebook").value.trim(),
    instagram: document.getElementById("instagram").value.trim(),
    tiktok: document.getElementById("tiktok").value.trim(),
    sitioWeb: document.getElementById("sitioWeb").value.trim(),

    banner: bannerSeleccionado
      ? `imagenes/${slug}/banner.webp`
      : (formulario.dataset.bannerActual || ""),

    logo: logoSeleccionado
      ? `imagenes/${slug}/logo.webp`
      : (formulario.dataset.logoActual || ""),

    galeria: galeriaSeleccionada.length > 0
      ? Array.from(galeriaSeleccionada).map(
          (archivo, index) => `imagenes/${slug}/foto-${index + 1}.webp`
        )
      : (() => {
          try {
            return JSON.parse(formulario.dataset.galeriaActual || "[]");
          } catch (error) {
            return [];
          }
        })(),

    delivery: document.getElementById("delivery").checked,
    tipoDelivery: document.getElementById("delivery").checked
      ? document.getElementById("tipo-delivery").value
      : "",
    verificado: document.getElementById("verificado").checked,
    activo: document.getElementById("activo").checked,
    fechaRegistro: new Date().toLocaleString()
  };


  // ============================================================
  // LEER NEGOCIOS GUARDADOS
  // ============================================================

  const negociosGuardados =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const idEditando = Number(formulario.dataset.editandoId);


  // ============================================================
  // ACTUALIZAR NEGOCIO EXISTENTE O CREAR UNO NUEVO
  // ============================================================

  if (idEditando) {
    const indice = negociosGuardados.findIndex(
      (item) => item.id === idEditando
    );

    if (indice !== -1) {
      negocio.id = idEditando;
      negocio.fechaRegistro =
        negociosGuardados[indice].fechaRegistro || negocio.fechaRegistro;

      negociosGuardados[indice] = negocio;
    }

    delete formulario.dataset.editandoId;

    document.querySelector('button[type="submit"]').textContent =
      "Guardar negocio";

    alert(`✅ ${nombre} fue actualizado correctamente`);
  } else {
    negociosGuardados.push(negocio);

    alert(`✅ ${nombre} fue guardado correctamente`);
  }


  // ============================================================
  // GUARDAR EN LOCALSTORAGE
  // ============================================================

  localStorage.setItem(
    "exhibicionNegocios",
    JSON.stringify(negociosGuardados)
  );

  mostrarNegociosPanel();

  console.log("Negocio guardado:", negocio);

  formulario.reset();
  delete formulario.dataset.bannerActual;
  delete formulario.dataset.logoActual;
  delete formulario.dataset.galeriaActual;

  const planNegocio = document.getElementById("plan-negocio");
  if (planNegocio) planNegocio.value = "normal";

  actualizarControlDelivery();
  renderizarHorarios();
});


// ============================================================
// MOSTRAR NEGOCIOS EN EL PANEL
// ============================================================

function mostrarNegociosPanel() {
  const lista = document.getElementById("lista-panel-negocios");
  const total = document.getElementById("total-negocios");

  if (!lista || !total) return;

  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];
    const textoBusqueda =
  document.getElementById("buscar-negocio")?.value.toLowerCase().trim() || "";

const categoriaFiltro =
  document.getElementById("filtro-categoria")?.value || "";

const estadoFiltro =
  document.getElementById("filtro-estado")?.value || "";

const negociosFiltrados = negocios.filter((negocio) => {
  const coincideTexto =
    negocio.nombre.toLowerCase().includes(textoBusqueda);

  const coincideCategoria =
    !categoriaFiltro || negocio.categoria === categoriaFiltro;

  const estaActivo = negocio.activo !== false;

  const coincideEstado =
    !estadoFiltro ||
    (estadoFiltro === "activo" && estaActivo) ||
    (estadoFiltro === "inactivo" && !estaActivo);

  return coincideTexto && coincideCategoria && coincideEstado;
});

  total.textContent =
    negocios.length === 1
      ? "1 negocio"
      : `${negocios.length} negocios`;

  if (negocios.length === 0) {
    lista.innerHTML = "<p>Todavía no hay negocios guardados.</p>";
    return;
  }

  lista.innerHTML = negociosFiltrados.map((negocio) => `
    <article class="negocio-panel">

      <div>
        <h3>${negocio.nombre}</h3>
        <p>${negocio.categoria}</p>

        <small>
  ${negocio.delivery ? "🛵 Con delivery" : "🏪 Sin delivery"}
  ·
  ${negocio.verificado ? "✅ Verificado" : "⚪ No verificado"}
  ·
  ${negocio.plan === "premium"
    ? "📣 Premium / Patrocinado"
    : negocio.plan === "destacado"
      ? "⭐ Destacado / Promocionado"
      : "⚪ Plan normal"}
  ·
  ${negocio.activo !== false ? "🟢 Activo" : "🔴 Inactivo"}
</small>
      </div>

      <div class="acciones-negocio">
<button
  type="button"
  class="btn-ver"
  onclick="verNegocio('${negocio.slug}')"
>
  👁 Ver
</button>-
  <button
    type="button"
    class="btn-estado"
    onclick="cambiarEstadoNegocio(${negocio.id})"
  >
    ${negocio.activo !== false ? "🟢 Activo" : "🔴 Inactivo"}
  </button>

  <button
    type="button"
    class="btn-editar"
    onclick="editarNegocio(${negocio.id})"
  >
    Editar
  </button>

  <button
    type="button"
    class="btn-eliminar"
    onclick="eliminarNegocio(${negocio.id})"
  >
    Eliminar
  </button>

</div>

    </article>
  `).join("");
}

document.getElementById("buscar-negocio")
  ?.addEventListener("input", mostrarNegociosPanel);

document.getElementById("filtro-categoria")
  ?.addEventListener("change", mostrarNegociosPanel);

document.getElementById("filtro-estado")
  ?.addEventListener("change", mostrarNegociosPanel);

  // ============================================================
// CARGAR CATEGORÍAS EN EL FILTRO
// ============================================================

function cargarCategoriasFiltro() {
  const filtro = document.getElementById("filtro-categoria");

  if (!filtro) return;

  const categorias = [
    ["streaming", "Streaming y tecnología"],
    ["construccion", "Construcción y materiales"],
    ["comida", "Comida y restaurantes"],
    ["salud", "Salud y farmacias"],
    ["hoteles", "Hoteles y hospedaje"],
    ["automotriz", "Talleres y refacciones"],
    ["servicios", "Servicios para el hogar"],
    ["belleza", "Belleza y estética"],
    ["mandaditos", "Mandaditos"],
    ["comercios", "Comercios"],
    ["profesionales", "Profesionistas"],
    ["bienesraices", "Casas y terrenos"],
    ["veterinarias", "Veterinarias"],
    ["agua", "Purificadoras de agua"]
  ];

  categorias.forEach(([valor, nombre]) => {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = nombre;
    filtro.appendChild(opcion);
  });
}

// ============================================================
// ELIMINAR NEGOCIO
// ============================================================

function eliminarNegocio(id) {
  const confirmar = confirm(
    "¿Seguro que deseas eliminar este negocio?"
  );

  if (!confirmar) return;

  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const negociosActualizados =
    negocios.filter((negocio) => negocio.id !== id);

  localStorage.setItem(
    "exhibicionNegocios",
    JSON.stringify(negociosActualizados)
  );

  mostrarNegociosPanel();
}

// ============================================================
// CAMBIAR ESTADO ACTIVO / INACTIVO
// ============================================================

function cambiarEstadoNegocio(id) {
  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const negocio = negocios.find((item) => item.id === id);

  if (!negocio) return;

  negocio.activo = negocio.activo === false;

  localStorage.setItem(
    "exhibicionNegocios",
    JSON.stringify(negocios)
  );

  mostrarNegociosPanel();
}

// ============================================================
// VER NEGOCIO EN LA PÁGINA PÚBLICA
// ============================================================

function verNegocio(slug) {
  if (!slug) {
    alert("Este negocio todavía no tiene nombre de carpeta.");
    return;
  }

  window.open(
    `index.html?negocio=${encodeURIComponent(slug)}`,
    "_blank"
  );
}


// ============================================================
// EDITAR NEGOCIO
// ============================================================

function editarNegocio(id) {
  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

    

  const negocio = negocios.find((item) => item.id === id);

  if (!negocio) {
    alert("No se encontró el negocio.");
    return;
  }

  abrirSeccionPanel("nuevo-negocio");

  document.getElementById("nombre").value = negocio.nombre || "";
  document.getElementById("slug").value = negocio.slug || "";
  document.getElementById("slogan").value = negocio.slogan || "";
  document.getElementById("categoria").value = negocio.categoria || "";
  document.getElementById("descripcion").value = negocio.descripcion || "";

  document.getElementById("servicios").value =
    negocio.servicios?.join("\n") || "";

  document.getElementById("palabras-clave").value =
    Array.isArray(negocio.palabrasClave)
      ? negocio.palabrasClave.join(", ")
      : (negocio.palabrasClave || "");

  document.getElementById("plan-negocio").value =
    ["normal", "destacado", "premium"].includes(negocio.plan)
      ? negocio.plan
      : "normal";

  document.getElementById("telefono").value = negocio.telefono || "";
  document.getElementById("whatsapp").value = negocio.whatsapp || "";
  document.getElementById("direccion").value = negocio.direccion || "";
  renderizarHorarios(
    negocio.horarios && typeof negocio.horarios === "object"
      ? negocio.horarios
      : crearHorariosPredeterminados()
  );
  document.getElementById("maps").value = negocio.maps || "";
  document.getElementById("video").value = negocio.video || "";
  document.getElementById("facebook").value = negocio.facebook || "";
  document.getElementById("instagram").value = negocio.instagram || "";
  document.getElementById("tiktok").value = negocio.tiktok || "";
  document.getElementById("sitioWeb").value = negocio.sitioWeb || "";

  document.getElementById("delivery").checked =
    negocio.delivery === true;

  document.getElementById("tipo-delivery").value =
    negocio.tipoDelivery === "gratis" ? "gratis" : "mandaditos";

  actualizarControlDelivery();

  document.getElementById("verificado").checked =
    negocio.verificado === true;

  document.getElementById("activo").checked =
    negocio.activo !== false;

  formulario.dataset.editandoId = id;

  formulario.dataset.bannerActual = negocio.banner || "";
  formulario.dataset.logoActual = negocio.logo || "";
  formulario.dataset.galeriaActual =
    JSON.stringify(negocio.galeria || []);

  document.querySelector('button[type="submit"]').textContent =
    "Actualizar negocio";

  setTimeout(() => {
    document.getElementById("form-negocio")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 80);
}


// ============================================================
// EXPORTAR / PUBLICAR NEGOCIOS
// ============================================================

function exportarNegociosJSON() {
  const negociosGuardados =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const contenido = JSON.stringify(negociosGuardados, null, 2);
  const archivo = new Blob([contenido], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "negocios.json";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);

  const estado = document.getElementById("estado-publicacion");
  if (estado) {
    estado.textContent =
      `✅ negocios.json generado con ${negociosGuardados.length} negocio${negociosGuardados.length === 1 ? "" : "s"}. Reemplázalo en la carpeta principal del proyecto y publícalo.`;
  }
}

document.getElementById("exportar-negocios-json")
  ?.addEventListener("click", exportarNegociosJSON);


// ============================================================
// INICIALIZAR PANEL
// ============================================================

actualizarControlDelivery();
cargarCategoriasFiltro();
mostrarNegociosPanel();

// ============================================================
// NAVEGACIÓN DEL PANEL
// ============================================================

const TITULOS_SECCIONES_PANEL = {
  dashboard: "Dashboard",
  "nuevo-negocio": "Agregar nuevo negocio",
  negocios: "Negocios",
  categorias: "Categorías",
  destacados: "Destacados / Promociones",
  principal: "Anuncio principal",
  configuracion: "Configuración"
};

function abrirSeccionPanel(seccion) {
  document.querySelectorAll(".seccion-panel").forEach((elemento) => {
    elemento.classList.toggle("activa", elemento.dataset.panelSeccion === seccion);
  });

  document.querySelectorAll(".menu-item").forEach((boton) => {
    boton.classList.toggle("activo", boton.dataset.seccion === seccion);
  });

  const titulo = document.getElementById("titulo-seccion-panel");
  if (titulo) {
    titulo.textContent = TITULOS_SECCIONES_PANEL[seccion] || "Panel";
  }

  if (seccion === "dashboard") actualizarDashboard();
  if (seccion === "categorias") renderizarResumenCategorias();
  if (seccion === "destacados") {
    cargarNegociosEnDestacados();
    mostrarDestacadosPanel();
  }
  if (seccion === "principal") {
    mostrarPrincipalPanel();
    actualizarPreviewPrincipal();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".menu-item[data-seccion]").forEach((boton) => {
  boton.addEventListener("click", function () {
    abrirSeccionPanel(this.dataset.seccion);
  });
});


// ============================================================
// DASHBOARD
// ============================================================

function actualizarDashboard() {
  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const destacados =
    JSON.parse(localStorage.getItem("exhibicionDestacados")) || [];

  const activos = negocios.filter((negocio) => negocio.activo !== false).length;
  const destacadosActivos = destacados.filter((item) => item.activo !== false).length;

  const total = document.getElementById("dashboard-total-negocios");
  const activosElemento = document.getElementById("dashboard-negocios-activos");
  const destacadosElemento = document.getElementById("dashboard-total-destacados");

  if (total) total.textContent = negocios.length;
  if (activosElemento) activosElemento.textContent = activos;
  if (destacadosElemento) destacadosElemento.textContent = destacadosActivos;
}


// ============================================================
// RESUMEN DE CATEGORÍAS
// ============================================================

function renderizarResumenCategorias() {
  const contenedor = document.getElementById("resumen-categorias");
  if (!contenedor) return;

  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const categorias = [
    ["streaming", "Streaming y tecnología"],
    ["construccion", "Construcción y materiales"],
    ["comida", "Comida y restaurantes"],
    ["salud", "Salud y farmacias"],
    ["hoteles", "Hoteles y hospedaje"],
    ["automotriz", "Talleres y refacciones"],
    ["servicios", "Servicios para el hogar"],
    ["belleza", "Belleza y estética"],
    ["mandaditos", "Mandaditos"],
    ["comercios", "Comercios"],
    ["profesionales", "Profesionistas"],
    ["bienesraices", "Casas y terrenos"],
    ["veterinarias", "Veterinarias"],
    ["agua", "Purificadoras de agua"]
  ];

  contenedor.innerHTML = categorias.map(([valor, nombre]) => {
    const cantidad = negocios.filter((negocio) => negocio.categoria === valor).length;

    return `
      <article class="categoria-resumen-card">
        <strong>${nombre}</strong>
        <span>${cantidad}</span>
      </article>
    `;
  }).join("");
}


// ============================================================
// DESTACADOS / PROMOCIONES
// ============================================================

const formularioDestacado = document.getElementById("form-destacado");

function obtenerDestacadosGuardados() {
  try {
    return JSON.parse(localStorage.getItem("exhibicionDestacados")) || [];
  } catch (error) {
    return [];
  }
}

function cargarNegociosEnDestacados() {
  const selector = document.getElementById("destacado-negocio");
  if (!selector) return;

  const valorActual = selector.value;
  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  selector.innerHTML = `
    <option value="">Selecciona un negocio</option>
    ${negocios
      .filter((negocio) => negocio.activo !== false)
      .map((negocio) => `
        <option value="${negocio.slug}">${negocio.nombre}</option>
      `)
      .join("")}
  `;

  if ([...selector.options].some((opcion) => opcion.value === valorActual)) {
    selector.value = valorActual;
  }

  actualizarPreviewPromocion();
}

function valorPromocion(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function obtenerNombreNegocioPromocion() {
  const selector = document.getElementById("destacado-negocio");
  const opcion = selector?.options[selector.selectedIndex];
  return opcion?.textContent?.trim() || "Selecciona un negocio";
}

function obtenerSlugPromocionSeleccionado() {
  return document.getElementById("destacado-negocio")?.value || "";
}

function obtenerRutaImagenPromocion() {
  const input = document.getElementById("destacado-imagen-archivo");
  const archivo = input?.files?.[0];

  if (archivo) {
    const slug = obtenerSlugPromocionSeleccionado();
    if (!slug) return "";

    return `imagenes/${slug}/${archivo.name}`;
  }

  return formularioDestacado?.dataset.imagenActual || "";
}

function actualizarSelectorImagenPromocion() {
  const input = document.getElementById("destacado-imagen-archivo");
  const archivo = input?.files?.[0];
  const ruta = document.getElementById("destacado-imagen-ruta");
  const preview = document.getElementById("preview-promocion-imagen");
  const sinImagen = document.getElementById("preview-promocion-sin-imagen");

  if (!ruta || !preview || !sinImagen) return;

  const slug = obtenerSlugPromocionSeleccionado();

  if (archivo) {
    const extensionValida = /\.(png|webp)$/i.test(archivo.name);

    if (!extensionValida) {
      alert("La imagen de promoción debe ser PNG o WebP.");
      input.value = "";
      preview.removeAttribute("src");
      preview.classList.remove("visible");
      sinImagen.style.display = "inline";
      ruta.textContent = "Sin imagen seleccionada";
      return;
    }

    ruta.textContent = slug
      ? `imagenes/${slug}/${archivo.name}`
      : "Primero selecciona un negocio";

    preview.src = URL.createObjectURL(archivo);
    preview.classList.add("visible");
    sinImagen.style.display = "none";
    return;
  }

  const imagenActual = formularioDestacado?.dataset.imagenActual || "";

  if (imagenActual) {
    ruta.textContent = imagenActual;
    preview.src = imagenActual;
    preview.classList.add("visible");
    sinImagen.style.display = "none";
  } else {
    ruta.textContent = "Sin imagen seleccionada";
    preview.removeAttribute("src");
    preview.classList.remove("visible");
    sinImagen.style.display = "inline";
  }
}


function limpiarNumeroPromocion(valor) {
  if (!valor) return "";

  const limpio = String(valor)
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, "");

  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

function formatearPrecioPromocion(valor) {
  if (!valor) return "";

  const numero = limpiarNumeroPromocion(valor);
  if (numero === null) return String(valor).trim();

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numero);
}

function formatearDescuentoPromocion(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();

  if (/^\d+(?:[.,]\d+)?$/.test(texto)) {
    return `${texto.replace(",", ".")}% OFF`;
  }

  if (/^\d+(?:[.,]\d+)?\s*%$/i.test(texto)) {
    return `${texto.replace(/\s+/g, "")} OFF`;
  }

  return texto.toUpperCase();
}

function aplicarFormatoCampoPromocion(id, tipo) {
  const campo = document.getElementById(id);
  if (!campo) return;

  const aplicar = () => {
    const valor = campo.value.trim();

    campo.value = tipo === "precio"
      ? formatearPrecioPromocion(valor)
      : formatearDescuentoPromocion(valor);

    actualizarPreviewPromocion();
  };

  campo.addEventListener("blur", aplicar);
  campo.addEventListener("change", aplicar);
}

function obtenerPrecioRespaldoPromocion() {
  const precioManual = formatearPrecioPromocion(
    valorPromocion("destacado-precio")
  );
  if (precioManual) return precioManual;

  const precioActual = formatearPrecioPromocion(
    valorPromocion("destacado-precio-actual")
  );
  const descuento = formatearDescuentoPromocion(
    valorPromocion("destacado-descuento")
  );

  if (precioActual && descuento) return `${precioActual} · ${descuento}`;
  if (precioActual) return precioActual;
  if (descuento) return descuento;

  return "";
}

function actualizarPreviewPromocion() {
  const card = document.getElementById("preview-promocion-card");
  if (!card) return;

  const etiqueta = valorPromocion("destacado-etiqueta") || "PROMOCIÓN";
  const titulo = valorPromocion("destacado-titulo") || "Título de la promoción";
  const texto = valorPromocion("destacado-texto") || "Descripción breve de la promoción.";
  const precioAnterior = valorPromocion("destacado-precio-anterior");
  const precioActual = valorPromocion("destacado-precio-actual");
  const descuento = valorPromocion("destacado-descuento");
  const estilo = document.getElementById("destacado-estilo")?.value || "azul-verde";

  document.getElementById("preview-promocion-etiqueta").textContent = etiqueta;
  document.getElementById("preview-promocion-titulo").textContent = titulo;
  document.getElementById("preview-promocion-texto").textContent = texto;
  document.getElementById("preview-promocion-negocio").textContent =
    obtenerNombreNegocioPromocion();

  const anterior = document.getElementById("preview-promocion-precio-anterior");
  const actual = document.getElementById("preview-promocion-precio-actual");
  const desc = document.getElementById("preview-promocion-descuento");

  anterior.textContent = precioAnterior;
  anterior.style.display = precioAnterior ? "inline" : "none";

  actual.textContent = precioActual;
  actual.style.display = precioActual ? "inline" : "none";

  desc.textContent = descuento;
  desc.style.display = descuento ? "inline" : "none";

  card.classList.remove(
    "estilo-azul-verde",
    "estilo-dorado",
    "estilo-verde",
    "estilo-morado"
  );
  card.classList.add(`estilo-${estilo}`);

  card.querySelector(".preview-promocion-producto")?.remove();

  const inputImagen = document.getElementById("destacado-imagen-archivo");
  const archivoImagen = inputImagen?.files?.[0];
  const imagenActual = formularioDestacado?.dataset.imagenActual || "";

  if (archivoImagen || imagenActual) {
    const img = document.createElement("img");
    img.className = "preview-promocion-producto";
    img.alt = "Imagen de la promoción";
    img.src = archivoImagen ? URL.createObjectURL(archivoImagen) : imagenActual;
    card.appendChild(img);
  }
}

[
  "destacado-negocio",
  "destacado-etiqueta",
  "destacado-titulo",
  "destacado-texto",
  "destacado-precio-anterior",
  "destacado-precio-actual",
  "destacado-descuento",
  "destacado-precio",
  "destacado-estilo",
  "destacado-inicio",
  "destacado-fin"
].forEach((id) => {
  const campo = document.getElementById(id);
  campo?.addEventListener("input", actualizarPreviewPromocion);
  campo?.addEventListener("change", actualizarPreviewPromocion);
});

aplicarFormatoCampoPromocion("destacado-precio-anterior", "precio");
aplicarFormatoCampoPromocion("destacado-precio-actual", "precio");
aplicarFormatoCampoPromocion("destacado-precio", "precio");
aplicarFormatoCampoPromocion("destacado-descuento", "descuento");

document.getElementById("destacado-imagen-archivo")
  ?.addEventListener("change", function () {
    actualizarSelectorImagenPromocion();
    actualizarPreviewPromocion();
  });

document.getElementById("destacado-negocio")
  ?.addEventListener("change", function () {
    actualizarSelectorImagenPromocion();
    actualizarPreviewPromocion();
  });

function limpiarFormularioPromocion() {
  if (!formularioDestacado) return;

  formularioDestacado.reset();
  delete formularioDestacado.dataset.editandoId;

  const activo = document.getElementById("destacado-activo");
  if (activo) activo.checked = true;

  const estilo = document.getElementById("destacado-estilo");
  if (estilo) estilo.value = "azul-verde";

  const botonGuardar = document.getElementById("guardar-promocion");
  if (botonGuardar) botonGuardar.textContent = "Guardar promoción";

  const botonCancelar = document.getElementById("cancelar-edicion-promocion");
  botonCancelar?.classList.add("oculto");

  const estado = document.getElementById("estado-promocion-form");
  if (estado) estado.textContent = "Nueva";

  delete formularioDestacado.dataset.imagenActual;
  actualizarSelectorImagenPromocion();
  actualizarPreviewPromocion();
}

formularioDestacado?.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const slug = document.getElementById("destacado-negocio").value;
  const titulo = valorPromocion("destacado-titulo");

  if (!slug || !titulo) {
    alert("Selecciona un negocio y escribe el título de la promoción.");
    return;
  }

  const fechaInicio = document.getElementById("destacado-inicio").value;
  const fechaFin = document.getElementById("destacado-fin").value;

  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    alert("La fecha de término no puede ser anterior a la fecha de inicio.");
    return;
  }

  const negocios =
    JSON.parse(localStorage.getItem("exhibicionNegocios")) || [];

  const negocio = negocios.find((item) => item.slug === slug);

  if (!negocio) {
    alert("No se encontró el negocio seleccionado.");
    return;
  }

  const promociones = obtenerDestacadosGuardados();
  const idEditando = Number(formularioDestacado.dataset.editandoId);

  const promocion = {
    id: idEditando || Date.now(),
    negocioSlug: negocio.slug,
    negocioNombre: negocio.nombre,
    categoria: negocio.categoria,

    etiqueta: valorPromocion("destacado-etiqueta"),
    titulo,
    texto: valorPromocion("destacado-texto"),

    // Compatibilidad con la web pública actual:
    precio: obtenerPrecioRespaldoPromocion(),

    // Datos nuevos para el diseño profesional:
    precioAnterior: formatearPrecioPromocion(
      valorPromocion("destacado-precio-anterior")
    ),
    precioActual: formatearPrecioPromocion(
      valorPromocion("destacado-precio-actual")
    ),
    descuento: formatearDescuentoPromocion(
      valorPromocion("destacado-descuento")
    ),
    imagen: obtenerRutaImagenPromocion(),
    estilo: document.getElementById("destacado-estilo")?.value || "azul-verde",

    fechaInicio,
    fechaFin,
    activo: document.getElementById("destacado-activo").checked
  };

  if (idEditando) {
    const indice = promociones.findIndex((item) => item.id === idEditando);

    if (indice !== -1) {
      promociones[indice] = promocion;
    }

    alert("✅ Promoción actualizada correctamente");
  } else {
    promociones.push(promocion);
    alert("✅ Promoción guardada correctamente");
  }

  localStorage.setItem(
    "exhibicionDestacados",
    JSON.stringify(promociones)
  );

  limpiarFormularioPromocion();
  mostrarDestacadosPanel();
  actualizarDashboard();
});

document.getElementById("cancelar-edicion-promocion")
  ?.addEventListener("click", limpiarFormularioPromocion);

function mostrarDestacadosPanel() {
  const lista = document.getElementById("lista-destacados");
  const total = document.getElementById("total-destacados");

  if (!lista || !total) return;

  const promociones = obtenerDestacadosGuardados();

  total.textContent =
    promociones.length === 1
      ? "1 promoción"
      : `${promociones.length} promociones`;

  if (promociones.length === 0) {
    lista.innerHTML = "<p>Todavía no hay promociones guardadas.</p>";
    return;
  }

  lista.innerHTML = promociones.map((item) => {
    const precioAnterior = item.precioAnterior || "";
    const precioActual = item.precioActual || "";
    const descuento = item.descuento || "";
    const precioRespaldo = item.precio || "";

    return `
      <article class="promocion-panel">
        <div>
          <small>${item.etiqueta || "⭐ Destacado"}</small>
          <h3>${item.negocioNombre}</h3>
          <strong>${item.titulo}</strong>

          ${item.texto ? `<p>${item.texto}</p>` : ""}

          ${(precioAnterior || precioActual || descuento || precioRespaldo) ? `
            <div class="promocion-precios-listado">
              ${precioAnterior ? `<del>${precioAnterior}</del>` : ""}
              ${precioActual ? `<span>${precioActual}</span>` : ""}
              ${descuento ? `<span class="promocion-descuento-listado">${descuento}</span>` : ""}
              ${(!precioActual && !descuento && precioRespaldo) ? `<span>${precioRespaldo}</span>` : ""}
            </div>
          ` : ""}

          <em>
            ${item.activo !== false ? "🟢 Activa" : "🔴 Inactiva"}
            ${item.fechaInicio || item.fechaFin
              ? ` · ${item.fechaInicio || "Sin inicio"} → ${item.fechaFin || "Sin término"}`
              : ""}
          </em>
        </div>

        <div class="acciones-negocio">
          <button type="button" class="btn-editar" onclick="editarDestacado(${item.id})">
            Editar
          </button>

          <button type="button" class="btn-estado" onclick="cambiarEstadoDestacado(${item.id})">
            ${item.activo !== false ? "🟢 Activa" : "🔴 Inactiva"}
          </button>

          <button type="button" class="btn-eliminar" onclick="eliminarDestacado(${item.id})">
            Eliminar
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function editarDestacado(id) {
  const promociones = obtenerDestacadosGuardados();
  const item = promociones.find((promocion) => promocion.id === id);

  if (!item) return;

  abrirSeccionPanel("destacados");
  cargarNegociosEnDestacados();

  document.getElementById("destacado-negocio").value = item.negocioSlug || "";
  document.getElementById("destacado-etiqueta").value = item.etiqueta || "";
  document.getElementById("destacado-titulo").value = item.titulo || "";
  document.getElementById("destacado-texto").value = item.texto || "";

  document.getElementById("destacado-precio-anterior").value =
    item.precioAnterior || "";

  document.getElementById("destacado-precio-actual").value =
    item.precioActual || "";

  document.getElementById("destacado-descuento").value =
    item.descuento || "";

  // Las promociones antiguas siguen pudiendo editarse.
  document.getElementById("destacado-precio").value =
    item.precio || "";

  formularioDestacado.dataset.imagenActual = item.imagen || "";

  const inputImagenPromocion = document.getElementById("destacado-imagen-archivo");
  if (inputImagenPromocion) inputImagenPromocion.value = "";

  actualizarSelectorImagenPromocion();

  document.getElementById("destacado-estilo").value =
    item.estilo || "azul-verde";

  document.getElementById("destacado-inicio").value =
    item.fechaInicio || "";

  document.getElementById("destacado-fin").value =
    item.fechaFin || "";

  document.getElementById("destacado-activo").checked =
    item.activo !== false;

  formularioDestacado.dataset.editandoId = id;

  const botonGuardar = document.getElementById("guardar-promocion");
  if (botonGuardar) botonGuardar.textContent = "Actualizar promoción";

  document.getElementById("cancelar-edicion-promocion")
    ?.classList.remove("oculto");

  const estado = document.getElementById("estado-promocion-form");
  if (estado) estado.textContent = "Editando";

  actualizarPreviewPromocion();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cambiarEstadoDestacado(id) {
  const promociones = obtenerDestacadosGuardados();
  const item = promociones.find((promocion) => promocion.id === id);

  if (!item) return;

  item.activo = item.activo === false;

  localStorage.setItem(
    "exhibicionDestacados",
    JSON.stringify(promociones)
  );

  mostrarDestacadosPanel();
  actualizarDashboard();
}

function eliminarDestacado(id) {
  if (!confirm("¿Seguro que deseas eliminar esta promoción?")) return;

  const promociones = obtenerDestacadosGuardados()
    .filter((item) => item.id !== id);

  localStorage.setItem(
    "exhibicionDestacados",
    JSON.stringify(promociones)
  );

  mostrarDestacadosPanel();
  actualizarDashboard();

  if (Number(formularioDestacado?.dataset.editandoId) === id) {
    limpiarFormularioPromocion();
  }
}

function exportarDestacadosJSON() {
  const promociones = obtenerDestacadosGuardados();
  const contenido = JSON.stringify(promociones, null, 2);

  const archivo = new Blob(
    [contenido],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "destacados.json";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);

  const estado = document.getElementById("estado-publicacion-destacados");

  if (estado) {
    estado.textContent =
      `✅ destacados.json generado con ${promociones.length} promoción${promociones.length === 1 ? "" : "es"}.`;
  }
}

document.getElementById("exportar-destacados-json")
  ?.addEventListener("click", exportarDestacadosJSON);

actualizarSelectorImagenPromocion();
actualizarPreviewPromocion();



// ============================================================
// ANUNCIO PRINCIPAL
// Un solo registro independiente de Destacados / Promociones.
// ============================================================

const formularioPrincipal = document.getElementById("form-principal");

function obtenerPrincipalGuardado() {
  try {
    const datos = JSON.parse(localStorage.getItem("exhibicionPrincipal")) || [];
    return Array.isArray(datos) ? datos : [datos];
  } catch (error) {
    return [];
  }
}

function valorPrincipal(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function obtenerRutaImagenPrincipal() {
  const input = document.getElementById("principal-imagen-archivo");
  const archivo = input?.files?.[0];
  if (archivo) return `imagenes/principal/${archivo.name}`;
  return formularioPrincipal?.dataset.imagenActual || "";
}

function actualizarSelectorImagenPrincipal() {
  const input = document.getElementById("principal-imagen-archivo");
  const archivo = input?.files?.[0];
  const ruta = document.getElementById("principal-imagen-ruta");
  const preview = document.getElementById("preview-principal-imagen");
  const sinImagen = document.getElementById("preview-principal-sin-imagen");
  if (!ruta || !preview || !sinImagen) return;

  if (archivo) {
    if (!/\.(png|webp)$/i.test(archivo.name)) {
      alert("La imagen del anuncio principal debe ser PNG o WebP.");
      input.value = "";
      ruta.textContent = "Sin imagen seleccionada";
      preview.removeAttribute("src");
      preview.classList.remove("visible");
      sinImagen.style.display = "inline";
      return;
    }

    ruta.textContent = `imagenes/principal/${archivo.name}`;
    preview.src = URL.createObjectURL(archivo);
    preview.classList.add("visible");
    sinImagen.style.display = "none";
    return;
  }

  const imagenActual = formularioPrincipal?.dataset.imagenActual || "";
  if (imagenActual) {
    ruta.textContent = imagenActual;
    preview.src = imagenActual;
    preview.classList.add("visible");
    sinImagen.style.display = "none";
  } else {
    ruta.textContent = "Sin imagen seleccionada";
    preview.removeAttribute("src");
    preview.classList.remove("visible");
    sinImagen.style.display = "inline";
  }
}

function actualizarPreviewPrincipal() {
  const card = document.getElementById("preview-principal-card");
  if (!card) return;

  const etiqueta = valorPrincipal("principal-etiqueta") || "ANUNCIO ESPECIAL";
  const titulo = valorPrincipal("principal-titulo") || "Título del anuncio principal";
  const texto = valorPrincipal("principal-texto") || "Descripción breve del anuncio.";
  const boton = valorPrincipal("principal-boton") || "Ver más";

  document.getElementById("preview-principal-etiqueta").textContent = etiqueta;
  document.getElementById("preview-principal-titulo").textContent = titulo;
  document.getElementById("preview-principal-texto").textContent = texto;
  document.getElementById("preview-principal-boton").textContent = boton;

  card.querySelector(".preview-promocion-producto")?.remove();

  const input = document.getElementById("principal-imagen-archivo");
  const archivo = input?.files?.[0];
  const imagenActual = formularioPrincipal?.dataset.imagenActual || "";

  if (archivo || imagenActual) {
    const img = document.createElement("img");
    img.className = "preview-promocion-producto";
    img.alt = "Imagen del anuncio principal";
    img.src = archivo ? URL.createObjectURL(archivo) : imagenActual;
    card.appendChild(img);
  }
}

[
  "principal-etiqueta",
  "principal-titulo",
  "principal-texto",
  "principal-boton",
  "principal-enlace",
  "principal-inicio",
  "principal-fin"
].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", actualizarPreviewPrincipal);
  document.getElementById(id)?.addEventListener("change", actualizarPreviewPrincipal);
});

document.getElementById("principal-imagen-archivo")
  ?.addEventListener("change", function () {
    actualizarSelectorImagenPrincipal();
    actualizarPreviewPrincipal();
  });

function limpiarFormularioPrincipal() {
  if (!formularioPrincipal) return;

  formularioPrincipal.reset();
  delete formularioPrincipal.dataset.editandoId;
  delete formularioPrincipal.dataset.imagenActual;

  const activo = document.getElementById("principal-activo");
  if (activo) activo.checked = true;

  const boton = document.getElementById("guardar-principal");
  if (boton) boton.textContent = "Guardar anuncio principal";

  document.getElementById("cancelar-edicion-principal")?.classList.add("oculto");

  const estado = document.getElementById("estado-principal-form");
  if (estado) estado.textContent = "Nuevo";

  const input = document.getElementById("principal-imagen-archivo");
  if (input) input.value = "";

  actualizarSelectorImagenPrincipal();
  actualizarPreviewPrincipal();
}

formularioPrincipal?.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const titulo = valorPrincipal("principal-titulo");
  if (!titulo) {
    alert("Escribe el título del anuncio principal.");
    return;
  }

  const fechaInicio = document.getElementById("principal-inicio")?.value || "";
  const fechaFin = document.getElementById("principal-fin")?.value || "";

  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    alert("La fecha de término no puede ser anterior a la fecha de inicio.");
    return;
  }

  const idEditando = Number(formularioPrincipal.dataset.editandoId);
  const anuncio = {
    id: idEditando || Date.now(),
    etiqueta: valorPrincipal("principal-etiqueta"),
    titulo,
    texto: valorPrincipal("principal-texto"),
    boton: valorPrincipal("principal-boton") || "Ver más",
    enlace: valorPrincipal("principal-enlace"),
    mensajeWhatsapp: valorPrincipal("principal-mensaje-whatsapp"),
    imagen: obtenerRutaImagenPrincipal(),
    fechaInicio,
    fechaFin,
    activo: document.getElementById("principal-activo")?.checked !== false
  };

  // Este módulo es exclusivo: guardar uno reemplaza al anterior.
  localStorage.setItem("exhibicionPrincipal", JSON.stringify([anuncio]));

  alert(idEditando
    ? "✅ Anuncio principal actualizado correctamente"
    : "✅ Anuncio principal guardado correctamente");

  limpiarFormularioPrincipal();
  mostrarPrincipalPanel();
  actualizarDashboard();
});

document.getElementById("cancelar-edicion-principal")
  ?.addEventListener("click", limpiarFormularioPrincipal);

function mostrarPrincipalPanel() {
  const lista = document.getElementById("lista-principal");
  const total = document.getElementById("total-principal");
  if (!lista || !total) return;

  const anuncios = obtenerPrincipalGuardado();
  const item = anuncios[0];
  total.textContent = item ? "1 anuncio" : "0 anuncios";

  if (!item) {
    lista.innerHTML = "<p>Todavía no hay un anuncio principal guardado.</p>";
    return;
  }

  lista.innerHTML = `
    <article class="promocion-panel">
      <div>
        <small>${item.etiqueta || "📢 Anuncio principal"}</small>
        <h3>${item.titulo}</h3>
        ${item.texto ? `<p>${item.texto}</p>` : ""}
        <em>
          ${item.activo !== false ? "🟢 Activo" : "🔴 Inactivo"}
          ${item.fechaInicio || item.fechaFin
            ? ` · ${item.fechaInicio || "Sin inicio"} → ${item.fechaFin || "Sin término"}`
            : ""}
        </em>
      </div>

      <div class="acciones-negocio">
        <button type="button" class="btn-editar" onclick="editarPrincipal()">Editar</button>
        <button type="button" class="btn-estado" onclick="cambiarEstadoPrincipal()">
          ${item.activo !== false ? "🟢 Activo" : "🔴 Inactivo"}
        </button>
        <button type="button" class="btn-eliminar" onclick="eliminarPrincipal()">Eliminar</button>
      </div>
    </article>
  `;
}

function editarPrincipal() {
  const item = obtenerPrincipalGuardado()[0];
  if (!item) return;

  abrirSeccionPanel("principal");

  document.getElementById("principal-etiqueta").value = item.etiqueta || "";
  document.getElementById("principal-titulo").value = item.titulo || "";
  document.getElementById("principal-texto").value = item.texto || "";
  document.getElementById("principal-boton").value = item.boton || "";
  document.getElementById("principal-enlace").value = item.enlace || "";
  document.getElementById("principal-mensaje-whatsapp").value = item.mensajeWhatsapp || "";
  document.getElementById("principal-inicio").value = item.fechaInicio || "";
  document.getElementById("principal-fin").value = item.fechaFin || "";
  document.getElementById("principal-activo").checked = item.activo !== false;

  formularioPrincipal.dataset.editandoId = item.id;
  formularioPrincipal.dataset.imagenActual = item.imagen || "";

  const input = document.getElementById("principal-imagen-archivo");
  if (input) input.value = "";

  const boton = document.getElementById("guardar-principal");
  if (boton) boton.textContent = "Actualizar anuncio principal";
  document.getElementById("cancelar-edicion-principal")?.classList.remove("oculto");

  const estado = document.getElementById("estado-principal-form");
  if (estado) estado.textContent = "Editando";

  actualizarSelectorImagenPrincipal();
  actualizarPreviewPrincipal();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cambiarEstadoPrincipal() {
  const item = obtenerPrincipalGuardado()[0];
  if (!item) return;
  item.activo = item.activo === false;
  localStorage.setItem("exhibicionPrincipal", JSON.stringify([item]));
  mostrarPrincipalPanel();
  actualizarDashboard();
}

function eliminarPrincipal() {
  if (!confirm("¿Seguro que deseas eliminar el anuncio principal?")) return;
  localStorage.removeItem("exhibicionPrincipal");
  limpiarFormularioPrincipal();
  mostrarPrincipalPanel();
  actualizarDashboard();
}

function exportarPrincipalJSON() {
  const anuncios = obtenerPrincipalGuardado();
  const contenido = JSON.stringify(anuncios, null, 2);
  const archivo = new Blob([contenido], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = "principal.json";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);

  const estado = document.getElementById("estado-publicacion-principal");
  if (estado) {
    estado.textContent = anuncios.length
      ? "✅ principal.json generado con el anuncio principal. Reemplázalo en la carpeta principal y publícalo."
      : "✅ principal.json generado vacío. No se mostrará ningún anuncio principal.";
  }
}

document.getElementById("exportar-principal-json")
  ?.addEventListener("click", exportarPrincipalJSON);

actualizarSelectorImagenPrincipal();
actualizarPreviewPrincipal();
mostrarPrincipalPanel();


// ============================================================
// ACTUALIZAR SECCIONES DESPUÉS DE CAMBIOS DE NEGOCIOS
// ============================================================

const mostrarNegociosPanelOriginal = mostrarNegociosPanel;

mostrarNegociosPanel = function () {
  mostrarNegociosPanelOriginal();
  actualizarDashboard();
  renderizarResumenCategorias();
  cargarNegociosEnDestacados();
};

actualizarDashboard();
renderizarResumenCategorias();
cargarNegociosEnDestacados();
mostrarDestacadosPanel();
mostrarPrincipalPanel();
