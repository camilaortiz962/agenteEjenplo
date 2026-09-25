// El arreglo "heroes" ahora vive en data.js (cargado antes que este
// archivo en Index.html), así que está disponible acá como variable global.

// Ejemplos sueltos de cómo leer datos de un objeto/arreglo (demo de clase).
let heroe = heroes[0];

console.log(heroe.altura);
console.log(heroe.descripcion);
console.log(heroe.nivelDeFuerza);
console.log(heroe.edad * 4);
console.log(heroe.poder[1]);

// crearContenidoCarta(h) y dibujarCartas(lista, contenedor, alClickear)
// viven en cartas.js (cargado antes que este archivo en Index.html),
// porque gestion.html también las necesita.

// "cartas" guarda los elementos de la baraja que se ven ahora, para poder
// reposicionarlos sin volver a generarlos. Es "let" porque cada vez que
// cambia un filtro se reemplaza por un arreglo nuevo (ver aplicarFiltros).
const baraja = document.getElementById("baraja");
let cartas = [];

// Índice de la carta que está "al frente" de la baraja en este momento.
let indiceActivo = 0;

// Recalcula, para cada carta, qué tan lejos está de la carta activa
// (en círculo, dando la vuelta al llegar al final del arreglo) y le pone
// la clase de posición correspondiente (pos-0 = al frente, pos-1/pos-2 =
// asomando detrás, pos-oculta = escondida). El CSS se encarga de traducir
// esas clases en la posición/rotación real de cada carta.
function actualizarBaraja() {
  const total = cartas.length;

  cartas.forEach(function(carta, i) {
    const distancia = (i - indiceActivo + total) % total;

    carta.classList.remove("pos-0", "pos-1", "pos-2", "pos-oculta");

    if (distancia === 0) {
      carta.classList.add("pos-0");
    } else if (distancia === 1) {
      carta.classList.add("pos-1");
    } else if (distancia === 2) {
      carta.classList.add("pos-2");
    } else {
      carta.classList.add("pos-oculta");
    }
  });
}

// Los botones "Anterior"/"Siguiente" solo cambian el índice activo
// (sumando o restando 1, dando la vuelta con el módulo) y piden que se
// vuelva a acomodar la baraja con ese nuevo índice.
const btnSiguiente = document.getElementById("btnSiguiente");
const btnAnterior = document.getElementById("btnAnterior");

btnSiguiente.addEventListener("click", function() {
  indiceActivo = (indiceActivo + 1) % cartas.length;
  actualizarBaraja();
});

btnAnterior.addEventListener("click", function() {
  indiceActivo = (indiceActivo - 1 + cartas.length) % cartas.length;
  actualizarBaraja();
});

// --- Filtros: botones por "bando" + slider de nivelDeFuerza mínimo ---
const filtrosBotones = document.getElementById("filtrosBotones");
const sliderFuerza = document.getElementById("sliderFuerza");
const valorFuerza = document.getElementById("valorFuerza");
const barajaVacia = document.getElementById("barajaVacia");

// Bando elegido con los botones ("Todos" = no filtrar por bando).
let bandoActivo = "Todos";

// Arma la lista filtrada combinando los dos filtros y vuelve a dibujar la
// baraja desde cero con ella. Se llama al cargar la página y cada vez que
// cambia un botón o el slider.
function aplicarFiltros() {
  // El valor de un <input> siempre llega como texto: Number() lo convierte
  // para poder compararlo con >= contra nivelDeFuerza.
  const fuerzaMinima = Number(sliderFuerza.value);
  valorFuerza.textContent = fuerzaMinima;

  const filtradas = heroes.filter(function(h) {
    // startsWith para que "Vocalista" también incluya "Vocalista principal".
    const cumpleBando = bandoActivo === "Todos" || h.bando.startsWith(bandoActivo);
    const cumpleFuerza = h.nivelDeFuerza >= fuerzaMinima;
    return cumpleBando && cumpleFuerza;
  });

  baraja.innerHTML = "";
  cartas = dibujarCartas(filtradas, baraja, abrirModal);
  indiceActivo = 0;

  // Sin cartas, Anterior/Siguiente harían "% 0" (da NaN): se desactivan
  // y se muestra el aviso en su lugar.
  const hayCartas = cartas.length > 0;
  barajaVacia.hidden = hayCartas;
  btnAnterior.disabled = !hayCartas;
  btnSiguiente.disabled = !hayCartas;

  actualizarBaraja();
}

// Un solo listener en el contenedor en vez de uno por botón (delegación de
// eventos): closest() encuentra el botón clickeado aunque el click caiga en
// el texto de adentro, y data-bando dice qué filtro representa.
filtrosBotones.addEventListener("click", function(e) {
  const boton = e.target.closest(".filtro-btn");
  if (!boton) return;

  filtrosBotones.querySelectorAll(".filtro-btn").forEach(function(b) {
    b.classList.remove("activo");
  });
  boton.classList.add("activo");

  bandoActivo = boton.dataset.bando;
  aplicarFiltros();
});

// "input" se dispara en cada movimiento mientras se arrastra el slider
// ("change" solo al soltarlo), por eso la baraja se actualiza en vivo.
sliderFuerza.addEventListener("input", aplicarFiltros);

// Dibuja la baraja apenas carga la página (sin filtros aplicados).
aplicarFiltros();

const modalOverlay = document.getElementById("modalOverlay");
const modalCard = document.getElementById("modalCard");
const modalClose = document.getElementById("modalClose");

// Abre el modal con el detalle de un héroe/integrante en particular.
// Arma una carta "volteable en 3D": el frente muestra la carta normal
// (crearContenidoCarta) y el reverso muestra la imagen del dorso.
// Un click sobre la carta abierta alterna la clase "volteada", que el
// CSS usa para rotarla 180° y mostrar el otro lado.
function abrirModal(h) {
  modalCard.innerHTML = `
    <div class="flip-escena">
      <div class="flip-carta">
        <div class="flip-cara flip-frente">${crearContenidoCarta(h)}</div>
        <div class="flip-cara flip-reverso">
          <img src="../img/bts-carta-atras.png" alt="Reverso de la carta">
        </div>
      </div>
    </div>
  `;

  const flipCarta = modalCard.querySelector(".flip-carta");
  flipCarta.addEventListener("click", function() {
    flipCarta.classList.toggle("volteada");
  });

  modalOverlay.hidden = false;
}

function cerrarModal() {
  modalOverlay.hidden = true;
}

modalClose.addEventListener("click", cerrarModal);

// Cierra el modal solo si se hace click en el fondo oscuro (el overlay
// en sí), no si se hace click en la carta o en cualquier cosa dentro de ella.
modalOverlay.addEventListener("click", function(e) {
  if (e.target === modalOverlay) {
    cerrarModal();
  }
});

// Alterna el modo oscuro agregando/quitando una clase en <body> (el CSS
// define las variables de color para cada modo) y actualiza el texto
// del botón para reflejar qué acción hace si lo volvés a apretar.
const btnOscuro = document.getElementById("btnOscuro");

btnOscuro.addEventListener("click", function() {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    btnOscuro.textContent = "Modo claro";
  } else {
    btnOscuro.textContent = "Modo oscuro";
  }
});