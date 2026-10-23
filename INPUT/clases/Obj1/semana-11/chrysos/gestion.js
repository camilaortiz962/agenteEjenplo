// Lógica de gestion.html. "heroes" y las funciones CRUD (agregarHeroe,
// buscarHeroesPorNombre, modificarHeroe, eliminarHeroe...) vienen de
// data.js, que se carga antes que este archivo. Desde la semana 11 todas
// esas funciones hablan con Supabase, por eso son async y acá se usan
// con await dentro de listeners async.

// Cada botón del sidebar tiene un data-seccion (ej. "crear") que apunta
// al id de la sección que debe mostrar (ej. "seccion-crear").
const sidebarItems = document.querySelectorAll(".sidebar-item");
const secciones = document.querySelectorAll(".seccion");

// Muestra la sección pedida (por su nombre, ej. "mostrar") y oculta las
// demás, marcando también el ítem del sidebar correspondiente como activo.
// La usan tanto el click en el sidebar como el formulario de Crear, para
// saltar directo a "Mostrar todos" después de agregar un elemento.
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

// Después de crear/actualizar/eliminar, se vuelve a pedir la tabla
// completa a Supabase (la "fuente de verdad") y se repinta todo. Antes
// esto lo hacíamos tocando el arreglo local a mano con push/splice.
async function recargarHeroes() {
  heroes = await listarHeroes();
  renderMostrarTodos();
  renderListaEliminar();
}

// Convierte "Rap, Baile, , Vocal" en ["Rap", "Baile", "Vocal"].
// La usan Crear y Actualizar, que arman el arreglo "poder" igual.
function leerPoderes(idInput) {
  return document.getElementById(idInput).value
    .split(",")
    .map(function(p) { return p.trim(); })
    .filter(function(p) { return p !== ""; });
}

// FileReader trabaja con un callback (onload); acá lo envolvemos en una
// Promise para poder usarlo con await igual que las consultas a Supabase.
// Convierte la imagen elegida en una data URL (la imagen codificada como
// texto), que se guarda tal cual en la columna "Image" de la tabla.
// Si no se eligió archivo, devuelve "valorSiNoHay".
function leerImagen(idInput, valorSiNoHay) {
  const archivo = document.getElementById(idInput).files[0];
  if (!archivo) return Promise.resolve(valorSiNoHay);

  return new Promise(function(resolve) {
    const lector = new FileReader();
    lector.onload = function() {
      resolve(lector.result);
    };
    lector.readAsDataURL(archivo);
  });
}

// --- Sección Crear: arma un objeto con la misma forma que las columnas
// de la tabla "heroes" (sin id: lo genera Postgres) y lo inserta. ---
const formCrear = document.getElementById("formCrear");
const crearMensaje = document.getElementById("crearMensaje");

formCrear.addEventListener("submit", async function(e) {
  e.preventDefault();

  const rutaImagen = await leerImagen("crearImage", "");

  const nuevo = await agregarHeroe({
    nombre: document.getElementById("crearNombre").value.trim(),
    poder: leerPoderes("crearPoder"),
    descripcion: document.getElementById("crearDescripcion").value.trim(),
    bando: document.getElementById("crearBando").value.trim(),
    Image: rutaImagen,
    edad: Number(document.getElementById("crearEdad").value),
    altura: Number(document.getElementById("crearAltura").value),
    universo: document.getElementById("crearUniverso").value.trim(),
    nivelDeFuerza: Number(document.getElementById("crearNivelDeFuerza").value),
    activo: document.getElementById("crearActivo").checked,
  });

  if (!nuevo) {
    crearMensaje.textContent = "❌ No se pudo agregar. Revisa la consola (F12).";
    return;
  }

  crearMensaje.textContent = "✅ Se agregó \"" + nuevo.nombre + "\" con id " + nuevo.id + ".";
  formCrear.reset();
  document.getElementById("crearActivo").checked = true;

  await recargarHeroes();
  mostrarSeccion("mostrar");
});

// --- Sección Buscar: busca en Supabase por parte del nombre (ilike) y
// muestra las coincidencias como cartas. ---
const formBuscar = document.getElementById("formBuscar");
const buscarMensaje = document.getElementById("buscarMensaje");
const buscarResultados = document.getElementById("buscarResultados");

formBuscar.addEventListener("submit", async function(e) {
  e.preventDefault();

  const texto = document.getElementById("buscarTexto").value.trim();
  const resultados = await buscarHeroesPorNombre(texto);

  buscarResultados.innerHTML = "";

  if (resultados.length === 0) {
    buscarMensaje.textContent = "No hay integrantes cuyo nombre contenga \"" + texto + "\".";
    return;
  }

  buscarMensaje.textContent = resultados.length + " resultado(s) para \"" + texto + "\".";
  dibujarCartas(resultados, buscarResultados);
});

// --- Sección Eliminar: lista todos los héroes con un botón cada uno.
// Al apretarlo, pide confirmación y recién ahí lo borra de Supabase. ---
const eliminarMensaje = document.getElementById("eliminarMensaje");
const listaEliminar = document.getElementById("listaEliminar");

