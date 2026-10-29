/* prueba2.js — el JS de la guía de la semana 11:
   4.4 Paso 5 (botón "Traer productos") y el CRUD de la sección 5.
   Las funciones que hablan con Supabase (listarProductos, agregarProducto,
   buscarProductoPorId, buscarProductosPorNombre, modificarProducto,
   eliminarProducto) viven en datos.js — aquí solo está la interfaz. */

// Intl.NumberFormat da formato de moneda: 89000 → "$ 89.000"
// 'es-CO' = separadores colombianos; maximumFractionDigits: 0 = sin centavos
const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/* ============================================================
   Utilidades
   ============================================================ */

// Convierte caracteres especiales de HTML en texto seguro: "<b>" → "&lt;b&gt;".
// Sin esto, un producto llamado "Mesa <grande>" se vería como "Mesa "
// porque innerHTML trataría "<grande>" como una etiqueta.
// El & va PRIMERO: si no, volvería a escapar los &lt; que acabamos de crear.
function escapar(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Quita mayúsculas y tildes: "Lámpara" → "lampara".
// normalize('NFD') separa la "á" en "a" + tilde, y el replace borra
// las tildes sueltas (rango Unicode ̀-ͯ)
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// "hogar, ofertas," → ["hogar", "ofertas"]
// split(',') corta por comas, map(trim) quita espacios,
// filter(c => c) descarta textos vacíos (ej: si queda una coma al final).
// La usan Agregar y Modificar, por eso está en una función aparte.
function textoACategorias(texto) {
  return texto.split(',').map(c => c.trim()).filter(c => c);
}

// Desactiva el botón de enviar mientras Supabase responde: así un doble
// clic no manda la operación dos veces (dos inserts = producto duplicado)
function ocupado(form, estaOcupado) {
  form.querySelector('button[type="submit"]').disabled = estaOcupado;
}

// Muestra un aviso arriba de la pantalla. "tipo":
//   'exito' (verde) · 'error' (rojo) · 'info' (neutro)  → se van solos a los 4 s
//   ''  (neutro, ej. "Guardando...")                     → se queda hasta el siguiente aviso
let temporizadorNotificacion;

function notificar(texto, tipo = '') {
  const notificacion = document.getElementById('notificacion');
  notificacion.textContent = texto;
  notificacion.className = tipo;   // reemplaza la clase anterior (exito/error)

  // Si ya había un aviso esperando para borrarse, cancelamos ese
  // temporizador: si no, borraría el aviso NUEVO antes de tiempo
  clearTimeout(temporizadorNotificacion);

  // Al vaciar el texto, la regla :empty del CSS lo esconde
  if (tipo !== '') {
    temporizadorNotificacion = setTimeout(() => {
      notificacion.textContent = '';
    }, 4000);
  }
}

/* ============================================================
   Dibujar productos
   ============================================================ */

// Convierte el array de categorías en "etiquetas" (<span> sueltos).
// "?? []": si la columna viene null, usamos un array vacío para que
// .length y .map() no lancen un TypeError
function mostrarCategorias(categorias) {
  const lista = categorias ?? [];
  if (lista.length === 0) return '';   // sin categorías → no dibujamos nada

  const etiquetas = lista.map(c => `<span class="categoria">${escapar(c)}</span>`);
  return '<div class="categorias">' + etiquetas.join('') + '</div>';
}

// Miniatura del producto. Si no tiene img_url, dibujamos un cuadro con
// la primera letra del nombre para que todas las filas queden alineadas.
// loading="lazy": el navegador solo descarga la imagen cuando va a verse
function mostrarImagen(producto) {
  if (!producto.img_url) {
    return `<div class="producto-img sin-imagen">${escapar(producto.nombre.charAt(0).toUpperCase())}</div>`;
  }
  return `<img class="producto-img" src="${escapar(producto.img_url)}" alt="${escapar(producto.nombre)}" loading="lazy">`;
}

// Dibuja una lista de productos dentro de un contenedor.
// La usan DOS partes: la lista completa y la pestaña Buscar.
function mostrarProductos(lista, contenedor) {

  if (lista.length === 0) {
    contenedor.innerHTML = '<p class="vacio">No hay productos todavía.</p>';
    return;
  }

  // map() es SINCRÓNICO — por eso NO lleva await. "await" es solo
  // para lo que viaja por la red (la consulta a Supabase).
  // Todo texto que viene de la base pasa por escapar() antes de ir a innerHTML
  const items = lista.map(producto => `
    <li class="producto">
      ${mostrarImagen(producto)}
      <div class="producto-info">
        <div class="producto-cabecera">
          <strong><span class="producto-id">#${producto.id}</span> ${escapar(producto.nombre)}</strong>
          <span class="precio">${formatoPrecio.format(producto.precio)}</span>
        </div>
        <p class="descripcion">${escapar(producto.descripcion) || 'Sin descripción'}</p>
        ${mostrarCategorias(producto.categorias)}
        <div class="producto-pie">
          <span class="estado ${producto.disponible ? 'si' : 'no'}">${producto.disponible ? 'Disponible' : 'No disponible'}</span>
          <span>Unidades <b>${producto.unidades ?? 0}</b></span>
        </div>
      </div>
    </li>
  `);
  // ↑ "|| 'Sin descripción'": si la descripción viene vacía o null,
  //   mostramos ese texto en vez de dejar el espacio en blanco

  // join('') une todos los <li> en un solo texto, sin comas entre ellos
  contenedor.innerHTML = '<ul class="lista-productos">' + items.join('') + '</ul>';
  arreglarImagenesRotas(contenedor);
}

// Si una URL está rota (404, link mal copiado), el <img> dispara "error".
// Lo cambiamos por el mismo cuadro con la inicial, en vez de dejar el
// ícono de imagen rota. Las imágenes cargan DESPUÉS de dibujarse el HTML,
// así que el listener alcanza a quedar puesto antes de que falle alguna.
// La usan el catálogo, Buscar, la vista previa y el registro de eliminados.
function arreglarImagenesRotas(contenedor) {
  contenedor.querySelectorAll('img.producto-img').forEach(img => {
    img.addEventListener('error', () => {
      const cuadro = document.createElement('div');
      cuadro.className = 'producto-img sin-imagen';
      cuadro.textContent = img.alt.charAt(0).toUpperCase();
      img.replaceWith(cuadro);
    });
  });
}

/* ============================================================
   Datos compartidos — UNA consulta alimenta toda la página
   ============================================================ */

// La última lista que llegó de Supabase. La usan la lista de la izquierda,
// el JSON y los selects de Modificar/Eliminar, así todos muestran lo mismo.
let productosCargados = [];

const resultado = document.getElementById('resultado');
const codigoJson = document.querySelector('#json-productos code');

// Vuelve a pedir los productos y redibuja TODO lo que depende de ellos.
// Se llama al abrir la página, con "Traer productos" y después de cada
// operación del CRUD: así nunca ves datos viejos.
async function refrescarDatos() {
  // listarProductos() (datos.js) ya los trae ordenados por id
  const lista = await listarProductos();

  // null = hubo un error (el detalle lo imprime listarProductos en la consola)
  if (lista === null) {
    resultado.textContent = 'Error al traer los productos. Revisa la consola (F12).';
    return;
  }

  productosCargados = lista;
  mostrarProductos(lista, resultado);
  actualizarResumen(lista);

  // JSON.stringify convierte el array en TEXTO con formato JSON.
  // (null = no filtramos propiedades, 2 = sangría de 2 espacios)
  // textContent (no innerHTML): muestra el texto tal cual
  codigoJson.textContent = JSON.stringify(lista, null, 2);

  actualizarSelectModificar();
  actualizarSelectEliminar();
}

// Llena los 3 indicadores de arriba a partir de la lista.
function actualizarResumen(lista) {
  // reduce() recorre el array acumulando un valor: arranca en 0 y a cada
  // producto le suma precio × unidades. Es la forma de "sumar un array"
  const valor = lista.reduce((suma, p) => suma + p.precio * (p.unidades ?? 0), 0);

  // filter() deja solo los disponibles; .length cuenta cuántos quedaron
  const disponibles = lista.filter(p => p.disponible).length;

  document.getElementById('stat-valor').textContent = formatoPrecio.format(valor);
  document.getElementById('stat-total').textContent = lista.length;
  document.getElementById('stat-disponibles').textContent = disponibles + ' / ' + lista.length;
}

// --- 4.4 Paso 5: botón "Traer productos" ---
const btnTraer = document.getElementById('btn-traer');

const seccionCatalogo = document.getElementById('seccion-catalogo');
const btnTraerTexto = document.getElementById('btn-traer-texto');

// Los datos se cargan solos al abrir la página (los necesitan los
// indicadores y los selects), pero el catálogo solo se MUESTRA con este
// botón. Funciona como interruptor: si está escondido lo trae, y si ya
// se ve, lo oculta.
btnTraer.addEventListener('click', async () => {

  if (!seccionCatalogo.hidden) {
    seccionCatalogo.hidden = true;
    btnTraer.setAttribute('aria-expanded', 'false');
    btnTraerTexto.textContent = 'Traer productos';
    return;
  }

  // Al abrirlo pedimos los productos otra vez, por si alguien cambió
  // algo en Supabase desde otro lado
  btnTraer.disabled = true;
  await refrescarDatos();
  btnTraer.disabled = false;

  seccionCatalogo.hidden = false;
  btnTraer.setAttribute('aria-expanded', 'true');   // el CSS cambia el ícono con esto
  btnTraerTexto.textContent = 'Ocultar productos';
});

/* ============================================================
   Selects con buscador (Modificar y Eliminar)
   ============================================================ */
const formModificar = document.getElementById('form-modificar');
const selectProducto = document.getElementById('select-producto');
const camposModificar = document.getElementById('campos-modificar');
const filtroModificar = document.getElementById('filtro-modificar');

const formEliminar = document.getElementById('form-eliminar');
const selectEliminar = document.getElementById('select-eliminar');
const filtroEliminar = document.getElementById('filtro-eliminar');

// Llena un <select> solo con los productos que coinciden con su buscador.
// Filtra en el navegador sobre productosCargados: NO consulta a
// Supabase en cada tecla, porque la lista ya la tenemos en memoria.
function llenarSelect(select, filtro) {
  const elegidoAntes = select.value;   // para no perder lo que estaba elegido
  const texto = normalizar(filtro.value.trim());

  // coincide si el nombre CONTIENE el texto, o si el texto es el id exacto
  // ('' está contenido en cualquier texto → sin filtro salen todos)
  const lista = productosCargados.filter(p =>
    normalizar(p.nombre).includes(texto) || String(p.id) === texto
  );

  const opciones = lista.map(p =>
    `<option value="${p.id}">#${p.id} — ${escapar(p.nombre)}</option>`
  );

  // la primera opción con value="" obliga a elegir: "required" no deja
  // enviar el form mientras el select esté en ella
  const primera = lista.length === 0
    ? 'Sin resultados'
    : 'Elige un producto (' + lista.length + ')';
  select.innerHTML = `<option value="">${primera}</option>` + opciones.join('');

  // Al reescribir innerHTML el select vuelve a la primera opción.
  // Si el filtro deja UN solo producto, lo elegimos; si no, recuperamos
  // el que estaba elegido (si sigue en la lista)
  if (texto !== '' && lista.length === 1) {
    select.value = lista[0].id;
  } else if (lista.some(p => String(p.id) === elegidoAntes)) {
    select.value = elegidoAntes;
  }
}

// Igual que llenarSelect, pero si el producto elegido cambió, dispara
// "change" para que el formulario se rellene (o se vacíe).
// Cambiar select.value desde JS NO dispara "change" por sí solo.
function actualizarSelectModificar() {
  const antes = selectProducto.value;
  llenarSelect(selectProducto, filtroModificar);
  if (selectProducto.value !== antes) selectProducto.dispatchEvent(new Event('change'));
}

// "input" se dispara en CADA tecla (a diferencia de "change", que espera
// a que salgas del campo): por eso la lista se filtra mientras escribes
filtroModificar.addEventListener('input', actualizarSelectModificar);
filtroEliminar.addEventListener('input', actualizarSelectEliminar);

// En Eliminar, después de rellenar el select siempre redibujamos la vista
// previa: el filtro puede haber elegido un producto solo (si quedó uno) o
// haber quitado el que estaba elegido
function actualizarSelectEliminar() {
  llenarSelect(selectEliminar, filtroEliminar);
  mostrarVistaEliminar();
}

// Muestra el producto elegido en Eliminar para revisarlo antes de borrarlo.
// Reutiliza mostrarProductos(): le pasamos un array de UN producto
function mostrarVistaEliminar() {
  const vista = document.getElementById('vista-eliminar');
  const elegido = productosCargados.find(p => p.id === Number(selectEliminar.value));

  vista.hidden = !elegido;   // sin producto elegido, no hay nada que mostrar
  if (elegido) mostrarProductos([elegido], document.getElementById('vista-eliminar-producto'));
}

// Elegir a mano en el select también actualiza la vista previa
selectEliminar.addEventListener('change', mostrarVistaEliminar);

// Enter dentro de un input de un <form> lo ENVÍA. En el buscador no
// queremos eso (en Eliminar, borraría el producto), así que lo bloqueamos
[filtroModificar, filtroEliminar].forEach(filtro => {
  filtro.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') event.preventDefault();
  });
});

