/* prueba.js — Sección 4.4, versión final (Paso 5) */

document.getElementById('btn-traer').addEventListener('click', async () => {

  // async/await: necesitamos esperar la respuesta real de Supabase
  // (viaja por internet) antes de poder usar "data".
  const { data, error } = await db.from('productos_practica').select('*');

  // Paso 3 (solo consola) — déjalo para depurar si algo falla
  console.log(data, error);

  // Revisamos "error" ANTES de tocar "data": si la consulta falló,
  // "data" llega como null y data.map() rompería el script.
  if (error) {
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // Paso 4 (datos crudos) — descomenta para ver el objeto completo:
  // document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);

  // Paso 7: galería. Mismo patrón (map + join), pero cada producto
  // se vuelve una tarjeta <article> en vez de una fila <tr>.
  const tarjetas = data.map(producto => `
    <article class="card ${producto.disponible ? '' : 'agotado'}">
      <!-- "img-url" tiene guion: producto.img-url se leería como
           producto.img MENOS url. Por eso se usan corchetes. -->
      <img src="${producto['img-url']}" alt="${producto.nombre}">
      <div class="info">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <p class="precio">
          $${producto.precio.toLocaleString('es-CO')}
          ${producto.descuento > 0 ? `<span class="descuento">-${Math.round(producto.descuento * 100)}%</span>` : ''}
        </p>
        <p>Unidades: ${producto.unidades} · ${producto.disponible ? 'Disponible' : 'No disponible'}</p>
        <p class="categorias">
          ${(producto.categorias ?? []).map(c => `<span>${c}</span>`).join('')}
        </p>
        <small>ID ${producto.id}</small>
      </div>
    </article>
  `).join('');

  document.getElementById('resultado').innerHTML =
    `<div class="galeria">${tarjetas}</div>`;
});