// Pinta un <li> por cada héroe, con su nombre y un botón "Eliminar".
// El botón queda "enganchado" al objeto h en sí (por clausura), así
// después tenemos su id sin volver a buscarlo.
function renderListaEliminar() {
  listaEliminar.innerHTML = "";

  heroes.forEach(function(h) {
    const item = document.createElement("li");
    item.className = "item-eliminar";

    const nombreSpan = document.createElement("span");
    nombreSpan.textContent = h.nombre;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Eliminar";
    boton.addEventListener("click", function() {
      confirmarEliminar(h);
    });

    item.appendChild(nombreSpan);
    item.appendChild(boton);
    listaEliminar.appendChild(item);
  });
}

// Pide confirmación con confirm() y, si el usuario acepta, borra la fila
// por su id. Ya no hace falta la lista "heroesEliminados": la fila deja
// de existir en la tabla, para todos los computadores a la vez.
async function confirmarEliminar(h) {
  const confirmado = confirm("¿Eliminar a \"" + h.nombre + "\"? Esta acción no se puede deshacer.");
  if (!confirmado) {
    return;
  }

  const seElimino = await eliminarHeroe(h.id);

  if (!seElimino) {
    eliminarMensaje.textContent = "❌ No se pudo eliminar a \"" + h.nombre + "\". Revisa la consola (F12).";
    return;
  }

  eliminarMensaje.textContent = "Se eliminó \"" + h.nombre + "\".";
  await recargarHeroes();
}

// --- Sección Actualizar: busca un héroe por nombre, precarga sus datos
// en un formulario y, al guardar, actualiza esa misma fila (por su id). ---
const formBuscarActualizar = document.getElementById("formBuscarActualizar");
const formActualizar = document.getElementById("formActualizar");
const actualizarMensaje = document.getElementById("actualizarMensaje");

// id e imagen del héroe que se está editando en este momento. Antes se
// guardaba el nombre; ahora el id, que nunca cambia aunque se edite el
// nombre (por eso ya no hay que "borrar el viejo y crear uno nuevo").
let idEnEdicion = null;
let imagenActualEnEdicion = "";

formBuscarActualizar.addEventListener("submit", async function(e) {
  e.preventDefault();

  const nombreBuscado = document.getElementById("actualizarNombreBuscar").value.trim();

  // ilike trae todos los que CONTIENEN el texto; de esos nos quedamos con
  // el que se llama exactamente así (sin importar mayúsculas), como antes.
  const candidatos = await buscarHeroesPorNombre(nombreBuscado);
  const encontrado = candidatos.find(function(h) {
    return h.nombre.toLowerCase() === nombreBuscado.toLowerCase();
  });

  if (!encontrado) {
    actualizarMensaje.textContent = "No se encontró ningún integrante llamado \"" + nombreBuscado + "\".";
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

  // Si no se eligió imagen nueva, se conserva la que ya tenía.
  const rutaImagen = await leerImagen("actualizarImage", imagenActualEnEdicion);

  const actualizado = await modificarHeroe(idEnEdicion, {
    nombre: document.getElementById("actualizarNombre").value.trim(),
    poder: leerPoderes("actualizarPoder"),
    descripcion: document.getElementById("actualizarDescripcion").value.trim(),
    bando: document.getElementById("actualizarBando").value.trim(),
    Image: rutaImagen,
    edad: Number(document.getElementById("actualizarEdad").value),
    altura: Number(document.getElementById("actualizarAltura").value),
    universo: document.getElementById("actualizarUniverso").value.trim(),
    nivelDeFuerza: Number(document.getElementById("actualizarNivelDeFuerza").value),
    activo: document.getElementById("actualizarActivo").checked,
  });

  if (!actualizado) {
    actualizarMensaje.textContent = "❌ No se pudo actualizar (puede que lo hayan eliminado). Revisa la consola (F12).";
    formActualizar.hidden = true;
    return;
  }

  actualizarMensaje.textContent = "✅ Se actualizó \"" + actualizado.nombre + "\".";
  formActualizar.hidden = true;
  formBuscarActualizar.reset();

  await recargarHeroes();
  mostrarSeccion("mostrar");
});

// Primer pintado: espera a que data.js traiga las cartas de Supabase.
heroesListos.then(function() {
  renderMostrarTodos();
  renderListaEliminar();
});

// --- Sección Usuarios: lista los usuarios del login de game.html.
// loadUsers (userStore.js) ya junta todo en localStorage: la semilla de
// users.json se copia ahí una sola vez, así que no hay que leerla aparte.
// (Esto sigue en localStorage a propósito: se migra en la semana 13, Auth.) ---
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

    // Se arma celda por celda con textContent (no con innerHTML) porque
    // estos datos los escribió cualquier persona en el formulario de
    // registro: si alguien pone HTML en su alias, se ve como texto y no
    // se ejecuta como código.
    [u.id.slice(0, 8), u.name, u.alias, u.email, u.password, u.games.length].forEach(function(valor) {
      const celda = document.createElement("td");
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    // El id completo es largo: en la tabla se ven los primeros 8 caracteres
    // y el id entero aparece al pasar el mouse (atributo title).
    fila.firstChild.title = u.id;

    tablaUsuariosBody.appendChild(fila);
  });
}
