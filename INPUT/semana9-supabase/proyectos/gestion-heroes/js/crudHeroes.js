/* crudHeroes.js — Sección 4.6: tu proyecto real, tabla "heroes" (BTS)
 *
 * Mismo patrón que crudProductos.js; solo cambia la tabla en .from(...)
 * y las propiedades del objeto:
 *   nombre (text), descripcion (text), universo (text), bando (text),
 *   edad (int8), altura (float8), nivelDeFuerza (int8), activo (bool),
 *   poder (json: array), Image (text: ruta de la imagen)
 */

const TABLA = 'heroes';

// CREATE
async function agregarHeroe(datos) {
  const { data, error } = await db.from(TABLA).insert([datos]).select();
  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }
  return data[0];
}

// READ — todos
async function listarHeroes() {
  const { data, error } = await db.from(TABLA).select('*').order('id');
  if (error) {
    console.log("Error al listar:", error);
    return [];
  }
  return data;
}

// READ — por id
async function buscarHeroePorId(id) {
  const { data, error } = await db.from(TABLA).select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

// READ — por nombre
async function buscarHeroesPorNombre(texto) {
  const { data, error } = await db.from(TABLA).select('*').ilike('nombre', `%${texto}%`).order('id');
  if (error) return [];
  return data;
}

// UPDATE
async function modificarHeroe(id, cambios) {
  const { data, error } = await db.from(TABLA).update(cambios).eq('id', id).select();
  if (error || data.length === 0) return null;
  return data[0];
}

// DELETE
async function eliminarHeroe(id) {
  const { data, error } = await db.from(TABLA).delete().eq('id', id).select();
  return !error && data.length > 0;
}
