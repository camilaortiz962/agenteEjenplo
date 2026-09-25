// Lógica de gestion.html. "heroes" ya está disponible acá porque
// data.js se carga antes que este archivo en gestion.html.

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

renderMostrarTodos();

// --- Sección Crear: arma un objeto con la misma forma que los de
// data.js a partir del formulario, y lo agrega al arreglo "heroes". ---
const formCrear = document.getElementById("formCrear");
const crearMensaje = document.getElementById("crearMensaje");

// Suma un héroe nuevo a la lista guardada en localStorage (clave
// "heroesCreados"), sin pisar los que ya estaban ahí. data.js lee esta
// misma clave al cargar, así el héroe también aparece en Index.html.
function guardarHeroeEnLocalStorage(h) {
  const heroesGuardados = JSON.parse(localStorage.getItem("heroesCreados") || "[]");
  heroesGuardados.push(h);

  // Si antes se había eliminado a alguien con este mismo nombre, lo
  // sacamos de la lista de eliminados: si no, data.js lo volvería a
  // esconder apenas se recargue la página.
  const heroesEliminados = JSON.parse(localStorage.getItem("heroesEliminados") || "[]");
  const eliminadosSinEste = heroesEliminados.filter(function(nombre) {
    return nombre !== h.nombre;
  });
  localStorage.setItem("heroesEliminados", JSON.stringify(eliminadosSinEste));

  try {
    localStorage.setItem("heroesCreados", JSON.stringify(heroesGuardados));
  } catch (error) {
    crearMensaje.textContent = "Se agregó, pero no se pudo guardar en localStorage (" + error.message + ").";
  }
}

// Arma el objeto y lo agrega, ya con la ruta/data URL de la imagen resuelta.
function agregarHeroe(rutaImagen) {
  const nuevoHeroe = {
    nombre: document.getElementById("crearNombre").value.trim(),
    poder: document.getElementById("crearPoder").value
      .split(",")
      .map(function(p) { return p.trim(); })
      .filter(function(p) { return p !== ""; }),
    descripcion: document.getElementById("crearDescripcion").value.trim(),
    bando: document.getElementById("crearBando").value.trim(),
    Image: rutaImagen,
    edad: Number(document.getElementById("crearEdad").value),
    altura: Number(document.getElementById("crearAltura").value),
    universo: document.getElementById("crearUniverso").value.trim(),
    nivelDeFuerza: Number(document.getElementById("crearNivelDeFuerza").value),
    activo: document.getElementById("crearActivo").checked,
  };

  heroes.push(nuevoHeroe);
  guardarHeroeEnLocalStorage(nuevoHeroe);

  crearMensaje.textContent = "Se agregó \"" + nuevoHeroe.nombre + "\" correctamente.";
  formCrear.reset();
  document.getElementById("crearActivo").checked = true;

  renderMostrarTodos();
  renderListaEliminar();
  mostrarSeccion("mostrar");
}

formCrear.addEventListener("submit", function(e) {
  e.preventDefault();

  const archivoImagen = document.getElementById("crearImage").files[0];

  if (!archivoImagen) {
    agregarHeroe("");
    return;
  }

  // FileReader lee el archivo elegido y lo convierte en una data URL
  // (el contenido de la imagen codificado en el propio texto), así el
  // <img> la puede mostrar directo sin depender de una ruta en el disco.
  const lector = new FileReader();
  lector.onload = function() {
    agregarHeroe(lector.result);
  };
  lector.readAsDataURL(archivoImagen);
});

// --- Sección Eliminar: lista todos los héroes con un botón cada uno.
// Al apretarlo, pide confirmación y recién ahí lo saca de "heroes". ---
const eliminarMensaje = document.getElementById("eliminarMensaje");
const listaEliminar = document.getElementById("listaEliminar");

// Saca un héroe (por nombre) de la lista guardada en localStorage, sin
// tocar los demás. Si el héroe eliminado era uno de los 8 originales de
// data.js (nunca estuvo en localStorage), esto simplemente no encuentra
// nada que borrar ahí.
function eliminarHeroeDeLocalStorage(nombre) {
  const heroesGuardados = JSON.parse(localStorage.getItem("heroesCreados") || "[]");
  const filtrados = heroesGuardados.filter(function(h) {
    return h.nombre.toLowerCase() !== nombre.toLowerCase();
  });
  localStorage.setItem("heroesCreados", JSON.stringify(filtrados));
}

// Guarda el nombre en la lista de "eliminados" para que data.js lo filtre
// en cada carga, aunque sea uno de los 8 originales que siempre se vuelven
// a agregar. Así la eliminación es permanente y no solo de esta sesión.
function agregarANombresEliminados(nombre) {
  const heroesEliminados = JSON.parse(localStorage.getItem("heroesEliminados") || "[]");
  if (!heroesEliminados.includes(nombre)) {
    heroesEliminados.push(nombre);
  }
  localStorage.setItem("heroesEliminados", JSON.stringify(heroesEliminados));
}

