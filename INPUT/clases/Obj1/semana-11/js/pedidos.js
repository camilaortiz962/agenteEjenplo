/* pedidos.js — leer y dibujar pedidos. Lo comparten:
     - cliente.html → pestaña "Mis pedidos"   (cliente.js)
     - admin.html   → pestaña "Pedidos"       (admin.js)

   El MISMO select sirve para los dos porque quien decide qué filas llegan
   es RLS (política ver_pedidos): un cliente recibe solo los suyos y un
   admin recibe todos. El navegador no filtra por seguridad: la base sí.

   Ojo: estos scripts comparten el mismo espacio global. Por eso aquí no se
   repiten nombres como formatoPrecio (ya existe en admin.js y galeria.js):
   declarar dos veces una const en la misma página es un SyntaxError. */

const formatoMonedaPedidos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const formatoFechaPedidos = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// Saltos de estado que el admin puede hacer. Es el mismo mapa que valida el
// trigger validar_transicion_estado (4.5): si alguien se salta esta lista
// desde la consola, la base igual rechaza el cambio.
// (carrito → confirmado no está: eso solo lo hace confirmar_pedido.)
const SIGUIENTES_ESTADOS = {
  confirmado: ['enviado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};


// Trae los pedidos que ya no están en carrito, el más reciente primero.
//   conCliente: true → además trae nombre/correo/teléfono del cliente (admin)
//   estado: ''       → todos; 'enviado' → solo los enviados, etc.
// Devuelve un array, o null si hubo un error.
async function consultarPedidos({ conCliente = false, estado = '' } = {}) {
  // Select anidado: cada pedido con sus detalles, y cada detalle con el
  // nombre de su producto. Funciona gracias a las claves foráneas
  // detalles_pedidos.pedido_id → pedidos y producto_id → productos_practica.
  let columnas = 'id, cliente_id, created_at, confirmado_en, estado, envio, direccion, telefono, observacion, '
    + 'detalles_pedidos(id, cantidad, precio_unitario, productos_practica(nombre))';
  if (conCliente) columnas += ', clientes_practica(nombre, correo, telefono)';

  let consulta = db
    .from('pedidos')
    .select(columnas)
    .neq('estado', 'carrito')          // el carrito abierto no es un pedido todavía
    .order('id', { ascending: false });

  if (estado) consulta = consulta.eq('estado', estado);

  const { data: pedidos, error } = await consulta;
  if (error) {
    console.log('Error al leer los pedidos:', error);
    return null;
  }
  if (pedidos.length === 0) return [];

  // El total NO se suma en el navegador: lo calcula la vista
  // pedidos_con_total (4.7). Una sola consulta para todos los ids.
  const { data: totales, error: errorTotales } = await db
    .from('pedidos_con_total')
    .select('id, total')
    .in('id', pedidos.map(p => p.id));

  if (errorTotales) console.log('Error al leer los totales:', errorTotales);

  const totalPorId = {};
  (totales ?? []).forEach(t => { totalPorId[t.id] = t.total; });
  pedidos.forEach(p => { p.total = totalPorId[p.id] ?? null; });

  return pedidos;
}


// Pequeño atajo: crea un elemento con clase y texto (textContent, nunca
// innerHTML: una dirección como "<b>Calle 1</b>" se ve como texto, no como HTML)
function elementoPedido(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}


// Dibuja UN pedido como tarjeta.
//   opciones.conCliente:    muestra quién compró (admin)
//   opciones.alCambiarEstado(pedido, nuevoEstado, boton): si viene, pinta
//   los botones para avanzar el estado (admin)
function crearTarjetaPedido(pedido, opciones = {}) {
  const tarjeta = elementoPedido('article', 'pedido');

  // Cabecera: número de pedido + estado
  const cabecera = elementoPedido('div', 'pedido-cabecera');
  cabecera.append(
    elementoPedido('h3', '', `Pedido #${pedido.id}`),
    elementoPedido('span', `estado-pedido estado-${pedido.estado}`, pedido.estado)
  );
  tarjeta.appendChild(cabecera);

  // Fecha: la de confirmación (cuando se compró); si no hay, la de creación
  const fecha = pedido.confirmado_en || pedido.created_at;
  tarjeta.appendChild(elementoPedido('p', 'pedido-meta', formatoFechaPedidos.format(new Date(fecha))));

  // Cliente (solo admin)
  if (opciones.conCliente) {
    const c = pedido.clientes_practica;
    const texto = c
      ? [c.nombre, c.correo, c.telefono].filter(Boolean).join(' · ')
      // null = RLS no deja leer esa fila (falta la política admin_ve_clientes)
      : `Cliente ${pedido.cliente_id.slice(0, 8)}… (sin permiso para ver sus datos)`;
    tarjeta.appendChild(elementoPedido('p', 'pedido-meta', 'Cliente: ' + texto));
  }

  // Entrega
  const entrega = pedido.envio
    ? `Envío a: ${pedido.direccion ?? '—'} · Tel. ${pedido.telefono ?? '—'}`
    : 'Sin envío a domicilio';
  tarjeta.appendChild(elementoPedido('p', 'pedido-meta', entrega));
  if (pedido.observacion) {
    tarjeta.appendChild(elementoPedido('p', 'pedido-meta', `Observación: ${pedido.observacion}`));
  }

  // Productos: precio_unitario es el GUARDADO al comprar, no el de hoy
  const lineas = elementoPedido('ul', 'pedido-lineas');
  pedido.detalles_pedidos.forEach(d => {
    const nombre = d.productos_practica ? d.productos_practica.nombre : `Producto`;
    const li = document.createElement('li');
    const izquierda = elementoPedido('span', '', `${nombre} × ${d.cantidad}`);
    izquierda.appendChild(elementoPedido('span', 'detalle', ` ${formatoMonedaPedidos.format(d.precio_unitario)} c/u`));
    li.append(izquierda, elementoPedido('span', '', formatoMonedaPedidos.format(d.cantidad * d.precio_unitario)));
    lineas.appendChild(li);
  });
  tarjeta.appendChild(lineas);

  // Total calculado por la base (pedidos_con_total)
  const total = elementoPedido('div', 'pedido-total');
  total.append(
    elementoPedido('span', '', 'Total'),
    elementoPedido('span', '', pedido.total === null ? '—' : formatoMonedaPedidos.format(pedido.total))
  );
  tarjeta.appendChild(total);

  // Botones de estado (solo admin, y solo si hay a dónde avanzar)
  const siguientes = SIGUIENTES_ESTADOS[pedido.estado] ?? [];
  if (opciones.alCambiarEstado && siguientes.length > 0) {
    const acciones = elementoPedido('div', 'pedido-acciones');
    siguientes.forEach(nuevo => {
      const boton = elementoPedido('button', nuevo === 'cancelado' ? 'secondary' : '', `Marcar como ${nuevo}`);
      boton.type = 'button';
      boton.addEventListener('click', () => opciones.alCambiarEstado(pedido, nuevo, boton));
      acciones.appendChild(boton);
    });
    tarjeta.appendChild(acciones);
  }

  return tarjeta;
}


// Dibuja la lista completa en un contenedor.
//   pedidos === null → hubo error; [] → no hay pedidos
function mostrarListaPedidos(contenedor, pedidos, opciones = {}, textoVacio = 'No hay pedidos.') {
  contenedor.replaceChildren();

  if (pedidos === null) {
    contenedor.appendChild(elementoPedido('p', 'vacio', 'No se pudieron cargar los pedidos. Revisa la consola (F12).'));
    return;
  }
  if (pedidos.length === 0) {
    contenedor.appendChild(elementoPedido('p', 'vacio', textoVacio));
    return;
  }
  pedidos.forEach(p => contenedor.appendChild(crearTarjetaPedido(p, opciones)));
}