/* ============================================================
   1. Agregar → agregarProducto() de datos.js (5.1 CREATE)
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
  const campos = new FormData(form);

  // Todo lo que viene de un input llega como TEXTO ("12345"),
  // por eso convertimos cada campo al tipo que espera la tabla.
  const nuevoProducto = {
    nombre: campos.get('nombre').trim(),
    precio: Number(campos.get('precio')),        // "12345" → 12345
    descripcion: campos.get('descripcion').trim(),
    descuento: Number(campos.get('descuento')),  // "0.05"  → 0.05
    // un checkbox sin marcar no aparece en FormData → get() da null.
    // Comparar con !== null lo convierte en true/false.
    disponible: campos.get('disponible') !== null,
    categorias: textoACategorias(campos.get('categorias')),
    unidades: Number(campos.get('unidades')),
    img_url: campos.get('img_url').trim(),
    // sin id ni created_at: Supabase los genera
  };

  ocupado(form, true);
  notificar('Guardando...');

  // devuelve la fila creada (con su id nuevo), o null si falló
  const respuesta = await agregarProducto(nuevoProducto);

  ocupado(form, false);

  if (respuesta) {
    notificar('✓ Producto #' + respuesta.id + ' "' + respuesta.nombre + '" agregado.', 'exito');
    form.reset();          // limpia el formulario para agregar otro
    refrescarDatos();      // el nuevo aparece en la lista y en los selects
  } else {
    // el detalle del error lo imprime agregarProducto() en la consola
    notificar('No se pudo agregar el producto. Revisa la consola (F12).', 'error');
  }
});

/* ============================================================
   2. Buscar → buscarProductoPorId() / buscarProductosPorNombre()
      de datos.js (5.2 READ)
   ============================================================ */