// Pinta un <li> por cada héroe, con su nombre y un botón "Eliminar".
// El botón queda "enganchado" al objeto h en sí (por clausura), no a su
// nombre, así no hay que volver a buscarlo en el arreglo.
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
      eliminarHeroe(h);
    });

    item.appendChild(nombreSpan);
    item.appendChild(boton);
    listaEliminar.appendChild(item);
  });
}

// Pide confirmación con confirm() y, si el usuario acepta, saca al héroe
// de "heroes" y de localStorage (marcándolo como eliminado permanente).
function eliminarHeroe(h) {
  const confirmado = confirm("¿Eliminar a \"" + h.nombre + "\"? Esta acción no se puede deshacer.");
  if (!confirmado) {
    return;
  }

  const indice = heroes.indexOf(h);
  if (indice === -1) {
    return;
  }

  heroes.splice(indice, 1);
  eliminarHeroeDeLocalStorage(h.nombre);
  agregarANombresEliminados(h.nombre);

  eliminarMensaje.textContent = "Se eliminó \"" + h.nombre + "\".";

  renderMostrarTodos();
  renderListaEliminar();
}

renderListaEliminar();

// --- Sección Actualizar: busca un héroe por nombre, precarga sus datos
// en un formulario y, al guardar, reemplaza esa versión por la editada. ---
const formBuscarActualizar = document.getElementById("formBuscarActualizar");
const formActualizar = document.getElementById("formActualizar");
const actualizarMensaje = document.getElementById("actualizarMensaje");

// Nombre e imagen del héroe que se está editando en este momento (para
// poder ubicarlo de nuevo al guardar, y para no perder su imagen si no
// se elige un archivo nuevo).
let nombreOriginalEnEdicion = null;
let imagenActualEnEdicion = "";

formBuscarActualizar.addEventListener("submit", function(e) {
  e.preventDefault();

  const nombreBuscado = document.getElementById("actualizarNombreBuscar").value.trim();
  const encontrado = heroes.find(function(h) {
    return h.nombre.toLowerCase() === nombreBuscado.toLowerCase();
  });

  if (!encontrado) {
    actualizarMensaje.textContent = "No se encontró ningún integrante llamado \"" + nombreBuscado + "\".";
    formActualizar.hidden = true;
    return;
  }

  nombreOriginalEnEdicion = encontrado.nombre;
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

  actualizarMensaje.textContent = "Editando a \"" + encontrado.nombre + "\". Cambiá lo que necesites y guardá.";
  formActualizar.hidden = false;
});

// Reemplaza al héroe en edición por la versión nueva: saca la vieja (de
// "heroes", de localStorage, y la marca como eliminada por si era una de
// las 8 originales) y agrega la actualizada, igual que si fuera creada.
function guardarCambios(rutaImagen) {
  const indice = heroes.findIndex(function(h) {
    return h.nombre === nombreOriginalEnEdicion;
  });

  if (indice === -1) {
    actualizarMensaje.textContent = "Ese integrante ya no existe (puede que lo hayan eliminado).";
    formActualizar.hidden = true;
    return;
  }

  const actualizado = {
    nombre: document.getElementById("actualizarNombre").value.trim(),
    poder: document.getElementById("actualizarPoder").value
      .split(",")
      .map(function(p) { return p.trim(); })
      .filter(function(p) { return p !== ""; }),
    descripcion: document.getElementById("actualizarDescripcion").value.trim(),
    bando: document.getElementById("actualizarBando").value.trim(),
    Image: rutaImagen,
    edad: Number(document.getElementById("actualizarEdad").value),
    altura: Number(document.getElementById("actualizarAltura").value),
    universo: document.getElementById("actualizarUniverso").value.trim(),
    nivelDeFuerza: Number(document.getElementById("actualizarNivelDeFuerza").value),
    activo: document.getElementById("actualizarActivo").checked,
  };

  heroes.splice(indice, 1);
  eliminarHeroeDeLocalStorage(nombreOriginalEnEdicion);
  agregarANombresEliminados(nombreOriginalEnEdicion);

  heroes.push(actualizado);
  guardarHeroeEnLocalStorage(actualizado);

  actualizarMensaje.textContent = "Se actualizó \"" + actualizado.nombre + "\".";
  formActualizar.hidden = true;
  formBuscarActualizar.reset();

  renderMostrarTodos();
  renderListaEliminar();
  mostrarSeccion("mostrar");
}

formActualizar.addEventListener("submit", function(e) {
  e.preventDefault();

  const archivoImagen = document.getElementById("actualizarImage").files[0];

  if (!archivoImagen) {
    guardarCambios(imagenActualEnEdicion);
    return;
  }

  const lector = new FileReader();
  lector.onload = function() {
    guardarCambios(lector.result);
  };
  lector.readAsDataURL(archivoImagen);
});

// --- Sección Usuarios: lista los usuarios del login de game.html.
// loadUsers (userStore.js) ya junta todo en localStorage: la semilla de
// users.json se copia ahí una sola vez, así que no hay que leerla aparte. ---
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
