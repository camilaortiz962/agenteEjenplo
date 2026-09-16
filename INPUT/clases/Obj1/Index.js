// Datos de las cartas: el grupo BTS (primer objeto) y sus 7 integrantes.
// Cada objeto tiene la misma forma (mismos campos) para que el resto del
// código pueda generar cualquier carta sin distinguir de quién se trata.
let heroes = [
  {
    nombre: "BTS",
    poder: ["Canto", "Rap", "Baile", "Composición"],
    descripcion:
     "Bangtan Sonyeondan (BTS) es un grupo de K-pop surcoreano formado por Big Hit Entertainment (hoy HYBE). Debutó en 2013 y se convirtió en un fenómeno musical global, con giras mundiales y premios internacionales.",
    bando: "Grupo",
    Image: "img/bts-group.jpg",
    edad: 32,
    altura: 1.78,
    universo: "BTS",
    nivelDeFuerza: 100,
    activo: true,
  },
  {
    nombre: "RM",
    poder: ["Rap", "Composición", "Liderazgo"],
    descripcion:
     "Kim Namjoon, líder del grupo, es el rapero principal y compositor, conocido por su inteligencia y su rol como vocero de BTS.",
    bando: "Líder",
    Image: "img/rm.png",
    edad: 32,
    altura: 1.81,
    universo: "BTS",
    nivelDeFuerza: 90,
    activo: true,
  },
  {
    nombre: "Jin",
    poder: ["Vocal", "Actuación", "Humor"],
    descripcion:
     "Kim Seokjin es el vocalista de mayor edad del grupo, conocido por su voz, su carisma y su contenido en solitario como 'Eat Jin'.",
    bando: "Vocalista",
    Image: "img/jin.png",
    edad: 34,
    altura: 1.79,
    universo: "BTS",
    nivelDeFuerza: 85,
    activo: true,
  },
  {
    nombre: "Suga",
    poder: ["Rap", "Producción musical", "Composición"],
    descripcion:
     "Min Yoongi, también conocido como Agust D, es rapero y productor, reconocido por sus letras introspectivas y su faceta como solista.",
    bando: "Rapero",
    Image: "img/suga.png",
    edad: 33,
    altura: 1.74,
    universo: "BTS",
    nivelDeFuerza: 88,
    activo: true,
  },
  {
    nombre: "J-Hope",
    poder: ["Baile", "Rap", "Energía escénica"],
    descripcion:
     "Jung Hoseok es el bailarín principal del grupo, conocido por su energía positiva y su habilidad para coreografías complejas.",
    bando: "Bailarín",
    Image: "img/j-hope.png",
    edad: 32,
    altura: 1.77,
    universo: "BTS",
    nivelDeFuerza: 89,
    activo: true,
  },
  {
    nombre: "Jimin",
    poder: ["Baile", "Vocal", "Coreografía"],
    descripcion:
     "Park Jimin es bailarín y vocalista, reconocido por su técnica de baile contemporáneo y su rango vocal.",
    bando: "Bailarín",
    Image: "img/jimin.png",
    edad: 31,
    altura: 1.74,
    universo: "BTS",
    nivelDeFuerza: 87,
    activo: true,
  },
  {
    nombre: "V",
    poder: ["Vocal", "Actuación", "Fotografía"],
    descripcion:
     "Kim Taehyung, conocido como V, es vocalista y actor, reconocido por su voz grave y su estilo artístico distintivo.",
    bando: "Vocalista",
    Image: "img/v.png",
    edad: 31,
    altura: 1.8,
    universo: "BTS",
    nivelDeFuerza: 86,
    activo: true,
  },
  {
    nombre: "Jungkook",
    poder: ["Vocal", "Baile", "Producción"],
    descripcion:
     "Jeon Jungkook es el vocalista principal más joven del grupo, conocido como el 'Golden Maknae' por su versatilidad en canto, baile y producción.",
    bando: "Vocalista principal",
    Image: "img/jungkook.png",
    edad: 29,
    altura: 1.78,
    universo: "BTS",
    nivelDeFuerza: 92,
    activo: true,
  },
];

// Ejemplos sueltos de cómo leer datos de un objeto/arreglo (demo de clase).
let heroe = heroes[0];

console.log(heroe.altura);
console.log(heroe.descripcion);
console.log(heroe.nivelDeFuerza);
console.log(heroe.edad * 4);
console.log(heroe.poder[1]);

// Arma el HTML interno de UNA carta a partir de un objeto de "heroes".
// La usan tanto la baraja (cartas chicas) como el modal de detalle,
// así el contenido de una carta siempre se genera de la misma forma.
function crearContenidoCarta(h) {
  // La carta de BTS (el grupo) no tiene edad/altura individuales,
  // así que se le oculta esa sección de stats más abajo.
  const esGrupo = heroes.indexOf(h) === 0;

  // Convierte el arreglo de poderes en una lista de <li>, uno por poder.
  const poderesHtml = h.poder.map(function(p) {
    return `
      <li class="ataque">
        <span class="ataque-icono">✦</span>
        <span class="ataque-nombre">${p}</span>
      </li>
    `;
  }).join("");

  return `
    <div class="card-inner">
      <img class="card-bg-img${esGrupo ? " card-bg-img--grupo" : ""}${h.nombre === "V" ? " card-bg-img--v" : ""}" src="${h.Image}" alt="${h.nombre}">

      <div class="card-topbar">
        <span class="stage-badge">${h.bando}</span>
        <div class="hp-badge">HP <span>${h.nivelDeFuerza}</span></div>
      </div>

      <div class="card-body">
        <h1 class="card-title">${h.nombre}</h1>

        <ul class="ataques">${poderesHtml}</ul>

        <p class="descripcion">${h.descripcion}</p>

        ${esGrupo ? "" : `
        <div class="stats">
          <div class="stat"><span class="stat-label">Edad</span><span class="stat-valor">${h.edad}</span></div>
          <div class="stat"><span class="stat-label">Altura</span><span class="stat-valor">${h.altura} m</span></div>
          <div class="stat"><span class="stat-label">Universo</span><span class="stat-valor">${h.universo}</span></div>
          <div class="stat"><span class="stat-label">Activo</span><span class="stat-valor">${h.activo ? "Sí" : "No"}</span></div>
        </div>
        `}
      </div>
    </div>
  `;
}

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
          <img src="img/bts-carta-atras.png" alt="Reverso de la carta">
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