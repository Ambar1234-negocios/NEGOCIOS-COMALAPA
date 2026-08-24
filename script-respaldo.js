const formulario = document.getElementById("form-negocio");

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const categoria = document.getElementById("categoria").value;

  if (!nombre || !categoria) {
    alert("Completa el nombre y la categoría del negocio.");
    return;
  }

  const negocio = {
    id: Date.now(),
    nombre,
    categoria,
    descripcion: document.getElementById("descripcion").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    horario: document.getElementById("horario").value.trim(),
    maps: document.getElementById("maps").value.trim(),
    video: document.getElementById("video").value.trim(),

    banner: document.getElementById("banner").files[0]?.name || "",
    logo: document.getElementById("logo").files[0]?.name || "",
    galeria: Array.from(
      document.getElementById("galeria").files
    ).map((archivo) => archivo.name),

    delivery: document.getElementById("delivery").checked,
    verificado: document.getElementById("verificado").checked,
    fechaRegistro: new Date().toLocaleString()
  };

  const negociosGuardados =
    JSON.parse(localStorage.getItem("ambarNegocios")) || [];

  negociosGuardados.push(negocio);

  localStorage.setItem(
    "ambarNegocios",
    JSON.stringify(negociosGuardados)
  );

  console.log("Negocio guardado:", negocio);

  alert(`✅ ${nombre} fue guardado correctamente`);

  formulario.reset();
});