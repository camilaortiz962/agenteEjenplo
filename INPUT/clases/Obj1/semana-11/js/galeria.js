// ============================================
  // 1. DATOS DE PRODUCTOS — vienen del catálogo de admin
  //    Ya no es un array fijo: los trae listarProductos()
  //    (datos.js) desde la tabla productos_practica de
  //    Supabase. cargarProductos() los pide y los deja aquí.
  // ============================================
  let productos = [];

  // Mismo formato de moneda que admin.js: 32000 → "$ 32.000"
  const formatoPrecio = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });


  // ============================================
  // 2. ESTADO DEL CARRITO
  //    Un objeto donde la clave es el id del
  //    producto y el valor es la cantidad
  //    Ejemplo: { 1: 2, 3: 1 }
  // ============================================
  const carrito = {};
  // Cantidad seleccionada por tarjeta (antes de agregar). Se inicializa
  // en cargarProductos(), cuando ya sabemos qué productos llegaron.
  const cantidadesSeleccionadas = {};


  // ============================================
  // 3. RENDERIZAR LA GALERÍA
  //    Recorremos el array con forEach y por cada
  //    objeto creamos una card HTML dinámicamente
  // ============================================
  // Miniatura del producto. Si no tiene imagen (img_url vacío en Supabase),
  // dibujamos un cuadro con la inicial, igual que el catálogo de admin.
  function imagenProducto(producto) {
    if (!producto.imagen) {
      const inicial = (producto.nombre || '?').charAt(0).toUpperCase();
      return `<div class="card-img sin-imagen">${inicial}</div>`;
    }
    return `<img class="card-img" src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" />`;
  }

  function renderizarGaleria() {
    const galeria = document.getElementById('galeria');
    galeria.innerHTML = ''; // Limpiar antes de renderizar

    // forEach recorre cada objeto del array
    productos.forEach(producto => {

      // Crear el elemento card
      const card = document.createElement('div');
      card.classList.add('card');
      // Guardamos el id en un atributo para identificarla
      card.dataset.id = producto.id;

      // enStock: si está agotado, la tarjeta se ve apagada y no se puede
      // agregar (lo hace el CSS con .agotado)
      if (!producto.enStock) card.classList.add('agotado');

      // Construir el HTML interno de la card
      card.innerHTML = `
        ${imagenProducto(producto)}
        <div class="card-body">
          <p class="card-nombre">${producto.nombre}</p>
          <p class="card-descripcion">${producto.descripcion || 'Sin descripción'}</p>
          <p class="card-precio">${formatoPrecio.format(producto.precio)}</p>
        </div>
        <div class="card-acciones">
          <button class="btn-restar" data-id="${producto.id}">−</button>
          <span class="cantidad-display" id="cant-${producto.id}">
            ${cantidadesSeleccionadas[producto.id]}
          </span>
          <button class="btn-sumar" data-id="${producto.id}">+</button>
          <button class="btn-agregar" data-id="${producto.id}">
            ${producto.enStock ? 'Agregar' : 'Agotado'}
          </button>
        </div>
      `;

      galeria.appendChild(card);
    });

    // Asignar eventos a los botones recién creados
    asignarEventosTarjetas();
  }


  // ============================================
  // 4. EVENTOS DE LAS TARJETAS
  //    Suma/resta la cantidad antes de agregar,
  //    y el botón "Agregar" mete el producto
  //    al carrito con la cantidad seleccionada
  // ============================================
  function asignarEventosTarjetas() {

    // Botones RESTAR (−)
    document.querySelectorAll('.btn-restar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        if (cantidadesSeleccionadas[id] > 1) {
          cantidadesSeleccionadas[id]--;
          document.getElementById(`cant-${id}`).textContent =
            cantidadesSeleccionadas[id];
        }
      });
    });

    // Botones SUMAR (+)
    document.querySelectorAll('.btn-sumar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        cantidadesSeleccionadas[id]++;
        document.getElementById(`cant-${id}`).textContent =
          cantidadesSeleccionadas[id];
      });
    });

    // Botones AGREGAR AL CARRITO
    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const cantidad = cantidadesSeleccionadas[id];

        // Si ya estaba en carrito, sumar; si no, inicializar
        carrito[id] = (carrito[id] || 0) + cantidad;

        // Resetear cantidad visual a 1
        cantidadesSeleccionadas[id] = 1;
        document.getElementById(`cant-${id}`).textContent = 1;

        // Feedback visual al botón (la clase .agregado vive en galeria.css)
        btn.textContent = '✓ Agregado';
        btn.classList.add('agregado');
        setTimeout(() => {
          btn.textContent = 'Agregar';
          btn.classList.remove('agregado');
        }, 1200);

        actualizarCarrito();
      });
    });
  }


  // ============================================
  // 5. ACTUALIZAR EL PANEL DE CARRITO
  //    Recorre el objeto carrito y construye
  //    los items en el panel lateral
  // ============================================
  function actualizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const badge = document.getElementById('contador-badge');
    const totalValor = document.getElementById('total-valor');

    // Calcular totales
    let totalItems = 0;
    let totalPrecio = 0;

    const idsEnCarrito = Object.keys(carrito).filter(id => carrito[id] > 0);

    if (idsEnCarrito.length === 0) {
      lista.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío 🛒</p>';
      badge.textContent = '0';
      totalValor.textContent = formatoPrecio.format(0);
      return;
    }

    lista.innerHTML = '';

    idsEnCarrito.forEach(id => {
      const producto = productos.find(p => p.id === parseInt(id));
      const qty = carrito[id];
      totalItems += qty;
      totalPrecio += producto.precio * qty;

      const item = document.createElement('div');
      item.classList.add('item-carrito');
      item.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" />
        <div class="item-info">
          <strong>${producto.nombre}</strong>
          <span>${formatoPrecio.format(producto.precio)} × ${qty}</span>
        </div>
        <span class="item-qty">${formatoPrecio.format(producto.precio * qty)}</span>
      `;
      lista.appendChild(item);
    });

    badge.textContent = totalItems;
    totalValor.textContent = formatoPrecio.format(totalPrecio);
  }


  // ============================================
  // 6. ABRIR / CERRAR PANEL CARRITO
  // ============================================
  const panelCarrito = document.getElementById('panel-carrito');
  const overlay = document.getElementById('overlay');

  document.getElementById('btn-carrito').addEventListener('click', () => {
    panelCarrito.classList.add('abierto');
    overlay.classList.add('activo');
  });

  document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
  overlay.addEventListener('click', cerrarCarrito);

  function cerrarCarrito() {
    panelCarrito.classList.remove('abierto');
    overlay.classList.remove('activo');
  }

  // ============================================
  // 7. CARGAR EL CATÁLOGO DESDE SUPABASE
  //    listarProductos() (datos.js) trae las filas de
  //    productos_practica. Las mapeamos al formato que
  //    usa la galería (imagen, enStock) y renderizamos.
  // ============================================
  async function cargarProductos() {
    const galeria = document.getElementById('galeria');
    galeria.innerHTML = '<p class="carrito-vacio">Cargando productos...</p>';

    const lista = await listarProductos();

    // null = hubo un error de conexión/consulta (lo detalla datos.js en consola)
    if (lista === null) {
      galeria.innerHTML = '<p class="carrito-vacio">No se pudo cargar el catálogo. Revisa la consola (F12).</p>';
      return;
    }

    // Mapear al formato de la galería. Un producto está "en stock" si está
    // marcado como disponible Y además le quedan unidades.
    productos = lista.map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      imagen: p.img_url,                               // img_url → imagen
      enStock: p.disponible && (p.unidades ?? 0) > 0,  // disponible + unidades
    }));

    // Catálogo vacío: no es un error, pero avisamos
    if (productos.length === 0) {
      galeria.innerHTML = '<p class="carrito-vacio">Todavía no hay productos en el catálogo.</p>';
      return;
    }

    // Cada tarjeta arranca con cantidad 1
    productos.forEach(p => { cantidadesSeleccionadas[p.id] = 1; });

    renderizarGaleria();
  }

  // ============================================
  // ▶ INICIAR
  // ============================================
  cargarProductos();

