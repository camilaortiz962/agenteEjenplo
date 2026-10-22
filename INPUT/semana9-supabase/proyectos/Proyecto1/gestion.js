// Lógica de gestion.html — SEMANA 9: migrado de localStorage a Supabase.
// "heroes" y las funciones CRUD (cargarHeroes, agregarHeroe,
// buscarHeroePorId, buscarHeroesPorNombre, modificarHeroe, eliminarHeroe)
// vienen de data.js, que se carga antes que este archivo.
//
// Lo que cambió respecto a la semana 7:
//   - Ya no hay guardarHeroeEnLocalStorage / eliminarHeroeDeLocalStorage /
//     agregarANombresEliminados: Supabase es la única fuente de verdad.
//   - Los listeners que llaman a la base son "async" y usan "await".
//   - Actualizar y eliminar ubican al héroe por su "id" (lo genera Postgres),
//     no por su nombre.
//   - Después de cada cambio se vuelve a pedir la lista a Supabase
//     (cargarHeroes) en vez de tocar el arreglo a mano.

// Cada botón del sidebar tiene un data-seccion (ej. "crear") que apunta
// al id de la sección que debe mostrar (ej. "seccion-crear").
const sidebarItems = document.querySelectorAll(".sidebar-item");
const secciones = document.querySelectorAll(".seccion");

// Muestra la sección pedida (por su nombre, ej. "mostrar") y oculta las
// demás, marcando también el ítem del sidebar correspondiente como activo.
function mostrarSeccion(nombre) {
  const idDestino = "seccion-" + nombre;

  secciones.forEach(function(seccion) {
    seccion.hidden = seccion.id !== idDestino;
  });

  sidebarItems.forEach(function(item) {
    item.classList.toggle("activo", item.dataset.seccion === nombre);
  });

  // Los usuarios se registran desde otra página (game.html), así que se
  // vuelven a leer cada vez que se abre la pestaña para ver los últimos.
  if (nombre === "usuarios") {
    renderUsuarios();
  }
}

sidebarItems.forEach(function(item) {
  item.addEventListener("click", function() {
    mostrarSeccion(item.dataset.seccion);
  });
});

// --- Sección Mostrar todos: pinta el arreglo "heroes" como tabla y como
// galería de cartas (reutilizando dibujarCartas de cartas.js). ---
const tablaHeroesBody = document.getElementById("tablaHeroesBody");
const galeriaCartas = document.getElementById("galeriaCartas");

