/* prueba.js — Sección 4.4, Paso 5 (versión final del ejercicio) */

document.getElementById('btn-traer').addEventListener('click', async () => {

  // async/await: la consulta viaja por internet hasta Supabase y
  // tenemos que ESPERAR la respuesta antes de usar "data".
  const { data, error } = await db.from('productos_practica').select('*');

  // Validar el error ANTES de tocar data (si falla, data llega null).
  if (error) {
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  // map() es sincrónico: los datos ya están en memoria, no lleva await.
  const nombres = data.map(producto => producto.nombre);

  document.getElementById('resultado').innerHTML =
    '<ul>' + nombres.map(n => `<li>${n}</li>`).join('') + '</ul>';
});

