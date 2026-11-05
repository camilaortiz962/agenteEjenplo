async function registrarCliente(nombre, correo, contrasena) {

  // db.auth.signUp() NO toca ninguna tabla tuya todavía — habla directo con
  // el sistema de autenticación interno de Supabase (algo así como una
  // tabla especial, auth.users, que tú no administras a mano). Le mandas
  // correo y contraseña, y Supabase por detrás: valida el formato del
  // correo, guarda la contraseña de forma segura (nunca en texto plano),
  // y crea un identificador único nuevo (un uuid) para esta persona.
  //
  // El resultado llega en dos partes, igual que en todas las llamadas a
  // Supabase que ya conoces (data / error):
  //   - data.user   → los datos del usuario recién creado. data.user.id
  //                   es el uuid real — EL MISMO que vamos a usar como id
  //                   en clientes_practica, dos líneas más abajo.
  //   - data.session → si tu proyecto exige confirmar el correo antes de
  //                   dejar entrar (ver guía, sección 7), esto llega en
  //                   null: el usuario ya existe, pero todavía no hay
  //                   sesión iniciada hasta que confirme.
  const { data, error } = await db.auth.signUp({
    email: correo,
    password: contrasena,
  });

  // Mismo patrón de "revisar error antes de seguir" que ya usaste en el
  // CRUD de productos — si signUp() falló (correo repetido, contraseña
  // muy corta, etc.), ni siquiera intentamos el segundo paso.
  if (error) {
    console.log('Error al registrar:', error);
    return null;
  }

  // Ahora sí tocamos una tabla tuya: clientes_practica. Este insert() es
  // igual al que ya usaste en agregarProducto() — la única diferencia es
  // que aquí SÍ mandamos el id a mano (data.user.id), en vez de dejar que
  // Supabase lo autogenere, porque este id tiene que coincidir exactamente
  // con el que Auth le acaba de asignar al usuario.
  const { data: cliente, error: errorCliente } = await db
    .from('clientes_practica')
    .insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }])
    .select();

  if (errorCliente) {
    console.log('Error al crear el perfil:', errorCliente);
    return null;
  }

  return cliente[0];
}

// 'submit' es el evento que dispara un <form> cuando alguien hace clic en
// su botón de tipo submit (o presiona Enter dentro de un campo). Por
// defecto, ese evento hace que el navegador RECARGUE la página entera —
// comportamiento heredado de cuando los formularios mandaban sus datos a
// otra página de servidor, décadas atrás. Como aquí todo lo manejamos con
// JavaScript (sin recargar nada), hay que apagar ese comportamiento a
// propósito.
document.getElementById('form-registro').addEventListener('submit', async (event) => {

  // event.preventDefault() le dice al navegador "no hagas lo que harías
  // normalmente con este evento" — en este caso, no recargues la página.
  // Sin esta línea, la página se refrescaría apenas se hiciera clic en
  // "Crear cuenta", y perderías cualquier mensaje que fueras a mostrar.
  event.preventDefault();

  // event.target es el elemento que disparó el evento — en un 'submit',
  // siempre es el propio <form>. Lo guardamos en una variable para poder
  // usarlo más abajo (form.reset()) sin tener que volver a buscarlo.
  const form = event.target;

  const cliente = await registrarCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value
  );

  if (cliente) {
    document.getElementById('estado-sesion').textContent =
      'Cuenta creada. Ahora inicia sesión con ese correo y contraseña.';
    form.reset(); // vacía los 3 campos del formulario, para la próxima persona
  } else {
    document.getElementById('estado-sesion').textContent =
      'No se pudo crear la cuenta. Revisa la consola.';
  }
});

async function iniciarSesion(correo, contrasena) {

  // db.auth.signInWithPassword() es para alguien que YA se registró antes
  // (sección 4.1) — no crea ningún usuario nuevo, solo verifica que el
  // correo y la contraseña coincidan con uno que ya existe en Auth.
  //
  // Lo importante pasa "por detrás", sin que se vea en este código: si la
  // verificación sale bien, el cliente de Supabase (la variable db, la
  // misma de siempre) GUARDA la sesión internamente — normalmente en el
  // almacenamiento del navegador — y, desde este momento, la adjunta sola
  // a cada petición futura que hagas con db, sea a productos_practica, a
  // clientes_practica o a cualquier otra tabla. No hay que "pasarle" el
  // usuario a mano a ninguna otra función.
  const { data, error } = await db.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  // Devolvemos un objeto con DOS partes (igual que Supabase con data/error):
  // así el listener sabe si salió bien Y, si falló, el motivo exacto.
  if (error) {
    console.log('Error al iniciar sesión:', error);
    return { usuario: null, error };
  }

  // Aquí data.user también trae el id real del usuario — el mismo valor
  // que auth.uid() va a devolver dentro de cualquier política de RLS
  // mientras esta sesión siga activa.
  return { usuario: data.user, error: null };
}

