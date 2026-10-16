// Datos de las cartas: ahora viven en la tabla "heroes" de Supabase
// (ver heroes.sql), no en este archivo ni en localStorage. Cualquier
// computador que abra el proyecto ve exactamente las mismas cartas.
//
// Este archivo se carga después de supabaseClient.js (que crea "db") y
// antes que Index.js / gestion.js / memory.js, que usan "heroes".

// Tabla en un solo lugar, por si algún día cambia de nombre.
const TABLA_HEROES = "heroes";

// "heroes" arranca vacío: se llena cuando llega la respuesta de Supabase.
// Es "let" porque gestion.js lo reemplaza después de cada cambio.
let heroes = [];

// ---------------------------------------------------------------------
// READ (todos) — antes: el arreglo fijo + heroesCreados − heroesEliminados
// ---------------------------------------------------------------------
async function listarHeroes() {
  const { data, error } = await db
    .from(TABLA_HEROES)
    .select("*")
    .order("id");   // BTS (id 1) siempre primero, igual que antes

  if (error) {
    console.log("Error al listar héroes:", error);
    return [];
  }
  return data;
}

// ---------------------------------------------------------------------
// CREATE — antes: heroes.push(h) + localStorage "heroesCreados"
// ---------------------------------------------------------------------
async function agregarHeroe(datos) {
  const { data, error } = await db
    .from(TABLA_HEROES)
    .insert([datos])   // insert() siempre recibe un ARRAY de objetos
    .select();         // devuelve la fila creada, ya con su id

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }
  return data[0];
}

// ---------------------------------------------------------------------
// READ (uno / varios) — antes: heroes.find() / heroes.filter()
// ---------------------------------------------------------------------
async function buscarHeroePorId(id) {
  const { data, error } = await db
    .from(TABLA_HEROES)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;   // también entra aquí si el id no existe
  return data;
}

async function buscarHeroesPorNombre(texto) {
  const { data, error } = await db
    .from(TABLA_HEROES)
    .select("*")
    .ilike("nombre", `%${texto}%`)   // como toLowerCase().includes(texto)
    .order("id");

  if (error) return [];
  return data;
}

// ---------------------------------------------------------------------
// UPDATE — antes: splice() de la versión vieja + push() de la nueva +
// marcar el nombre viejo en "heroesEliminados"
// ---------------------------------------------------------------------
async function modificarHeroe(id, cambios) {
  const { data, error } = await db
    .from(TABLA_HEROES)
    .update(cambios)   // solo toca las propiedades que vengan en "cambios"
    .eq("id", id)
    .select();

  if (error) {
    console.log("Error al modificar:", error);
    return null;
  }
  return data[0] ?? null;   // id inexistente → data llega vacío ([])
}

// ---------------------------------------------------------------------
// DELETE — antes: splice() + localStorage "heroesEliminados"
// ---------------------------------------------------------------------
async function eliminarHeroe(id) {
  const { error } = await db
    .from(TABLA_HEROES)
    .delete()
    .eq("id", id);

  if (error) console.log("Error al eliminar:", error);
  return !error;   // true si se borró bien
}

// Pide las cartas apenas carga la página. "heroesListos" es una promesa:
// Index.js, gestion.js y memory.js hacen "await heroesListos" antes de
// dibujar, para no pintar un arreglo todavía vacío.
const heroesListos = listarHeroes().then(function(lista) {
  heroes = lista;
  return heroes;
});
