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
  // 2. ESTADO DEL CARRITO (guía 5.1)
  //    carrito:    { producto_id: cantidad }  → lo que se dibuja en el panel
  //    pedidoId:   id del pedido de este cliente en estado 'carrito' (o null)
  //    detalleIds: { producto_id: id de la fila en detalles_pedidos }
  //    Sin sesión, solo se usa `carrito` (modo demostración, en memoria).
  // ============================================
  const carrito = {};
  // Cantidad seleccionada por tarjeta (antes de agregar). Se inicializa
  // en cargarProductos(), cuando ya sabemos qué productos llegaron.
  const cantidadesSeleccionadas = {};
  let pedidoId = null;
  const detalleIds = {};


  // ============================================
  // 2.1 FUNCIONES BASE DEL CARRITO (guía 5.1)
  // ============================================

  // Usuario con sesión, o null. galeria.html no tiene login: ahí siempre es null.
  async function obtenerUsuario() {
    const { data, error } = await db.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  }

  // Busca el pedido en estado 'carrito' de este cliente. maybeSingle() y no
  // single(): si no hay fila, single() lo trataría como error; maybeSingle()
  // devuelve data = null, que aquí es un caso normal ("todavía no hay carrito").
  async function buscarCarrito(usuario) {
    const { data, error } = await db
      .from('pedidos')
      .select('id')
      .eq('cliente_id', usuario.id)
      .eq('estado', 'carrito')
      .maybeSingle();

    if (error) {
      console.log('Error al buscar el carrito:', error);
      return null;
    }
    return data ? data.id : null;
  }

  // Devuelve el id del carrito, creándolo si hace falta.
  async function obtenerOCrearCarrito(usuario) {
    if (pedidoId) return pedidoId;

    const existente = await buscarCarrito(usuario);
    if (existente) {
      pedidoId = existente;
      return pedidoId;
    }

    // Solo enviamos cliente_id: el estado ('carrito') lo pone la base con su
    // valor por defecto. Además, el permiso por columna (4.8) ni siquiera deja
    // escribir `estado` desde el navegador.
    const { data, error } = await db
      .from('pedidos')
      .insert([{ cliente_id: usuario.id }])
      .select('id')
      .single();

    if (error) {
      // 23505 = unique_violation: el índice parcial pedidos_un_carrito_por_cliente
      // ya tiene un carrito abierto de este cliente (doble clic u otra pestaña lo
      // creó un instante antes). No es un fallo: usamos ese carrito.
      if (error.code === '23505') {
        pedidoId = await buscarCarrito(usuario);
        return pedidoId;
      }
      console.log('Error al crear el carrito:', error);
      return null;
    }

    pedidoId = data.id;
    return pedidoId;
  }

  // Olvida el carrito en memoria (no toca la base de datos).
  function vaciarCarritoLocal() {
    Object.keys(carrito).forEach(id => delete carrito[id]);
    Object.keys(detalleIds).forEach(id => delete detalleIds[id]);
    pedidoId = null;
    actualizarCarrito();
  }


  // ============================================
  // 2.2 AGREGAR AL CARRITO (guía 5.2)
  //     Devuelve true si salió bien, false si falló.
  // ============================================
  async function agregarAlCarrito(id, cantidad) {
    const usuario = await obtenerUsuario();

    // Sin sesión: modo demostración, solo en memoria
    if (!usuario) {
      carrito[id] = (carrito[id] || 0) + cantidad;
      return true;
    }

    const idCarrito = await obtenerOCrearCarrito(usuario);
    if (!idCarrito) return false;

    const nuevaCantidad = (carrito[id] || 0) + cantidad;

    if (detalleIds[id]) {
      // Ya hay una fila de este producto: se actualiza la cantidad (el unique
      // (pedido_id, producto_id) impide tener dos filas del mismo producto).
      const { data, error } = await db
        .from('detalles_pedidos')
        .update({ cantidad: nuevaCantidad })
        .eq('id', detalleIds[id])
        .select();

      if (error) {
        console.log('Error al actualizar la cantidad:', error);
        return false;
      }
      // RLS no da error cuando bloquea un update: simplemente cambia 0 filas.
      if (data.length === 0) {
        console.log('El update no cambió ninguna fila (RLS o el detalle ya no existe).');
        return false;
      }
    } else {
      // NUNCA enviamos el precio: lo copia el trigger fijar_precio_unitario (4.4).
      const { data, error } = await db
        .from('detalles_pedidos')
        .insert([{ pedido_id: idCarrito, producto_id: Number(id), cantidad }])
        .select('id')
        .single();

      if (error) {
        console.log('Error al agregar el producto:', error);
        return false;
      }
      detalleIds[id] = data.id;
    }

    carrito[id] = nuevaCantidad;
    return true;
  }


  // ============================================
  // 2.3 QUITAR DEL CARRITO (guía 5.4)
  //     El pedido NO se borra aunque quede vacío: se reutiliza.
  // ============================================
  async function quitarDelCarrito(id) {
    if (detalleIds[id]) {
      const { data, error } = await db
        .from('detalles_pedidos')
        .delete()
        .eq('id', detalleIds[id])
        .select();

      if (error || data.length === 0) {
        console.log('No se pudo quitar el producto:', error || 'el delete no borró ninguna fila (RLS).');
        return;   // el carrito local queda como estaba
      }
      delete detalleIds[id];
    }

    delete carrito[id];
    actualizarCarrito();
  }


  // ============================================
  // 2.4 RECONSTRUIR EL CARRITO DESDE LA BASE (guía 5.5)
  // ============================================
  async function cargarCarritoDesdeBD() {
    // Sin los productos no sabemos nombres ni precios para dibujar el panel
    await productosListos;
    vaciarCarritoLocal();

    const usuario = await obtenerUsuario();
    if (!usuario) return;

    // UNA sola consulta: el pedido y sus detalles. El select anidado
    // detalles_pedidos(...) funciona gracias a la clave foránea pedido_id.
    const { data, error } = await db
      .from('pedidos')
      .select('id, detalles_pedidos(id, producto_id, cantidad)')
      .eq('cliente_id', usuario.id)
      .eq('estado', 'carrito')
      .maybeSingle();

    if (error) {
      console.log('Error al cargar el carrito:', error);
      return;
    }
    if (!data) return;

    pedidoId = data.id;
    data.detalles_pedidos.forEach(d => {
      carrito[d.producto_id] = d.cantidad;
      detalleIds[d.producto_id] = d.id;
    });
    actualizarCarrito();
  }


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

    // Botones AGREGAR AL CARRITO (guía 5.3): ahora es async, porque con
    // sesión escribe en Supabase y hay que esperar la respuesta.
    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;               // texto: agregarAlCarrito lo convierte con Number()
        const cantidad = cantidadesSeleccionadas[id];

        btn.disabled = true;                     // evita el doble clic mientras espera
        const ok = await agregarAlCarrito(id, cantidad);
        btn.disabled = false;

        // Resetear cantidad visual a 1
        cantidadesSeleccionadas[id] = 1;
        document.getElementById(`cant-${id}`).textContent = 1;

        // Feedback visual: verde si salió bien, rojo si falló (clases en galeria.css)
        const clase = ok ? 'agregado' : 'error';
        btn.textContent = ok ? '✓ Agregado' : 'Error';
        btn.classList.add(clase);
        setTimeout(() => {
          btn.textContent = 'Agregar';
          btn.classList.remove(clase);
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

    // Un mensaje viejo ("Stock insuficiente...") no debe quedarse pegado
    // cuando el carrito cambia (mejora sugerida en la guía, 6.2)
    mensajeCarrito.textContent = '';

    // Calcular totales
    let totalItems = 0;
    let totalPrecio = 0;

    const idsEnCarrito = Object.keys(carrito).filter(id => carrito[id] > 0);

    if (idsEnCarrito.length === 0) {
      lista.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío 🛒</p>';
      badge.textContent = '0';
      totalValor.textContent = formatoPrecio.format(0);
      formCheckout.hidden = true;
      btnCheckout.hidden = false;
      return;
    }

    lista.innerHTML = '';

    idsEnCarrito.forEach(id => {
      // Si el producto ya no está en el catálogo, lo mostramos igual para poder quitarlo
      const producto = productos.find(p => p.id === parseInt(id))
        || { nombre: `Producto ${id}`, precio: 0, imagen: null };
      const qty = carrito[id];
      totalItems += qty;
      totalPrecio += producto.precio * qty;

      const item = document.createElement('div');
      item.classList.add('item-carrito');

      // Miniatura (o un cuadro vacío si el producto no tiene imagen)
      if (producto.imagen) {
        const img = document.createElement('img');
        img.src = producto.imagen;
        img.alt = producto.nombre;
        item.appendChild(img);
      } else {
        const sinImg = document.createElement('div');
        sinImg.classList.add('item-sin-imagen');
        sinImg.textContent = producto.nombre.charAt(0).toUpperCase();
        item.appendChild(sinImg);
      }

      const info = document.createElement('div');
      info.classList.add('item-info');

      const nombre = document.createElement('strong');
      nombre.textContent = producto.nombre;

      const detalle = document.createElement('span');
      detalle.textContent = `${formatoPrecio.format(producto.precio)} × ${qty}`;

      // Botón Quitar (guía 5.4): con createElement + textContent, sin innerHTML
      const btnQuitar = document.createElement('button');
      btnQuitar.type = 'button';
      btnQuitar.classList.add('btn-quitar');
      btnQuitar.textContent = 'Quitar';
      btnQuitar.addEventListener('click', () => quitarDelCarrito(id));

      info.append(nombre, detalle, btnQuitar);

      const subtotal = document.createElement('span');
      subtotal.classList.add('item-qty');
      subtotal.textContent = formatoPrecio.format(producto.precio * qty);

      item.append(info, subtotal);
      lista.appendChild(item);
    });

    badge.textContent = totalItems;
    // Este total es solo para mostrar. El que cuenta lo calcula la base
    // (vista pedidos_con_total) y se muestra al confirmar.
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
  // 7. CHECKOUT: FORMULARIO DE ENVÍO (guía 5.6) Y CONFIRMAR (guía 5.7)
  //    Estas const van ANTES del arranque: actualizarCarrito() las usa,
  //    y una const no se puede leer antes de su línea (ReferenceError).
  // ============================================
  const btnCheckout = document.getElementById('btn-checkout');
  const formCheckout = document.getElementById('form-checkout');
  const mensajeCarrito = document.getElementById('mensaje-carrito');
  const checkEnvio = document.getElementById('checkout-envio');
  const inputDireccion = document.getElementById('checkout-direccion');
  const inputTelefono = document.getElementById('checkout-telefono');
  const inputObservacion = document.getElementById('checkout-observacion');
  const btnConfirmar = document.getElementById('btn-confirmar');

  // "Proceder al pago": decide qué mostrar según el carrito y la sesión
  btnCheckout.addEventListener('click', async () => {
    mensajeCarrito.textContent = '';

    const hayProductos = Object.keys(carrito).some(id => carrito[id] > 0);
    if (!hayProductos) {
      mensajeCarrito.textContent = 'Tu carrito está vacío.';
      return;
    }

    const usuario = await obtenerUsuario();
    if (!usuario) {
      mensajeCarrito.textContent = 'Para comprar, inicia sesión en cliente.html (Mi cuenta).';
      return;
    }

    formCheckout.hidden = false;
    btnCheckout.hidden = true;
  });

  document.getElementById('btn-cancelar-checkout').addEventListener('click', () => {
    formCheckout.hidden = true;
    btnCheckout.hidden = false;
  });

  // Dirección y teléfono solo son obligatorios si hay envío a domicilio
  checkEnvio.addEventListener('change', () => {
    inputDireccion.required = checkEnvio.checked;
    inputTelefono.required = checkEnvio.checked;
  });

  // Texto del campo sin espacios, o null si quedó vacío
  function textoONull(input) {
    const valor = input.value.trim();
    return valor === '' ? null : valor;
  }

  // Confirmar: el navegador NO cambia el estado ni calcula el total.
  // Solo le pide a la función confirmar_pedido (4.6) que lo haga todo,
  // en una sola transacción: o se confirma completo, o no pasa nada.
  formCheckout.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pedidoId === null) return;

    btnConfirmar.disabled = true;
    mensajeCarrito.textContent = '';

    const { data, error } = await db.rpc('confirmar_pedido', {
      p_pedido_id: pedidoId,
      p_envio: checkEnvio.checked,
      p_direccion: textoONull(inputDireccion),
      p_telefono: textoONull(inputTelefono),
      p_observacion: textoONull(inputObservacion),
    });

    btnConfirmar.disabled = false;

    if (error) {
      // El mensaje lo escribió la función (raise exception), ej.
      // 'Stock insuficiente para el producto 2'. El carrito queda intacto.
      console.log('Error al confirmar el pedido:', error);
      mensajeCarrito.textContent = error.message;
      return;
    }

    // data es la fila del pedido ya confirmado. El total lo calcula la base.
    const { data: vista, error: errorTotal } = await db
      .from('pedidos_con_total')
      .select('total')
      .eq('id', data.id)
      .single();

    if (errorTotal) console.log('Error al leer el total:', errorTotal);

    vaciarCarritoLocal();
    formCheckout.reset();
    inputDireccion.required = false;
    inputTelefono.required = false;

    mensajeCarrito.textContent = vista
      ? `Pedido #${data.id} confirmado. Total: $${vista.total.toLocaleString('es-CO')}`
      : `Pedido #${data.id} confirmado.`;
  });


  // ============================================
  // 8. CARGAR EL CATÁLOGO DESDE SUPABASE
  //    listarProductos() (datos.js) trae las filas de
  //    productos_practica. Las mapeamos al formato que
  //    usa la galería (imagen, enStock) y renderizamos.
  //    Al ser async, devuelve una promesa que se resuelve
  //    al terminar (también si hubo error): productosListos.
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

    // disponible = false → producto retirado de la tienda: no se muestra.
    // (Si sigue disponible pero sin unidades, sí se muestra, como "Agotado".)
    // Mapear al formato de la galería. Un producto está "en stock" si está
    // marcado como disponible Y además le quedan unidades.
    productos = lista.filter(p => p.disponible !== false).map(p => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      // Mismo cálculo que el trigger fijar_precio_unitario (4.4), para que el
      // precio en pantalla coincida con el que guarda la base.
      precio: Math.round(p.precio * (1 - (p.descuento ?? 0))),
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
  // ▶ INICIAR (al final: todas las const de arriba ya existen)
  // ============================================
  const productosListos = cargarProductos();
  cargarCarritoDesdeBD();