const formBuscar = document.getElementById('form-buscar');
const inputBuscar = document.getElementById('input-buscar');
const mensajeBusqueda = document.getElementById('mensaje-busqueda');
const resultadoBusqueda = document.getElementById('resultado-busqueda');

// Es un <form>: Enter y el botón disparan el mismo "submit"
formBuscar.addEventListener('submit', async (event) => {
  event.preventDefault();

  const texto = inputBuscar.value.trim();

  if (texto === '') {
    mensajeBusqueda.textContent = 'Escribe un id o parte del nombre.';
    resultadoBusqueda.innerHTML = '';
    return;
  }

  ocupado(formBuscar, true);

  // Un solo input para los dos tipos de búsqueda: decidimos según lo escrito.
  // /^\d+$/ = "solo dígitos de principio a fin": "3" sí; "3a" o "mouse" no
  let productos;
  if (/^\d+$/.test(texto)) {
    // buscarProductoPorId() devuelve UN objeto o null; lo pasamos a array
    // para tratar los dos casos igual (mostrarProductos espera un array)
    const producto = await buscarProductoPorId(Number(texto));
    productos = producto ? [producto] : [];
  } else {
    // ilike: no distingue mayúsculas y encuentra coincidencias parciales,
    // pero SÍ distingue tildes ("lampara" no encuentra "Lámpara")
    productos = await buscarProductosPorNombre(texto);
  }

  ocupado(formBuscar, false);

  if (productos.length === 0) {
    mensajeBusqueda.textContent = 'No hay productos que coincidan con "' + texto + '".';
    resultadoBusqueda.innerHTML = '';
    return;
  }

  mensajeBusqueda.textContent = productos.length + ' resultado(s) para "' + texto + '":';
  mostrarProductos(productos, resultadoBusqueda);
});

