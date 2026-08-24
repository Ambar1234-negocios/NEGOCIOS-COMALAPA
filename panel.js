// ============================================================
// ÁMBAR NEGOCIOS COMALAPA
// panel.js - Panel administrativo
// ============================================================


// ============================================================
// REFERENCIA PRINCIPAL DEL FORMULARIO
// ============================================================

const formulario = document.getElementById("form-negocio");

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

    telefono: document.getElementById("telefono").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    horarios: horariosNegocio,
    maps: document.getElementById("maps").value.trim(),
    video: document.getElementById("video").value.trim(),

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
    verificado: document.getElementById("verificado").checked,
    activo: document.getElementById("activo").checked,
    fechaRegistro: new Date().toLocaleString()
  };


  // ============================================================
  // LEER NEGOCIOS GUARDADOS
  // ============================================================

  const negociosGuardados =
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];

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
    "ambarNegocios",
    JSON.stringify(negociosGuardados)
  );

  mostrarNegociosPanel();

  console.log("Negocio guardado:", negocio);

  formulario.reset();
  delete formulario.dataset.bannerActual;
  delete formulario.dataset.logoActual;
  delete formulario.dataset.galeriaActual;
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
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];
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
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];

  const negociosActualizados =
    negocios.filter((negocio) => negocio.id !== id);

  localStorage.setItem(
    "ambarNegocios",
    JSON.stringify(negociosActualizados)
  );

  mostrarNegociosPanel();
}

// ============================================================
// CAMBIAR ESTADO ACTIVO / INACTIVO
// ============================================================

function cambiarEstadoNegocio(id) {
  const negocios =
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];

  const negocio = negocios.find((item) => item.id === id);

  if (!negocio) return;

  negocio.activo = negocio.activo === false;

  localStorage.setItem(
    "ambarNegocios",
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
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];

    

  const negocio = negocios.find((item) => item.id === id);

  if (!negocio) {
    alert("No se encontró el negocio.");
    return;
  }

  document.getElementById("nombre").value = negocio.nombre || "";
  document.getElementById("slug").value = negocio.slug || "";
  document.getElementById("slogan").value = negocio.slogan || "";
  document.getElementById("categoria").value = negocio.categoria || "";
  document.getElementById("descripcion").value = negocio.descripcion || "";

  document.getElementById("servicios").value =
    negocio.servicios?.join("\n") || "";

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

  document.getElementById("delivery").checked =
    negocio.delivery === true;

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

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ============================================================
// EXPORTAR / PUBLICAR NEGOCIOS
// ============================================================

function exportarNegociosJSON() {
  const negociosGuardados =
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];

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

cargarCategoriasFiltro();
mostrarNegociosPanel();
