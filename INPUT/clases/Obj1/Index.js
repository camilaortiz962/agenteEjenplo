let heroes = [
  {
    nombre: "spider-man",
    poder: ["Sentido arácnido", "Telarañas", "trepar paredes"],
    descripcion:
     "Peter Parker es un joven que tras ser mordido por una araña radiactiva adquiere poderes sobrehumanos, como fuerza, agilidad y reflejos mejorados. Con su alter ego, Spider-Man, lucha",
    bando: "Heroe",
    Image: "image.png",
    edad: 18,
    altura: 1.78,
    universo: "Marvel",
    nivelDeFuerza: 85,
    activo: true,
  },
  {
    nombre: "Iron Man",
    poder: ["Traje de combate", "Vuelo", "Repulsores"],
    descripcion:
     "Tony Stark, un genio multimillonario, construye una armadura tecnológica para protegerse y luego para defender al mundo como Iron Man.",
    bando: "Heroe",
    Image: "img/iron-man.png",
    edad: 48,
    altura: 1.85,
    universo: "Marvel",
    nivelDeFuerza: 88,
    activo: true,
  },
  {
    nombre: "Batman",
    poder: ["Inteligencia estratégica", "Artes marciales", "Gadgets"],
    descripcion:
     "Bruce Wayne, tras presenciar el asesinato de sus padres, se convierte en un vigilante nocturno que combate el crimen en Ciudad Gótica.",
    bando: "Heroe",
    Image: "img/batman.jpg",
    edad: 40,
    altura: 1.88,
    universo: "DC",
    nivelDeFuerza: 75,
    activo: true,
  },
  {
    nombre: "Superman",
    poder: ["Vuelo", "Súper fuerza", "Visión de calor"],
    descripcion:
     "Kal-El, un alienígena de Krypton criado en la Tierra, usa sus poderes casi ilimitados para proteger a la humanidad como Superman.",
    bando: "Heroe",
    Image: "img/superman.png",
    edad: 35,
    altura: 1.9,
    universo: "DC",
    nivelDeFuerza: 99,
    activo: true,
  },
  {
    nombre: "Wonder Woman",
    poder: ["Fuerza sobrehumana", "Lazo de la verdad", "Combate"],
    descripcion:
     "Diana Prince, princesa amazona, lucha por la paz y la justicia utilizando sus habilidades guerreras y armas mágicas.",
    bando: "Heroe",
    Image: "img/wonder-woman.jpg",
    edad: 30,
    altura: 1.83,
    universo: "DC",
    nivelDeFuerza: 95,
    activo: true,
  },
  {
    nombre: "Thor",
    poder: ["Control del rayo", "Mjolnir", "Fuerza asgardiana"],
    descripcion:
     "El dios del trueno de Asgard, hijo de Odín, defiende los nueve reinos con su martillo mágico Mjolnir.",
    bando: "Heroe",
    Image: "img/thor.png",
    edad: 1500,
    altura: 1.95,
    universo: "Marvel",
    nivelDeFuerza: 97,
    activo: true,
  },
  {
    nombre: "Hulk",
    poder: ["Fuerza descomunal", "Regeneración", "Resistencia"],
    descripcion:
     "Bruce Banner, expuesto a radiación gamma, se transforma en una criatura verde de fuerza descomunal cuando se enfurece.",
    bando: "Heroe",
    Image: "img/hulk.png",
    edad: 45,
    altura: 2.4,
    universo: "Marvel",
    nivelDeFuerza: 100,
    activo: true,
  },
  {
    nombre: "Wolverine",
    poder: ["Garras de adamantium", "Factor curativo", "Sentidos animales"],
    descripcion:
     "Logan es un mutante con un poderoso factor de curación y garras retráctiles, veterano de innumerables batallas.",
    bando: "Heroe",
    Image: "img/wolverine.jpg",
    edad: 200,
    altura: 1.6,
    universo: "Marvel",
    nivelDeFuerza: 80,
    activo: true,
  },
  {
    nombre: "Flash",
    poder: ["Súper velocidad", "Viaje en el tiempo", "Reflejos"],
    descripcion:
     "Barry Allen obtuvo súper velocidad tras un accidente con rayos y químicos, convirtiéndose en el hombre más rápido vivo.",
    bando: "Heroe",
    Image: "img/flash.jpg",
    edad: 28,
    altura: 1.83,
    universo: "DC",
    nivelDeFuerza: 82,
    activo: true,
  },
  {
    nombre: "Black Widow",
    poder: ["Combate cuerpo a cuerpo", "Espionaje", "Tácticas"],
    descripcion:
     "Natasha Romanoff, ex-espía entrenada, combate al lado de los Vengadores usando sus habilidades de combate y estrategia.",
    bando: "Heroe",
    Image: "img/black-widow.jpg",
    edad: 39,
    altura: 1.7,
    universo: "Marvel",
    nivelDeFuerza: 65,
    activo: false,
  },
  {
    nombre: "Joker",
    poder: ["Manipulación psicológica", "Química", "Imprevisibilidad"],
    descripcion:
     "Un criminal caótico y brillante que ve el mundo como una broma cruel, y el archienemigo más famoso de Batman.",
    bando: "Villano",
    Image: "img/joker.jpg",
    edad: 45,
    altura: 1.8,
    universo: "DC",
    nivelDeFuerza: 60,
    activo: true,
  },
  {
    nombre: "Thanos",
    poder: ["Fuerza titánica", "Guantelete del Infinito", "Estrategia"],
    descripcion:
     "El Titán Loco busca el equilibrio del universo a través de medios extremos, portando el Guantelete del Infinito.",
    bando: "Villano",
    Image: "img/thanos.png",
    edad: 1000,
    altura: 2.03,
    universo: "Marvel",
    nivelDeFuerza: 98,
    activo: true,
  },
  {
    nombre: "Black Panther",
    poder: ["Fuerza y agilidad felina", "Traje de vibranium", "Garras retráctiles"],
    descripcion:
     "T'Challa, rey de Wakanda, protege a su pueblo con un traje hecho de vibranium y habilidades potenciadas por la hierba en forma de corazón.",
    bando: "Heroe",
    Image: "img/black-panther.png",
    edad: 32,
    altura: 1.83,
    universo: "Marvel",
    nivelDeFuerza: 84,
    activo: true,
  },
];

