// Arma el HTML interno de UNA carta a partir de un objeto de "heroes".
// Vive en su propio archivo porque tanto Index.html (la baraja) como
// gestion.html (la sección "Mostrar todos") necesitan generar cartas con
// el mismo diseño, sin duplicar esta función en los dos lados.
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