/* ============================================================
   3. Modificar → modificarProducto() de datos.js (5.3 UPDATE)
   ============================================================ */

// El producto que está elegido en el select, o undefined si no hay ninguno.
// El value del select es TEXTO ("3"); el id de la tabla es número.
function productoElegido() {
  return productosCargados.find(p => p.id === Number(selectProducto.value));
}

// Al elegir un producto, copiamos sus valores actuales a los campos:
// así ves qué tiene hoy y solo editas lo que quieres cambiar
selectProducto.addEventListener('change', () => {
  const elegido = productoElegido();

  // Sin producto elegido, los campos quedan bloqueados: un <fieldset>
  // con "disabled" desactiva TODO lo que tiene adentro (incluido el botón)
  camposModificar.disabled = !elegido;

  // .elements['nombre'] = el campo con name="nombre" dentro del form
  const campos = formModificar.elements;
  campos['nombre'].value = elegido ? elegido.nombre : '';
  campos['descripcion'].value = elegido ? (elegido.descripcion || '') : '';
  campos['precio'].value = elegido ? elegido.precio : '';
  campos['unidades'].value = elegido ? elegido.unidades : '';
  // ["hogar", "ofertas"] → "hogar, ofertas": join() hace lo contrario de split()
  campos['categorias'].value = elegido ? (elegido.categorias ?? []).join(', ') : '';
  // String(true) → "true": coincide con el value de las <option>
  campos['disponible'].value = elegido ? String(elegido.disponible) : 'true';
});

