/* gestion.js — conecta las funciones CRUD (ahora async) con los formularios.
 * El HTML no cambió respecto a la semana 7; lo que cambia es que cada
 * listener es "async" y usa "await" antes de llamar a la función CRUD.
 */

const $ = id => document.getElementById(id);

function mostrarMensaje(contenedor, texto, tipo) {
  contenedor.className = 'mensaje ' + tipo;   // 'exito' | 'error' | 'info'
  contenedor.innerHTML = texto;
}

// Escapa texto antes de meterlo en innerHTML
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "Vocal, Baile , " → ["Vocal", "Baile"]
function aLista(texto) {
  return texto.split(',').map(s => s.trim()).filter(s => s !== '');
}

function tarjeta(h) {
  const poderes = Array.isArray(h.poder) ? h.poder : [];
  return `
    <article class="heroe ${h.activo ? '' : 'inactivo'}">
      ${h.Image ? `<img src="${esc(h.Image)}" alt="" onerror="this.remove()">` : ''}
      <div>
        <h3><span class="id">#${h.id}</span> ${esc(h.nombre)}</h3>
        <p class="meta">${esc(h.bando)} · ${esc(h.universo)} · ${h.edad ?? '–'} años · ${h.altura ?? '–'} m · fuerza ${h.nivelDeFuerza ?? '–'}</p>
        <p class="tags">${poderes.map(p => `<span>${esc(p)}</span>`).join('')}</p>
        ${h.activo ? '' : '<p class="meta">Inactivo</p>'}
      </div>
    </article>`;
}

async function pintarLista() {
  $('lista').innerHTML = '<p class="ayuda">Cargando…</p>';
  const heroes = await listarHeroes();
  $('lista').innerHTML = heroes.length
    ? heroes.map(tarjeta).join('')
    : '<p class="ayuda">No hay registros (o hubo un error: revisa la consola).</p>';
}

/* ---------- CREATE ---------- */
$('form-agregar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultado = $('res-agregar');

  // leer inputs (esto no cambia respecto a la semana 7)
  const nombre = $('ag-nombre').value.trim();
  if (!nombre) {
    mostrarMensaje(resultado, '❌ El nombre es obligatorio.', 'error');
    return;
  }
  const datos = {
    nombre,
    universo: $('ag-universo').value.trim() || null,
    bando: $('ag-bando').value.trim() || null,
    edad: $('ag-edad').value === '' ? null : Number($('ag-edad').value),
    altura: $('ag-altura').value === '' ? null : Number($('ag-altura').value),
    nivelDeFuerza: $('ag-fuerza').value === '' ? null : Number($('ag-fuerza').value),
    poder: aLista($('ag-poder').value),
    Image: $('ag-image').value.trim() || null,
    descripcion: $('ag-descripcion').value.trim() || null,
    activo: $('ag-activo').checked
    // sin "id": Postgres lo genera solo
  };

  const nuevo = await agregarHeroe(datos);

  if (!nuevo) {
    mostrarMensaje(resultado, '❌ No se pudo agregar. Revisa la consola.', 'error');
    return;
  }
  mostrarMensaje(resultado, `✅ "${esc(nuevo.nombre)}" agregado con id ${nuevo.id}.`, 'exito');
  $('form-agregar').reset();
  pintarLista();
});

/* ---------- READ ---------- */
$('form-buscar-id').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultado = $('res-buscar');
  const id = Number($('bu-id').value);

  const heroe = await buscarHeroePorId(id);

  if (!heroe) {
    mostrarMensaje(resultado, `❌ No existe un registro con id ${id}.`, 'error');
    return;
  }
  mostrarMensaje(resultado, tarjeta(heroe) + `<p>${esc(heroe.descripcion)}</p>`, 'info');
});

$('form-buscar-nombre').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultado = $('res-buscar');
  const texto = $('bu-nombre').value.trim();

  const encontrados = await buscarHeroesPorNombre(texto);

  if (encontrados.length === 0) {
    mostrarMensaje(resultado, `❌ Ningún nombre contiene "${esc(texto)}".`, 'error');
    return;
  }
  mostrarMensaje(resultado,
    `<p>${encontrados.length} resultado(s):</p>` + encontrados.map(tarjeta).join(''), 'info');
});

/* ---------- UPDATE ---------- */
$('form-modificar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultado = $('res-modificar');
  const id = Number($('mo-id').value);

  // Solo mandamos lo que el usuario llenó: .update() toca únicamente esas columnas
  const cambios = {};
  if ($('mo-nombre').value.trim()) cambios.nombre = $('mo-nombre').value.trim();
  if ($('mo-bando').value.trim())  cambios.bando = $('mo-bando').value.trim();
  if ($('mo-edad').value !== '')   cambios.edad = Number($('mo-edad').value);
  if ($('mo-fuerza').value !== '') cambios.nivelDeFuerza = Number($('mo-fuerza').value);
  if ($('mo-activo').value !== '') cambios.activo = $('mo-activo').value === 'true';
  if ($('mo-poder').value.trim())  cambios.poder = aLista($('mo-poder').value);

  if (Object.keys(cambios).length === 0) {
    mostrarMensaje(resultado, '❌ No escribiste ningún cambio.', 'error');
    return;
  }

  const actualizado = await modificarHeroe(id, cambios);

  if (!actualizado) {
    mostrarMensaje(resultado, `❌ No se pudo modificar el id ${id} (¿existe?).`, 'error');
    return;
  }
  mostrarMensaje(resultado, `✅ "${esc(actualizado.nombre)}" actualizado.`, 'exito');
  $('form-modificar').reset();
  pintarLista();
});

/* ---------- DELETE ---------- */
$('form-eliminar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultado = $('res-eliminar');
  const id = Number($('el-id').value);

  const seElimino = await eliminarHeroe(id);

  if (!seElimino) {
    mostrarMensaje(resultado, `❌ No se pudo eliminar el id ${id} (¿existe?).`, 'error');
    return;
  }
  mostrarMensaje(resultado, `✅ Registro ${id} eliminado.`, 'exito');
  $('form-eliminar').reset();
  pintarLista();
});

$('btn-recargar').addEventListener('click', pintarLista);

// Al abrir la página, traemos los datos desde Supabase
pintarLista();
