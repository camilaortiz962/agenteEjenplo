/* prueba2.js — el JS de la guía de la semana 11:
   4.4 Paso 5 (botón "Traer productos") y las funciones CRUD de la 5 */

// Intl.NumberFormat da formato de moneda: 89000 → "$ 89.000"
// 'es-CO' = separadores colombianos; maximumFractionDigits: 0 = sin centavos
const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Dibuja una lista de productos dentro de un contenedor.
// La sacamos a una función porque la usan DOS partes: "Traer productos"
// y el buscador. Así el HTML de cada producto se escribe una sola vez.
function mostrarProductos(lista, contenedor) {

  // map() es SINCRÓNICO — por eso NO lleva await. "await" es solo
  // para lo que viaja por la red (la consulta a Supabase).
  // Por cada producto armamos un <li> con nombre, precio y descripción.
  const items = lista.map(producto => `
    <li class="producto">
      <div class="producto-cabecera">
        <strong>${producto.nombre}</strong>
        <span class="precio">${formatoPrecio.format(producto.precio)}</span>
      </div>
      <p>${producto.descripcion || 'Sin descripción'}</p>
    </li>
  `);
  // ↑ "|| 'Sin descripción'": si la descripción viene vacía o null,
  //   mostramos ese texto en vez de dejar el espacio en blanco

  // join('') une todos los <li> en un solo texto, sin comas entre ellos
  contenedor.innerHTML = '<ul class="lista-productos">' + items.join('') + '</ul>';
}

/* ============================================================
   4.4 Paso 5 — traer todos los productos
   ============================================================ */
document.getElementById('btn-traer').addEventListener('click', async () => {

  // async/await, igual que en los Pasos 2 y 3: necesitamos esperar la
  // respuesta real de Supabase antes de poder usar "data".
  const { data, error } = await db.from('productos_practica').select('*');

  if (error) {
    document.getElementById('resultado').textContent = 'Error: ' + error.message;
    return;
  }

  mostrarProductos(data, document.getElementById('resultado'));

  // JSON.stringify convierte el array de objetos en TEXTO con formato JSON.
  // - 2º argumento (null): no filtramos ninguna propiedad
  // - 3º argumento (2): sangría de 2 espacios, para que se lea fácil
  const json = JSON.stringify(data, null, 2);

  // textContent (no innerHTML): muestra el texto tal cual, sin que el
  // navegador intente interpretar nada como etiquetas HTML
  document.querySelector('#json-productos code').textContent = json;
});

/* ============================================================
   Buscador — usa las funciones de datos.js (5.2 READ)
   ============================================================ */
const inputBuscar = document.getElementById('input-buscar');
const mensajeBusqueda = document.getElementById('mensaje-busqueda');
const resultadoBusqueda = document.getElementById('resultado-busqueda');

// --- Buscar por ID ---
document.getElementById('btn-buscar-id').addEventListener('click', async () => {

  // El input siempre da TEXTO ("3"). La columna id es un número,
  // así que lo convertimos: Number("3") → 3
  const id = Number(inputBuscar.value.trim());

  // Number("hola") da NaN ("Not a Number"). Number.isInteger() revisa
  // que sea un número entero válido antes de molestar a Supabase.
  if (!Number.isInteger(id) || id <= 0) {
    mensajeBusqueda.textContent = 'Escribe un id válido (un número entero, ej: 3).';
    resultadoBusqueda.innerHTML = '';
    return;
  }

  // buscarProductoPorId() devuelve UN objeto, o null si no existe
  const producto = await buscarProductoPorId(id);

  if (!producto) {
    mensajeBusqueda.textContent = 'No hay ningún producto con id ' + id + '.';
    resultadoBusqueda.innerHTML = '';
    return;
  }

  mensajeBusqueda.textContent = 'Producto con id ' + id + ':';
  // mostrarProductos() espera un ARRAY, por eso lo envolvemos en [ ]
  mostrarProductos([producto], resultadoBusqueda);
});

// --- Buscar por nombre ---
document.getElementById('btn-buscar-nombre').addEventListener('click', async () => {

  const texto = inputBuscar.value.trim();

  if (texto === '') {
    mensajeBusqueda.textContent = 'Escribe parte del nombre que buscas.';
    resultadoBusqueda.innerHTML = '';
    return;
  }

  // buscarProductosPorNombre() devuelve un ARRAY (puede venir vacío).
  // Usa ilike: no distingue mayúsculas y encuentra coincidencias
  // parciales ("lamp" encuentra "Lámpara Solar Portátil"... si escribes
  // la tilde igual: ilike sí distingue "a" de "á").
  const productos = await buscarProductosPorNombre(texto);

  if (productos.length === 0) {
    mensajeBusqueda.textContent = 'No hay productos cuyo nombre contenga "' + texto + '".';
    resultadoBusqueda.innerHTML = '';
    return;
  }

  mensajeBusqueda.textContent = productos.length + ' resultado(s) para "' + texto + '":';
  mostrarProductos(productos, resultadoBusqueda);
});

//crud
// Los dos productos de ejemplo. Son solo objetos: definirlos NO los
// inserta — eso pasa cuando se los pasamos a agregarProducto().
const mouse = {
  nombre: "mouse inalambrico",
  descripcion: "Descripción del nuevo producto",
  precio: 99.99,
  unidades: 10,
  descuento: 0.1,
  disponible: true,
  categorias: ["categoria1", "categoria2"],
  // "img_url" (no "imagen"): el nombre de la propiedad debe ser
  // EXACTAMENTE el nombre de la columna en Supabase, o el insert falla
  img_url: "https://m.media-amazon.com/images/I/61vZ02PnaNL._AC_.jpg",
};