// Sincrónica: solo dibuja lo que ya está en "heroes" (no viaja a la red).
function renderMostrarTodos() {
  tablaHeroesBody.innerHTML = "";
  galeriaCartas.innerHTML = "";

  heroes.forEach(function(h) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${h.nombre}</td>
      <td>${h.bando}</td>
      <td>${h.edad}</td>
      <td>${h.altura} m</td>
      <td>${h.universo}</td>
      <td>${h.nivelDeFuerza}</td>
      <td>${h.activo ? "Sí" : "No"}</td>
      <td>${h.poder.join(", ")}</td>
    `;
    tablaHeroesBody.appendChild(fila);
  });

  dibujarCartas(heroes, galeriaCartas);
}

// Vuelve a pedir los datos a Supabase y redibuja todo lo que depende de
// "heroes". Se usa al cargar la página y después de crear/editar/borrar.
async function recargarYRender() {
  await cargarHeroes();
  renderMostrarTodos();
  renderListaEliminar();
}

// "Poder" llega del formulario como texto: "Rap, Baile" → ["Rap", "Baile"]
function textoALista(texto) {
  return texto
    .split(",")
    .map(function(p) { return p.trim(); })
    .filter(function(p) { return p !== ""; });
}

// Lee un archivo de imagen y lo convierte en data URL. Lo envolvemos en una
// Promise para poder usar "await" en vez del callback onload (mismo
// FileReader de la semana 7, solo cambia la forma de esperarlo).
function leerImagenComoDataURL(archivo) {
  return new Promise(function(resolve, reject) {
    const lector = new FileReader();
    lector.onload = function() { resolve(lector.result); };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

// --- Sección Crear ---
const formCrear = document.getElementById("formCrear");
const crearMensaje = document.getElementById("crearMensaje");

formCrear.addEventListener("submit", async function(e) {
  e.preventDefault();

  const archivoImagen = document.getElementById("crearImage").files[0];
  const rutaImagen = archivoImagen ? await leerImagenComoDataURL(archivoImagen) : "";

  // Mismo objeto que en la semana 7, pero SIN id (lo pone Postgres).
  const datos = {
    nombre: document.getElementById("crearNombre").value.trim(),
    poder: textoALista(document.getElementById("crearPoder").value),
    descripcion: document.getElementById("crearDescripcion").value.trim(),
    bando: document.getElementById("crearBando").value.trim(),
    Image: rutaImagen,
    edad: Number(document.getElementById("crearEdad").value),
    altura: Number(document.getElementById("crearAltura").value),
    universo: document.getElementById("crearUniverso").value.trim(),
    nivelDeFuerza: Number(document.getElementById("crearNivelDeFuerza").value),
    activo: document.getElementById("crearActivo").checked,
  };

  crearMensaje.textContent = "Guardando…";
  const nuevo = await agregarHeroe(datos);

  if (!nuevo) {
    crearMensaje.textContent = "No se pudo agregar. Revisa la consola (F12).";
    return;
  }

  crearMensaje.textContent = "Se agregó \"" + nuevo.nombre + "\" con id " + nuevo.id + ".";
  formCrear.reset();
  document.getElementById("crearActivo").checked = true;

  await recargarYRender();
  mostrarSeccion("mostrar");
});

// --- Sección Buscar: por id (buscarHeroePorId) o por nombre
// (buscarHeroesPorNombre). Los resultados se dibujan como cartas. ---
const formBuscarId = document.getElementById("formBuscarId");
const formBuscarNombre = document.getElementById("formBuscarNombre");
const buscarMensaje = document.getElementById("buscarMensaje");
const buscarResultados = document.getElementById("buscarResultados");

formBuscarId.addEventListener("submit", async function(e) {
  e.preventDefault();
  const id = Number(document.getElementById("buscarId").value);

  buscarResultados.innerHTML = "";
  const encontrado = await buscarHeroePorId(id);

  if (!encontrado) {
    buscarMensaje.textContent = "No existe ningún integrante con id " + id + ".";
    return;
  }
  buscarMensaje.textContent = "Id " + id + ": \"" + encontrado.nombre + "\".";
  dibujarCartas([encontrado], buscarResultados);
});

formBuscarNombre.addEventListener("submit", async function(e) {
  e.preventDefault();
  const texto = document.getElementById("buscarNombre").value.trim();

  buscarResultados.innerHTML = "";
  const encontrados = await buscarHeroesPorNombre(texto);

  if (encontrados.length === 0) {
    buscarMensaje.textContent = "Ningún nombre contiene \"" + texto + "\".";
    return;
  }
  buscarMensaje.textContent = encontrados.length + " resultado(s) para \"" + texto + "\".";
  dibujarCartas(encontrados, buscarResultados);
});

// --- Sección Eliminar: lista todos los héroes con un botón cada uno.
// Al apretarlo, pide confirmación y recién ahí lo borra de Supabase. ---
const eliminarMensaje = document.getElementById("eliminarMensaje");
const listaEliminar = document.getElementById("listaEliminar");

// Pinta un <li> por cada héroe, con su nombre y un botón "Eliminar".
function renderListaEliminar() {
  listaEliminar.innerHTML = "";

  heroes.forEach(function(h) {
    const item = document.createElement("li");
    item.className = "item-eliminar";

    const nombreSpan = document.createElement("span");
    nombreSpan.textContent = "#" + h.id + " " + h.nombre;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Eliminar";
    // async: el click espera a que Supabase confirme el borrado
    boton.addEventListener("click", async function() {
      await confirmarYEliminar(h);
    });

    item.appendChild(nombreSpan);
    item.appendChild(boton);
    listaEliminar.appendChild(item);
  });
}

async function confirmarYEliminar(h) {
  const confirmado = confirm("¿Eliminar a \"" + h.nombre + "\"? Esta acción no se puede deshacer.");
  if (!confirmado) {
    return;
  }

  // ANTES: indexOf + splice + localStorage. AHORA: una sola instrucción.
  const seElimino = await eliminarHeroe(h.id);

  if (!seElimino) {
    eliminarMensaje.textContent = "No se pudo eliminar \"" + h.nombre + "\". Revisa la consola.";
    return;
  }

  eliminarMensaje.textContent = "Se eliminó \"" + h.nombre + "\".";
  await recargarYRender();
}

// --- Sección Actualizar: busca un héroe por nombre, precarga sus datos
// en un formulario y, al guardar, actualiza esa fila en Supabase. ---
const formBuscarActualizar = document.getElementById("formBuscarActualizar");
const formActualizar = document.getElementById("formActualizar");
const actualizarMensaje = document.getElementById("actualizarMensaje");

// Id e imagen del héroe que se está editando (el id es lo que usa
// .eq("id", ...) para saber qué fila actualizar).
let idEnEdicion = null;
let imagenActualEnEdicion = "";

formBuscarActualizar.addEventListener("submit", async function(e) {
  e.preventDefault();

  const nombreBuscado = document.getElementById("actualizarNombreBuscar").value.trim();
  const candidatos = await buscarHeroesPorNombre(nombreBuscado);

  // Preferimos coincidencia exacta (sin importar mayúsculas); si no hay,
  // aceptamos el único resultado parcial.
  const encontrado = candidatos.find(function(h) {
    return h.nombre.toLowerCase() === nombreBuscado.toLowerCase();
  }) || (candidatos.length === 1 ? candidatos[0] : null);

  if (!encontrado) {
    actualizarMensaje.textContent = candidatos.length > 1
      ? "Hay varios: " + candidatos.map(function(h) { return h.nombre; }).join(", ") + ". Escribe el nombre completo."
      : "No se encontró ningún integrante llamado \"" + nombreBuscado + "\".";
    formActualizar.hidden = true;
    return;
  }

  idEnEdicion = encontrado.id;
  imagenActualEnEdicion = encontrado.Image;

  document.getElementById("actualizarNombre").value = encontrado.nombre;
  document.getElementById("actualizarPoder").value = encontrado.poder.join(", ");
  document.getElementById("actualizarDescripcion").value = encontrado.descripcion;
  document.getElementById("actualizarBando").value = encontrado.bando;
  document.getElementById("actualizarImage").value = "";
  document.getElementById("actualizarEdad").value = encontrado.edad;
  document.getElementById("actualizarAltura").value = encontrado.altura;
  document.getElementById("actualizarUniverso").value = encontrado.universo;
  document.getElementById("actualizarNivelDeFuerza").value = encontrado.nivelDeFuerza;
  document.getElementById("actualizarActivo").checked = encontrado.activo;

  actualizarMensaje.textContent = "Editando a \"" + encontrado.nombre + "\" (id " + encontrado.id + "). Cambiá lo que necesites y guardá.";
  formActualizar.hidden = false;
});

formActualizar.addEventListener("submit", async function(e) {
  e.preventDefault();

  const archivoImagen = document.getElementById("actualizarImage").files[0];
  const rutaImagen = archivoImagen ? await leerImagenComoDataURL(archivoImagen) : imagenActualEnEdicion;

  const cambios = {
    nombre: document.getElementById("actualizarNombre").value.trim(),
    poder: textoALista(document.getElementById("actualizarPoder").value),
    descripcion: document.getElementById("actualizarDescripcion").value.trim(),
    bando: document.getElementById("actualizarBando").value.trim(),
    Image: rutaImagen,
    edad: Number(document.getElementById("actualizarEdad").value),
    altura: Number(document.getElementById("actualizarAltura").value),
    universo: document.getElementById("actualizarUniverso").value.trim(),
    nivelDeFuerza: Number(document.getElementById("actualizarNivelDeFuerza").value),
    activo: document.getElementById("actualizarActivo").checked,
  };

  // ANTES: findIndex + splice + push + 3 escrituras en localStorage.
  // AHORA: "actualiza estos campos donde el id sea este".
  const actualizado = await modificarHeroe(idEnEdicion, cambios);

  if (!actualizado) {
    actualizarMensaje.textContent = "No se pudo actualizar (puede que lo hayan eliminado).";
    formActualizar.hidden = true;
    return;
  }

  actualizarMensaje.textContent = "Se actualizó \"" + actualizado.nombre + "\".";
  formActualizar.hidden = true;
  formBuscarActualizar.reset();

  await recargarYRender();
  mostrarSeccion("mostrar");
});

// --- Sección Usuarios: sin cambios esta semana. Los usuarios del login
// siguen en localStorage (userStore.js); se migran con Supabase Auth en la
// semana 13.
// OJO: la contraseña se muestra en texto plano solo porque es un ejercicio;
// en un sistema real nunca se guarda ni se muestra así.
const tablaUsuariosBody = document.getElementById("tablaUsuariosBody");
const usuariosMensaje = document.getElementById("usuariosMensaje");

async function renderUsuarios() {
  const usuarios = await loadUsers();

  tablaUsuariosBody.innerHTML = "";

  if (usuarios.length === 0) {
    tablaUsuariosBody.innerHTML = `<tr><td colspan="6">Todavía no hay usuarios registrados.</td></tr>`;
    return;
  }

  usuarios.forEach(function(u) {
    const fila = document.createElement("tr");

    [u.id.slice(0, 8), u.name, u.alias, u.email, u.password, u.games.length].forEach(function(valor) {
      const celda = document.createElement("td");
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    fila.firstChild.title = u.id;

    tablaUsuariosBody.appendChild(fila);
  });
}

// Al abrir la página: traer los datos de Supabase y dibujar.
recargarYRender();