formModificar.addEventListener('submit', async (event) => {
  event.preventDefault();

  const elegido = productoElegido();
  if (!elegido) return;   // no debería pasar: el select es "required"

  const campos = new FormData(formModificar);

  // Comparamos cada campo con el valor ORIGINAL del producto y en
  // "cambios" ponemos solo lo que es distinto. update() toca únicamente
  // las propiedades que vengan en el objeto.
  const cambios = {};

  const nombre = campos.get('nombre').trim();
  if (nombre === '') {
    notificar('El nombre no puede quedar vacío.', 'error');
    return;
  }
  if (nombre !== elegido.nombre) cambios.nombre = nombre;

  // Si la borras a propósito, la guardamos como null ("sin descripción")
  const descripcion = campos.get('descripcion').trim();
  if (descripcion !== (elegido.descripcion || '')) {
    cambios.descripcion = descripcion === '' ? null : descripcion;
  }

  // precio y unidades son "required": nunca llegan vacíos
  const precio = Number(campos.get('precio'));
  if (precio !== elegido.precio) cambios.precio = precio;

  const unidades = Number(campos.get('unidades'));
  if (unidades !== elegido.unidades) cambios.unidades = unidades;

  // Dos arrays NUNCA son === aunque tengan lo mismo (se comparan como
  // objetos distintos), por eso comparamos su versión en texto con join().
  // Si borras todas, se guarda [] (sin categorías).
  const categorias = textoACategorias(campos.get('categorias'));
  if (categorias.join(',') !== (elegido.categorias ?? []).join(',')) {
    cambios.categorias = categorias;
  }

  // el <select> da el TEXTO "true" o "false"; comparar con 'true'
  // lo convierte en el booleano que espera la columna
  const disponible = campos.get('disponible') === 'true';
  if (disponible !== elegido.disponible) cambios.disponible = disponible;

  // Object.keys(cambios) es el array de propiedades: si está vacío,
  // no hay nada que guardar y no molestamos a Supabase
  if (Object.keys(cambios).length === 0) {
    notificar('No hiciste ningún cambio.', 'info');
    return;
  }

  ocupado(formModificar, true);
  notificar('Guardando cambios...');

  // devuelve la fila ya actualizada, o null si falló
  const actualizado = await modificarProducto(elegido.id, cambios);

  ocupado(formModificar, false);

  if (actualizado) {
    notificar('✓ Producto #' + elegido.id + ' "' + actualizado.nombre + '" modificado correctamente.', 'exito');

    // Limpiamos el buscador (si cambiaste el nombre, quizá ya no coincide)
    // y recargamos: el producto sigue elegido y el form muestra sus
    // valores NUEVOS, para que veas lo que quedó guardado
    filtroModificar.value = '';
    await refrescarDatos();
    selectProducto.dispatchEvent(new Event('change'));
  } else {
    notificar('No se pudo modificar el producto #' + elegido.id + '. Revisa la consola (F12).', 'error');
  }
});

/* ============================================================
   4. Eliminar → eliminarProducto() de datos.js (5.4 DELETE)
   ============================================================ */
