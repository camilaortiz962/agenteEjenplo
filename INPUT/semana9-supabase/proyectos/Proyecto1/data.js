// SEMANA 9 — Los datos de las cartas ya NO viven en este archivo ni en
// localStorage: viven en Supabase, en la tabla "heroes" (el grupo BTS y
// sus 7 integrantes, con los mismos campos que antes + id y created_at).
//
// ANTES (semana 7): "heroes" era un arreglo escrito a mano acá, más lo que
// hubiera en localStorage ("heroesCreados" / "heroesEliminados").
// AHORA: "heroes" arranca vacío y se llena con cargarHeroes(), que le pide
// las filas a Supabase. Como esa consulta viaja por internet, es async.
//
// Este archivo se carga DESPUÉS de supabaseClient.js (que crea "db") y
// ANTES de Index.js / gestion.js / memory.js, que usan "heroes".

let heroes = [];

// READ — todos. Llena la variable global "heroes" y la devuelve.
async function cargarHeroes() {
  const { data, error } = await db
    .from("heroes")
    .select("*")
    .order("id");          // mismo orden de siempre: BTS, RM, Jin, ...

  if (error) {
    console.log("Error al cargar heroes:", error);
    heroes = [];
    return heroes;
  }

  heroes = data;
  return heroes;
}

// READ — por id (antes: heroes.find(h => h.id === id))
async function buscarHeroePorId(id) {
  const { data, error } = await db
    .from("heroes")
    .select("*")
    .eq("id", id)
    .single();             // una sola fila, como objeto

  if (error) return null;
  return data;
}

// READ — por nombre (antes: filter + toLowerCase().includes())
async function buscarHeroesPorNombre(texto) {
  const { data, error } = await db
    .from("heroes")
    .select("*")
    .ilike("nombre", `%${texto}%`)
    .order("id");

  if (error) return [];
  return data;
}

// CREATE (antes: heroes.push(nuevo) + guardar en localStorage)
// "datos" no trae id: Postgres lo genera solo.
async function agregarHeroe(datos) {
  const { data, error } = await db
    .from("heroes")
    .insert([datos])       // insert() siempre recibe un ARRAY
    .select();             // devuélveme la fila creada (con su id)

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }
  return data[0];
}

// UPDATE (antes: findIndex + splice + push + localStorage)
async function modificarHeroe(id, cambios) {
  const { data, error } = await db
    .from("heroes")
    .update(cambios)
    .eq("id", id)
    .select();

  if (error || data.length === 0) return null;   // null si no existe ese id
  return data[0];
}

// DELETE (antes: splice + lista "heroesEliminados" en localStorage)
async function eliminarHeroe(id) {
  const { data, error } = await db
    .from("heroes")
    .delete()
    .eq("id", id)
    .select();             // para saber si de verdad borró una fila

  return !error && data.length > 0;
}
