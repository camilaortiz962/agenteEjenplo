// El arreglo "heroes" ahora vive en data.js (cargado antes que este
// archivo en Index.html), así que está disponible acá como variable global.

// Ejemplos sueltos de cómo leer datos de un objeto/arreglo (demo de clase).
let heroe = heroes[0];

console.log(heroe.altura);
console.log(heroe.descripcion);
console.log(heroe.nivelDeFuerza);
console.log(heroe.edad * 4);
console.log(heroe.poder[1]);

// crearContenidoCarta(h) ahora vive en cartas.js (cargado antes que este
// archivo en Index.html), porque gestion.html también la necesita.

// Crea el elemento <div class="card"> de UNA carta para la baraja,
// con su contenido ya adentro y el listener que abre el modal al clickearla.
function crearCarta(h) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = crearContenidoCarta(h);
  card.addEventListener("click", function() {
    abrirModal(h);
  });
  return card;
}

// Genera las 8 cartas (una por integrante/grupo) y las agrega todas al
// contenedor de la baraja. "cartas" guarda los elementos ya creados para
// poder reposicionarlos después sin volver a generarlos.
const baraja = document.getElementById("baraja");
const cartas = heroes.map(function(h) {
  const carta = crearCarta(h);
  baraja.appendChild(carta);
  return carta;
});

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

// Ubica las cartas apenas carga la página (antes de cualquier click).
actualizarBaraja();

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