// Traduce los códigos de error más comunes de Supabase Auth a un mensaje
// que se entienda. error.code es un texto fijo que manda Supabase.
function motivoError(error) {
  if (error.code === 'email_not_confirmed') {
    return 'Tu correo no está confirmado. Abre el enlace que te llegó al correo.';
  }
  if (error.code === 'invalid_credentials') {
    return 'Correo o contraseña incorrectos (o la cuenta no existe en este proyecto).';
  }
  // cualquier otro caso: mostramos el mensaje original de Supabase
  return error.message;
}

// Escribe el mensaje de arriba y le pone color según el resultado.
// "tipo" es 'exito' o 'error'; las clases las pinta el <style> de cliente.html
function mostrarMensaje(texto, tipo) {
  const estado = document.getElementById('estado-sesion');
  estado.textContent = texto;
  estado.className = tipo;
}

// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.target; // el propio <form>, guardado para usar después

  mostrarMensaje('Iniciando sesión...', '');

  // { usuario, error } saca las dos partes del objeto que devuelve iniciarSesion()
  const { usuario, error } = await iniciarSesion(
    document.getElementById('login-correo').value.trim(),
    document.getElementById('login-password').value
  );

  if (usuario) {
    form.reset();
    // El correo ya viene en "usuario": lo mostramos de una vez, sin
    // tener que volver a preguntarle a Supabase
    mostrarMensaje(`✓ Sesión iniciada como ${usuario.email}`, 'exito');
    actualizarVista(usuario);
    cargarPerfil(usuario.id);   // lee sus datos y llena el formulario "Actualizar datos"
  } else {
    mostrarMensaje('No se pudo iniciar sesión: ' + motivoError(error), 'error');
  }
});

/* ============================================================
   Actualizar datos: leer el perfil (SELECT) y actualizarlo (UPDATE)
   ============================================================ */
const panelPerfil = document.getElementById('panel-perfil');
const formPerfil = document.getElementById('form-perfil');
const btnLogout = document.getElementById('btn-logout');

// La fila de clientes_practica tal como llegó de Supabase. La guardamos
// para comparar al guardar: si no cambiaste nada, no molestamos a Supabase
let perfilActual = null;

/* --- Sidebar --- */
const tabs = document.querySelectorAll('.tab[data-panel]');

// Muestra el panel del ítem elegido y esconde los demás.
// Mismo patrón que las pestañas del CRUD: primero se apagan TODOS,
// después se prende solo el elegido
function activarTab(idPanel) {
  tabs.forEach(tab => {
    const activa = tab.dataset.panel === idPanel;
    tab.classList.toggle('activa', activa);   // toggle(clase, true/false) la pone o la quita
    tab.setAttribute('aria-selected', String(activa));
    document.getElementById(tab.dataset.panel).hidden = !activa;
  });
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => activarTab(tab.dataset.panel));
});

// Con sesión: en la sidebar aparecen "Actualizar datos" y "Cerrar sesión"
// y se esconde "Acceso". Sin sesión: al revés.
// "!!" convierte el valor en true/false
function actualizarVista(usuario) {
  document.getElementById('tab-acceso').hidden = !!usuario;
  document.getElementById('tab-perfil').hidden = !usuario;
  btnLogout.hidden = !usuario;
  document.getElementById('sidebar-usuario').textContent = usuario ? usuario.email : 'Sin sesión';
  document.querySelector('.sidebar-pie').classList.toggle('conectado', !!usuario);   // punto verde o gris

  // abre directamente el panel que corresponde
  activarTab(usuario ? 'panel-perfil' : 'panel-acceso');
}

// Columnas de clientes_practica que el cliente SÍ puede cambiar.
// correo y rol quedan fuera a propósito: se muestran, pero nunca se envían.
// Para agregar otra columna editable: súmala aquí y crea su input
// con id="perfil-<columna>" en cliente.html
const CAMPOS_EDITABLES = ['nombre', 'telefono', 'direccion'];

