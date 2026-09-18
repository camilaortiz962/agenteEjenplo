// Datos de las cartas: el grupo BTS (primer objeto) y sus 7 integrantes.
// Cada objeto tiene la misma forma (mismos campos) para que Index.js pueda
// generar cualquier carta sin distinguir de quién se trata. Este archivo se
// carga antes que Index.js en Index.html, así "heroes" queda disponible
// ahí como variable global.
let heroes = [
  {
    nombre: "BTS",
    poder: ["Canto", "Rap", "Baile", "Composición"],
    descripcion:
     "Bangtan Sonyeondan (BTS) es un grupo de K-pop surcoreano formado por Big Hit Entertainment (hoy HYBE). Debutó en 2013 y se convirtió en un fenómeno musical global, con giras mundiales y premios internacionales.",
    bando: "Grupo",
    Image: "../img/bts-group.jpg",
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
    Image: "../img/rm.png",
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
    Image: "../img/jin.png",
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
    Image: "../img/suga.png",
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
    Image: "../img/j-hope.png",
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
    Image: "../img/jimin.png",
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
    Image: "../img/v.png",
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
    Image: "../img/jungkook.png",
    edad: 29,
    altura: 1.78,
    universo: "BTS",
    nivelDeFuerza: 92,
    activo: true,
  },
];

// Además de estos 8, sumamos los que se hayan creado desde el formulario
// de gestion.html y guardado en localStorage (clave "heroesCreados"), así
// también aparecen acá en Index.html sin tener que tocar este archivo.
const heroesGuardados = JSON.parse(localStorage.getItem("heroesCreados") || "[]");
heroes = heroes.concat(heroesGuardados);

// Y sacamos los que se hayan borrado desde gestion.html (clave
// "heroesEliminados"), aunque sean de los 8 originales — si no fuera por
// esto, un integrante eliminado volvería a aparecer cada vez que se
// recarga la página, porque el arreglo de acá arriba nunca cambia.
const heroesEliminados = JSON.parse(localStorage.getItem("heroesEliminados") || "[]");
heroes = heroes.filter(function(h) {
  return !heroesEliminados.includes(h.nombre);
});