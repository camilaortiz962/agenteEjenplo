/* datos.js — CRUD migrado de localStorage a Supabase (Sección 5) */

// Nombre de la tabla en un solo lugar: para tu proyecto real (sección 4.6)
// solo cambias esta línea, ej. const TABLA = 'productos';
const TABLA = 'productos_practica';

// ---------------------------------------------------------------------
// READ (todos) — reemplaza a cargarProductos() / JSON.parse(localStorage...)
// ---------------------------------------------------------------------
async function listarProductos() {
  const { data, error } = await db
    .from(TABLA)
    .select('*')
    .order('id');     // orden estable: 1, 2, 3...

  // null (y no []) para que quien la llame distinga "hubo un error"
  // de "la tabla está vacía"
  if (error) {
    console.log("Error al listar:", error);
    return null;
  }
  return data;
}

// ---------------------------------------------------------------------
// 5.1 CREATE — agregarProducto()
// ---------------------------------------------------------------------
async function agregarProducto(datos) {

  const { data, error } = await db
    .from(TABLA)
    .insert([datos])   // insert() siempre recibe un ARRAY de objetos
    .select();         // devuelve la fila ya creada (con su id nuevo)

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }

  return data[0];      // la fila recién creada
}

// ---------------------------------------------------------------------
// 5.2 READ — buscarProductoPorId() y buscarProductosPorNombre()
// ---------------------------------------------------------------------
async function buscarProductoPorId(id) {
  const { data, error } = await db
    .from(TABLA)
    .select('*')
    .eq('id', id)      // equivalente a find(p => p.id === id)
    .single();         // exactamente una fila, como objeto

  if (error) return null;   // también entra aquí si el id no existe
  return data;
}

async function buscarProductosPorNombre(texto) {
  const { data, error } = await db
    .from(TABLA)
    .select('*')
    .ilike('nombre', `%${texto}%`);   // equivalente a toLowerCase().includes()

  if (error) return [];
  return data;
}

// ---------------------------------------------------------------------
// 5.3 UPDATE — modificarProducto()
// ---------------------------------------------------------------------
async function modificarProducto(id, cambios) {

  const { data, error } = await db
    .from(TABLA)
    .update(cambios)   // solo toca las propiedades que vengan en "cambios"
    .eq('id', id)
    .select();

  if (error) {
    console.log("Error al modificar:", error);
    return null;
  }
  return data[0] ?? null;   // si el id no existe, data llega vacío ([])
}

// ---------------------------------------------------------------------
// 5.4 DELETE — eliminarProducto()
// ---------------------------------------------------------------------
async function eliminarProducto(id) {

  const { data, error } = await db
    .from(TABLA)
    .delete()
    .eq('id', id)
    .select();         // devuelve las filas que SÍ se borraron

  if (error) {
    console.log("Error al eliminar:", error);
    return false;
  }

  // Si RLS no permite DELETE, Supabase NO da error: solo borra 0 filas.
  // Por eso "sin error" no basta; revisamos que haya borrado algo.
  if (data.length === 0) {
    console.log("No se borró ninguna fila (¿falta una política RLS de DELETE?) id:", id);
    return false;
  }
  return true;
}