// Copia los datos del perfil a los campos del formulario.
// "?? ''": si la columna viene null (ej. aún no tiene teléfono), el campo
// queda vacío en vez de mostrar el texto "null"
function llenarFormularioPerfil(perfil) {
  for (const campo of [...CAMPOS_EDITABLES, 'correo', 'rol']) {
    const input = document.getElementById('perfil-' + campo);

    // "campo in perfil" revisa si la fila que llegó de Supabase TIENE esa
    // propiedad. select('*') trae todas las columnas que la API conoce: si
    // una no vino, la tabla no la tiene (o la API todavía no la ve).
    // En vez de dejar que el update falle, desactivamos ese campo.
    if (!(campo in perfil)) {
      input.value = '';
      input.disabled = true;
      input.placeholder = 'Esta columna no existe en clientes_practica';
      console.log('La columna "' + campo + '" no llegó al leer el perfil.');
      continue;   // pasa al siguiente campo del for
    }

    input.disabled = false;
    input.value = perfil[campo] ?? '';
  }
}

// PASO 1 — LEER: trae la fila del cliente que inició sesión.
// Se busca por el id de Auth porque registrarCliente() guardó la fila con
// ese MISMO id (id: data.user.id). Así cada quien encuentra solo la suya.
async function cargarPerfil(idUsuario) {
  const { data, error } = await db
    .from('clientes_practica')
    .select('*')
    .eq('id', idUsuario)
    .maybeSingle();   // un objeto, o null si no hay fila (single() lo trataría como error)

  if (error) {
    console.log('Error al leer el perfil:', error);
    mostrarMensaje('No se pudieron leer tus datos: ' + error.message, 'error');
    return;
  }

  // Sin error pero sin fila: o el perfil no se creó al registrarse, o RLS
  // no deja leerlo (le falta una política SELECT para auth.uid() = id)
  if (!data) {
    mostrarMensaje('Iniciaste sesión, pero no se encontró tu perfil en clientes_practica. Revisa la política RLS de SELECT.', 'error');
    panelPerfil.hidden = true;
    return;
  }

  // PASO 2 — MOSTRAR: con los datos ya leídos, llenamos los campos
  perfilActual = data;
  llenarFormularioPerfil(data);
}

// PASO 3 — ACTUALIZAR: guarda lo que cambiaste en el formulario
formPerfil.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!perfilActual) return;

  // Mismo criterio que en Modificar del CRUD: solo mandamos lo que cambió.
  // Recorremos SOLO las columnas editables: así correo y rol nunca viajan
  // en el update, aunque alguien quite el "readonly" desde el navegador
  const cambios = {};
  for (const campo of CAMPOS_EDITABLES) {
    // Columna que no existe en la tabla: no la mandamos, o Supabase
    // rechazaría el update COMPLETO (también los campos que sí existen)
    if (!(campo in perfilActual)) continue;

    const valor = document.getElementById('perfil-' + campo).value.trim();

    // String(): si la columna fuera numérica (ej. telefono como número),
    // compararíamos 3001234567 con "3001234567" y siempre serían distintos
    const original = String(perfilActual[campo] ?? '');

    // Si borras un campo a propósito, se guarda null ("sin dato").
    // El nombre no puede quedar vacío: su input es "required"
    if (valor !== original) cambios[campo] = valor === '' ? null : valor;
  }

  if (Object.keys(cambios).length === 0) {
    mostrarMensaje('No hiciste ningún cambio.', '');
    return;
  }

  const boton = formPerfil.querySelector('button[type="submit"]');
  boton.disabled = true;   // evita guardar dos veces con doble clic
  mostrarMensaje('Guardando tus datos...', '');

  // .select() devuelve la fila ya actualizada. Si RLS no permite el UPDATE,
  // Supabase NO da error: actualiza 0 filas y data llega en null
  const { data, error } = await db
    .from('clientes_practica')
    .update(cambios)
    .eq('id', perfilActual.id)
    .select()
    .maybeSingle();

  boton.disabled = false;

  if (error) {
    console.log('Error al actualizar el perfil:', error);
    mostrarMensaje('No se pudieron guardar tus datos: ' + error.message, 'error');
    return;
  }
  if (!data) {
    mostrarMensaje('No se guardó nada: la política RLS no permite el UPDATE de tu perfil.', 'error');
    return;
  }

  // Mostramos lo que quedó guardado en Supabase, no lo que se escribió
  perfilActual = data;
  llenarFormularioPerfil(data);
  mostrarMensaje(`✓ Datos actualizados, ${data.nombre}.`, 'exito');
});

async function mostrarEstadoSesion() {
  const { data } = await db.auth.getUser();

  actualizarVista(data.user);

  if (data.user) {
    mostrarMensaje(`✓ Sesión iniciada como ${data.user.email}`, 'exito');
    cargarPerfil(data.user.id);
  } else {
    perfilActual = null;
    mostrarMensaje('No has iniciado sesión.', '');
  }
}

document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesion();
});

// Al cargar la página, revisa si ya había una sesión activa.
// Va al final: mostrarEstadoSesion() usa las const de arriba
mostrarEstadoSesion();

