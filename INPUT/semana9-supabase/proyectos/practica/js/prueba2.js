// prueba2.js — section 4.4, Step 5 (final version).
// Uses "db" (created in supabaseClient.js) and #btn-traer / #resultado.

// La lógica de traer productos vive en su propia función para poder
// llamarla desde los dos botones (traer y agregar).
async function traerProductos() {

  // "async" on the function lets us use "await" inside it.
  // await pauses ONLY this function until Supabase answers
  // (the query travels over the internet and comes back).
  const { data, error } = await db.from("productos_practica").select("*");

  // Check the error BEFORE touching data: if the query failed,
  // data is null and data.map() would break the script.
  if (error) {
    document.getElementById("resultado").textContent = "Error: " + error.message;
    return;
  }

  // Nombres
  const nombres = data.map(producto => producto.nombre);
  // nombres es ahora un array de solo strings:
  // ["Audífonos Bluetooth X200", "Camiseta Básica Algodón", "Silla Gamer ProMax"]
  // — ya no objetos completos

  document.getElementById("lista").innerHTML =
    "<h3>Nombres</h3><ul>" + nombres.map(n => `<li>${n}</li>`).join("") + "</ul>";

  // Descripciones
  const descripciones = data.map((producto) => producto.descripcion);
  document.getElementById("descripciones").innerHTML =
    "<h3>Descripciones</h3><ul>" + descripciones.map((d) => `<li>${d}</li>`).join("") + "</ul>";

  // Precios
  const precios = data.map((producto) => producto.precio);
  document.getElementById("precios").innerHTML =
    "<h3>Precios</h3><ul>" + precios.map((p) => `<li>$${p}</li>`).join("") + "</ul>";

  // Disponible: true/false convertido a texto
  const disponibles = data.map((producto) => producto.disponible ? "Disponible" : "Agotado");
  document.getElementById("disponibles").innerHTML =
    "<h3>Disponibilidad</h3><ul>" + disponibles.map((d) => `<li>${d}</li>`).join("") + "</ul>";
}

document.getElementById("btn-traer").addEventListener("click", traerProductos);

//CRUD: Create, Read, Update, Delete

async function agregarProducto(datos) {

  const { data, error } = await db
    .from('productos_practica')  // la tabla
    .insert([datos])             // insert() siempre recibe un ARRAY de objetos,
                                 // aunque insertes uno solo
    .select();                   // .select() le pide a Supabase que te
                                 // devuelva la fila ya creada (con su id
                                 // nuevo) — sin esto, insert() no te
                                 // devuelve nada útil

  if (error) {
    console.log("Error al agregar:", error);
    document.getElementById("resultado").textContent = "Error al agregar: " + error.message;
    return null;
  }

  return data[0];   // data siempre es un array — tomamos el primer
                    // elemento, que es la fila recién creada
}

// El await ahora vive dentro de un listener async: así el producto
// solo se inserta al hacer clic, no cada vez que se recarga la página.
document.getElementById("btn-agregar-obj").addEventListener("click", async () => {
  const nuevo = await agregarProducto({
    nombre: "Lámpara Solar Portátil",
    descripcion: "Lámpara recargable con panel solar, ideal para exteriores",
    precio: 89000,
    unidades: 40,
    descuento: 0.05,
    disponible: true,
    categorias: ["hogar", "exteriores", "ofertas"]
  });

  // Si falló, agregarProducto ya mostró el error en #resultado
  if (!nuevo) return;

  document.getElementById("resultado").textContent =
    `Agregado: ${nuevo.nombre} (id ${nuevo.id})`;

  // Volvemos a pedir la tabla para que el producto nuevo aparezca en las listas
  await traerProductos();

  console.log(nuevo);
  // {
  //   id: 4, nombre: "Lámpara Solar Portátil",
  //   descripcion: "Lámpara recargable con panel solar, ideal para exteriores",
  //   precio: 89000, unidades: 40, descuento: 0.05, disponible: true,
  //   categorias: ["hogar", "exteriores", "ofertas"],
  //   created_at: "2026-10-15T10:15:00Z"
  // }
  // ↑ id: 4 porque Audífonos Bluetooth X200, Camiseta Básica Algodón y
  //   Silla Gamer ProMax (sección 3.3) ya ocupaban los id 1, 2 y 3.
});