const lampara = {
  nombre: "Lámpara Solar Portátil",
  descripcion: "Lámpara recargable con panel solar, ideal para exteriores",
  precio: 89000,
  unidades: 40,
  descuento: 0.05,
  disponible: true,
  categorias: ["hogar", "exteriores", "ofertas"]
};

// AHORA (Supabase):
async function agregarProducto(datos) {

  const { data, error } = await db
    .from('productos_practica')  // la tabla
    .insert([datos])             // insert() siempre recibe un ARRAY de objetos,
                                  // aunque insertes uno solo
    .select();                    // .select() le pide a Supabase que te
                                   // devuelva la fila ya creada (con su id
                                   // nuevo) — sin esto, insert() no te
                                   // devuelve nada útil

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }

  return data[0];   // data siempre es un array — tomamos el primer
                     // elemento, que es la fila recién creada
}

/* ============================================================
   Botón "Agregar productos de ejemplo"
   ============================================================ */
// El "await" va DENTRO de una función async (la del click). Antes estaba
// suelto en el archivo: eso es un SyntaxError y rompía TODO prueba2.js.
// Además, así el insert pasa solo cuando tú das clic, no en cada recarga.
document.getElementById('btn-agregar-ejemplos').addEventListener('click', async (event) => {

  const boton = event.currentTarget;  // el botón al que se le dio clic
  const notificacion = document.getElementById('notificacion');

  // Desactivamos el botón mientras se guarda: si das doble clic,
  // no se insertan los productos dos veces
  boton.disabled = true;
  notificacion.textContent = 'Guardando productos de ejemplo...';

  // Uno después del otro: cada await espera a que Supabase responda
  const nuevoMouse = await agregarProducto(mouse);
  const nuevaLampara = await agregarProducto(lampara);

  // agregarProducto() devuelve la fila creada, o null si falló
  if (nuevoMouse && nuevaLampara) {
    notificacion.textContent =
      'Agregados: ' + nuevoMouse.nombre + ' (id ' + nuevoMouse.id + ') y ' +
      nuevaLampara.nombre + ' (id ' + nuevaLampara.id + ').';
    // se queda desactivado: ya están en la tabla, no hace falta repetir
  } else {
    notificacion.textContent = 'Uno o ambos productos fallaron. Revisa la consola (F12).';
    boton.disabled = false;  // dejamos reintentar
  }
});

/* ============================================================
   Formulario → Supabase
   ============================================================ */
const form = document.getElementById('form-producto');

// Escuchamos "submit" en el FORM (no "click" en el botón): así también
// funciona si el usuario presiona Enter, y el navegador revisa los
// "required" antes de dejar pasar el envío.
form.addEventListener('submit', async (event) => {

  // Por defecto, un form recarga la página al enviarse. preventDefault()
  // lo evita, para que nuestro JS maneje el envío y no se pierda nada.
  event.preventDefault();

  // FormData lee todos los inputs del form usando su atributo "name".
  // .get('nombre') devuelve el valor del input con name="nombre".
  const campos = new FormData(form);

  // Armamos un objeto con la MISMA forma que productoprueba.
  // Ojo: todo lo que viene de un input llega como TEXTO ("12345"),
  // por eso convertimos cada campo al tipo que espera la tabla.
  const nuevoProducto = {
    nombre: campos.get('nombre').trim(),
    precio: Number(campos.get('precio')),        // "12345" → 12345
    descripcion: campos.get('descripcion').trim(),
    descuento: Number(campos.get('descuento')),  // "0.05"  → 0.05
    // un checkbox sin marcar no aparece en FormData → get() da null.
    // Comparar con !== null lo convierte en true/false.
    disponible: campos.get('disponible') !== null,
    // "hogar, ofertas" → ["hogar", "ofertas"]
    // split(',') corta por comas, map(trim) quita espacios,
    // filter(c => c) descarta textos vacíos (ej: si queda una coma al final)
    categorias: campos.get('categorias')
      .split(',')
      .map(c => c.trim())
      .filter(c => c),
    unidades: Number(campos.get('unidades')),
    img_url: campos.get('img_url').trim(),
    // sin id ni created_at: igual que en productoprueba, Supabase los genera
  };

  const notificacion = document.getElementById('notificacion');
  notificacion.textContent = 'Guardando...';

  // Reutilizamos la misma función de arriba: ella hace el insert en
  // productos_practica y nos devuelve la fila creada (o null si falló).
  const respuesta = await agregarProducto(nuevoProducto);

  if (respuesta) {
    notificacion.textContent = 'Producto agregado con id ' + respuesta.id + ': ' + respuesta.nombre;
    form.reset(); // limpia el formulario para agregar otro
  } else {
    // el detalle del error lo imprime agregarProducto() en la consola (F12)
    notificacion.textContent = 'Error al agregar el producto. Revisa la consola.';
  }
});

async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .eq('id', id)    // eq = "equal" (igual a) — equivalente a find(p => p.id === id)
    .single();         // single() = "espero exactamente una fila, dámela
                        // como objeto, no como array de un elemento"

  if (error) return null;
  return data;
}

async function buscarProductosPorNombre(texto) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .ilike('nombre', `%${texto}%`);
    // ilike = "like" insensible a mayúsculas/minúsculas.
    // los símbolos % significan "cualquier texto antes/después" —
    // equivalente a .toLowerCase().includes(texto)

  if (error) return [];
  return data;
}