let heroe = heroes[0];

console.log(heroe.altura);
console.log(heroe.descripcion);
console.log(heroe.nivelDeFuerza);
console.log(heroe.edad * 4);
console.log(heroe.poder[1]);

function crearContenidoCarta(h) {
  const poderesHtml = h.poder.map(function(p) {
    return "<li>" + p + "</li>";
  }).join("");

  return `
    <div class="card-inner">
      <div class="card-header">
        <h1>${h.nombre}</h1>
        <div class="hp-badge">PWR <span>${h.nivelDeFuerza}</span></div>
      </div>

      <div class="img-frame">
        <img class="card-img" src="${h.Image}" alt="${h.nombre}">
      </div>

      <div class="type-row">
        <span class="bando">${h.bando}</span>
      </div>

      <div class="card-body">
        <p class="descripcion">${h.descripcion}</p>

        <ul class="poderes">${poderesHtml}</ul>

        <div class="stats">
          <p>Edad: <span>${h.edad}</span></p>
          <p>Altura: <span>${h.altura}</span> m</p>
          <p>Universo: <span>${h.universo}</span></p>
          <p>Activo: <span>${h.activo ? "Sí" : "No"}</span></p>
        </div>
      </div>
    </div>
  `;
}

function crearCarta(h) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = crearContenidoCarta(h);
  card.addEventListener("click", function() {
    abrirModal(h);
  });
  return card;
}

const baraja = document.getElementById("baraja");
const cartas = heroes.map(function(h) {
  const carta = crearCarta(h);
  baraja.appendChild(carta);
  return carta;
});

let indiceActivo = 0;

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

actualizarBaraja();

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

function abrirModal(h) {
  modalCard.innerHTML = crearContenidoCarta(h);
  modalOverlay.hidden = false;
}

function cerrarModal() {
  modalOverlay.hidden = true;
}

modalClose.addEventListener("click", cerrarModal);

modalOverlay.addEventListener("click", function(e) {
  if (e.target === modalOverlay) {
    cerrarModal();
  }
});

const btnOscuro = document.getElementById("btnOscuro");

btnOscuro.addEventListener("click", function() {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    btnOscuro.textContent = "Modo claro";
  } else {
    btnOscuro.textContent = "Modo oscuro";
  }
});