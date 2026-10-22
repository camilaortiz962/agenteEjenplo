/* crudProductos.js — Sección 5, sobre la tabla compartida "productos_practica" */

// 5.1 CREATE
async function agregarProducto(datos) {
  const { data, error } = await db
    .from('productos_practica')
    .insert([datos])   // insert() siempre recibe un ARRAY
    .select();         // devuélveme la fila creada (con su id nuevo)

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }
  return data[0];
}

// 5.2 READ — por id (equivale a find)
async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .eq('id', id)
    .single();         // una sola fila, como objeto

  if (error) return null;
  return data;
}

// 5.2 READ — por nombre (equivale a filter + toLowerCase().includes())
async function buscarProductosPorNombre(texto) {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .ilike('nombre', `%${texto}%`);

  if (error) return [];
  return data;
}

// Extra: traer todos (para pintar la lista)
async function listarProductos() {
  const { data, error } = await db
    .from('productos_practica')
    .select('*')
    .order('id');

  if (error) return [];
  return data;
}

// 5.3 UPDATE
async function modificarProducto(id, cambios) {
  const { data, error } = await db
    .from('productos_practica')
    .update(cambios)
    .eq('id', id)
    .select();

  if (error || data.length === 0) return null;   // null si no existía ese id
  return data[0];
}

// 5.4 DELETE
async function eliminarProducto(id) {
  const { data, error } = await db
    .from('productos_practica')
    .delete()
    .eq('id', id)
    .select();         // así sabemos si de verdad borró alguna fila

  return !error && data.length > 0;
}