formEliminar.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = Number(selectEliminar.value);

  // selectedOptions[0] es la <option> elegida; su texto es "#3 — Lámpara..."
  const textoProducto = selectEliminar.selectedOptions[0].textContent;

  // Guardamos sus datos AHORA: después de borrarlo ya no estará en
  // productosCargados, y los necesitamos para el registro
  const producto = productosCargados.find(p => p.id === id);

  // DELETE no se puede deshacer: confirm() abre una ventanita del
  // navegador con Aceptar/Cancelar y devuelve true o false
  if (!confirm('¿Seguro que quieres eliminar ' + textoProducto + '? No se puede deshacer.')) {
    return;
  }

  ocupado(formEliminar, true);
  notificar('Eliminando...');

  // true solo si Supabase borró la fila de verdad (ver datos.js)
  const borrado = await eliminarProducto(id);

  ocupado(formEliminar, false);

  if (borrado) {
    notificar('✓ Producto ' + textoProducto + ' eliminado.', 'exito');
    agregarAlRegistro(producto);
    formEliminar.reset();   // limpia el buscador para que vuelva la lista completa
    refrescarDatos();       // desaparece de la lista y de los dos selects
  } else {
    notificar('No se pudo eliminar el producto #' + id + '. Revisa la consola (F12).', 'error');
  }
});

/* ============================================================
   Registro de eliminados (se guarda en localStorage)
   ============================================================ */

// localStorage guarda texto en el navegador y sobrevive a recargar la
// página. Solo lo ve ESTE navegador: en otro computador el registro
// estará vacío. Para compartirlo habría que guardarlo en Supabase.
const CLAVE_REGISTRO = 'registro-eliminados';
const MAX_REGISTRO = 50;   // para que no crezca sin límite

// "29 oct 2026, 2:35 p. m." — dateStyle y timeStyle eligen el formato
const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

const listaRegistro = document.getElementById('lista-registro');
const btnLimpiarRegistro = document.getElementById('btn-limpiar-registro');

// try/catch: localStorage puede fallar (modo incógnito, almacenamiento
// bloqueado) o tener texto que no es JSON válido. En esos casos
// trabajamos con un registro vacío en vez de romper la página.
function leerRegistro() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_REGISTRO)) ?? [];
  } catch {
    return [];
  }
}

function guardarRegistro(registro) {
  try {
    // localStorage solo guarda TEXTO: JSON.stringify convierte el array
    localStorage.setItem(CLAVE_REGISTRO, JSON.stringify(registro));
  } catch {
    // si no se puede guardar, el registro solo dura hasta recargar
  }
}

function agregarAlRegistro(producto) {
  const registro = leerRegistro();

  // unshift() agrega al INICIO del array: lo más reciente queda arriba
  registro.unshift({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    img_url: producto.img_url,
    fecha: new Date().toISOString(),   // "2026-10-29T19:35:00.000Z": texto que se puede guardar
  });

  // slice(0, 50) se queda con los primeros 50 y descarta los más viejos
  guardarRegistro(registro.slice(0, MAX_REGISTRO));
  mostrarRegistro();
}

function mostrarRegistro() {
  const registro = leerRegistro();

  btnLimpiarRegistro.hidden = registro.length === 0;

  if (registro.length === 0) {
    listaRegistro.innerHTML = '<li class="vacio">Todavía no has eliminado productos.</li>';
    return;
  }

  // new Date(texto) vuelve a convertir el texto guardado en una fecha
  listaRegistro.innerHTML = registro.map(r => `
    <li class="registro-item">
      ${mostrarImagen(r)}
      <div class="registro-info">
        <strong><span class="producto-id">#${r.id}</span> ${escapar(r.nombre)}</strong>
        <span class="registro-fecha">${formatoFecha.format(new Date(r.fecha))}</span>
      </div>
      <span class="registro-precio">${formatoPrecio.format(r.precio)}</span>
    </li>
  `).join('');

  arreglarImagenesRotas(listaRegistro);
}

btnLimpiarRegistro.addEventListener('click', () => {
  // Solo borra el historial de esta página; los productos ya estaban borrados
  if (!confirm('¿Borrar el registro de productos eliminados?')) return;
  guardarRegistro([]);
  mostrarRegistro();
});

/* ============================================================
   Pestañas del CRUD
   ============================================================ */
const tabs = document.querySelectorAll('.tab');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Primero apagamos TODAS las pestañas y escondemos todos los paneles...
    tabs.forEach(t => {
      t.classList.remove('activa');
      t.setAttribute('aria-selected', 'false');
      document.getElementById(t.dataset.panel).hidden = true;
    });

    // ...y después prendemos solo la que recibió el clic.
    // dataset.panel lee el atributo data-panel del botón
    tab.classList.add('activa');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(tab.dataset.panel).hidden = false;
  });
});

/* ============================================================
   Al abrir la página
   ============================================================ */
// Va al FINAL: refrescarDatos() usa las const de arriba (selectProducto,
// filtroEliminar...), y una const no se puede usar antes de su línea
refrescarDatos();
mostrarRegistro();   // lo que quedó guardado de visitas anteriores
