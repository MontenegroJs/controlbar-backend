/**
 * Servicio de pedidos
 * Maneja toda la lógica de negocio relacionada con pedidos e items
 */

const dbService = require('./db.service');
const productoService = require('./producto.service');
const { AppError } = require('../middlewares/error.middleware');

// Obtener todas las mesas con su estado (ocupada/libre)
const getMesasConEstado = async () => {
    // Obtener todas las mesas activas
    const mesas = await dbService.all(`
    SELECT id, nombre 
    FROM mesas 
    WHERE activo = 1 
    ORDER BY nombre
  `);

    // Obtener pedidos pendientes por mesa
    const pedidosPendientes = await dbService.all(`
    SELECT mesa_id, id as pedido_id 
    FROM pedidos 
    WHERE estado = 'pendiente'
  `);

    const mesasOcupadas = new Set(pedidosPendientes.map(p => p.mesa_id));

    // Construir respuesta con estado
    return mesas.map(mesa => ({
        id: mesa.id,
        nombre: mesa.nombre,
        estado: mesasOcupadas.has(mesa.id) ? 'ocupada' : 'libre',
        pedido_id: pedidosPendientes.find(p => p.mesa_id === mesa.id)?.pedido_id || null
    }));
};

// Obtener pedido por ID con sus items
const getPedidoById = async (pedidoId) => {
    const pedido = await dbService.get(`
    SELECT p.*, m.nombre as mesa_nombre
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    WHERE p.id = ?
  `, [pedidoId]);

    if (!pedido) return null;

    const items = await dbService.all(`
    SELECT pi.*, pr.nombre as producto_nombre, pv.nombre as variante_nombre
    FROM pedido_items pi
    JOIN productos pr ON pi.producto_id = pr.id
    LEFT JOIN producto_variantes pv ON pi.variante_id = pv.id
    WHERE pi.pedido_id = ?
    ORDER BY pi.agregado_en ASC
  `, [pedidoId]);

    return {
        ...pedido,
        items
    };
};

// Obtener pedido pendiente por mesa
const getPedidoPendienteByMesa = async (mesaId) => {
    const pedido = await dbService.get(`
    SELECT id FROM pedidos 
    WHERE mesa_id = ? AND estado = 'pendiente'
  `, [mesaId]);

    if (!pedido) return null;

    return await getPedidoById(pedido.id);
};

// Crear nuevo pedido para una mesa
const crearPedido = async (mesaId) => {
    // Verificar si ya existe pedido pendiente
    const pedidoExistente = await dbService.getPedidoPendienteByMesa(mesaId);
    if (pedidoExistente) {
        throw new AppError('La mesa ya tiene un pedido pendiente', 400);
    }

    // Obtener fecha actual en hora Lima
    const fechaLima = dbService.getCurrentLimaTime();

    // Crear nuevo pedido con fecha explícita en hora Lima
    const result = await dbService.run(`
    INSERT INTO pedidos (mesa_id, estado, total, creado_en, actualizado_en)
    VALUES (?, 'pendiente', 0, ?, ?)
  `, [mesaId, fechaLima, fechaLima]);

    return await getPedidoById(result.id);
};

// Agregar item a pedido
const agregarItem = async (pedidoId, productoId, varianteId, cantidad) => {
    // Validar cantidad
    if (!cantidad || cantidad <= 0) {
        throw new AppError('La cantidad debe ser mayor a 0', 400);
    }

    // Verificar que el pedido existe y está pendiente
    const pedido = await dbService.get(`
    SELECT id, estado, total FROM pedidos WHERE id = ?
  `, [pedidoId]);

    if (!pedido) {
        throw new AppError('Pedido no encontrado', 404);
    }

    if (pedido.estado !== 'pendiente') {
        throw new AppError('Solo se pueden agregar items a pedidos pendientes', 400);
    }

    // Validar producto y variante, calcular precio
    const { producto, variante, precioUnitario } = await productoService.validarProductoYVariante(productoId, varianteId);

    const subtotal = precioUnitario * cantidad;

    // Insertar item
    const result = await dbService.run(`
    INSERT INTO pedido_items (pedido_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [pedidoId, productoId, varianteId || null, cantidad, precioUnitario, subtotal]);

    // Actualizar total del pedido
    const nuevoTotal = pedido.total + subtotal;
    await dbService.run(`
    UPDATE pedidos SET total = ? WHERE id = ?
  `, [nuevoTotal, pedidoId]);

    // Retornar el item creado con detalles
    const item = await dbService.get(`
    SELECT pi.*, pr.nombre as producto_nombre, pv.nombre as variante_nombre
    FROM pedido_items pi
    JOIN productos pr ON pi.producto_id = pr.id
    LEFT JOIN producto_variantes pv ON pi.variante_id = pv.id
    WHERE pi.id = ?
  `, [result.id]);

    return item;
};

// Eliminar item de pedido (hard delete)
const eliminarItem = async (itemId) => {
    // Obtener item con información del pedido
    const item = await dbService.get(`
    SELECT pi.*, p.estado as pedido_estado, p.id as pedido_id, p.total as pedido_total
    FROM pedido_items pi
    JOIN pedidos p ON pi.pedido_id = p.id
    WHERE pi.id = ?
  `, [itemId]);

    if (!item) {
        throw new AppError('Item no encontrado', 404);
    }

    if (item.pedido_estado !== 'pendiente') {
        throw new AppError('Solo se pueden eliminar items de pedidos pendientes', 400);
    }

    // Eliminar item
    await dbService.run('DELETE FROM pedido_items WHERE id = ?', [itemId]);

    // Actualizar total del pedido
    const nuevoTotal = item.pedido_total - item.subtotal;
    await dbService.run(`
    UPDATE pedidos SET total = ? WHERE id = ?
  `, [nuevoTotal, item.pedido_id]);

    return {
        success: true,
        message: 'Item eliminado correctamente',
        pedido_id: item.pedido_id,
        nuevo_total: nuevoTotal
    };
};

// Cancelar pedido
const cancelarPedido = async (pedidoId) => {
    const pedido = await dbService.get(`
    SELECT id, estado FROM pedidos WHERE id = ?
  `, [pedidoId]);

    if (!pedido) {
        throw new AppError('Pedido no encontrado', 404);
    }

    if (pedido.estado !== 'pendiente') {
        throw new AppError('Solo se pueden cancelar pedidos pendientes', 400);
    }

    const fechaLima = dbService.getCurrentLimaTime();

    await dbService.run(`
    UPDATE pedidos 
    SET estado = 'cancelado', total = 0, actualizado_en = ?
    WHERE id = ?
  `, [fechaLima, pedidoId]);

    return {
        success: true,
        message: 'Pedido cancelado correctamente'
    };
};

// Cambiar mesa de un pedido pendiente
const cambiarMesa = async (pedidoId, nuevaMesaId) => {
    const pedido = await dbService.get(`
    SELECT id, estado, mesa_id FROM pedidos WHERE id = ?
  `, [pedidoId]);

    if (!pedido) {
        throw new AppError('Pedido no encontrado', 404);
    }

    if (pedido.estado !== 'pendiente') {
        throw new AppError('Solo se pueden cambiar mesa de pedidos pendientes', 400);
    }

    // Verificar que la nueva mesa existe
    const nuevaMesa = await dbService.get(`
    SELECT id, nombre FROM mesas WHERE id = ? AND activo = 1
  `, [nuevaMesaId]);

    if (!nuevaMesa) {
        throw new AppError('Mesa no encontrada', 404);
    }

    // Verificar que la nueva mesa no tiene pedido pendiente
    const pedidoEnNuevaMesa = await dbService.get(`
    SELECT id FROM pedidos 
    WHERE mesa_id = ? AND estado = 'pendiente' AND id != ?
  `, [nuevaMesaId, pedidoId]);

    if (pedidoEnNuevaMesa) {
        throw new AppError('La nueva mesa ya tiene un pedido pendiente', 400);
    }

    const fechaLima = dbService.getCurrentLimaTime();

    await dbService.run(`
    UPDATE pedidos SET mesa_id = ?, actualizado_en = ? WHERE id = ?
  `, [nuevaMesaId, fechaLima, pedidoId]);

    return {
        success: true,
        message: `Pedido movido a mesa ${nuevaMesa.nombre} correctamente`
    };
};

// Obtener todos los pedidos pendientes (para cajero)
const getPedidosPendientes = async () => {
    const pedidos = await dbService.all(`
    SELECT p.id, p.mesa_id, p.total, p.creado_en, m.nombre as mesa_nombre
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    WHERE p.estado = 'pendiente'
    ORDER BY p.creado_en ASC
  `);

    // Para cada pedido, obtener sus items
    const pedidosConItems = await Promise.all(
        pedidos.map(async (pedido) => {
            const items = await dbService.all(`
        SELECT pi.id, pi.cantidad, pi.precio_unitario, pi.subtotal,
               pr.nombre as producto_nombre,
               pv.nombre as variante_nombre
        FROM pedido_items pi
        JOIN productos pr ON pi.producto_id = pr.id
        LEFT JOIN producto_variantes pv ON pi.variante_id = pv.id
        WHERE pi.pedido_id = ?
        ORDER BY pi.agregado_en ASC
      `, [pedido.id]);

            return {
                ...pedido,
                items
            };
        })
    );

    return pedidosConItems;
};

module.exports = {
    getMesasConEstado,
    getPedidoById,
    getPedidoPendienteByMesa,
    crearPedido,
    agregarItem,
    eliminarItem,
    cancelarPedido,
    cambiarMesa,
    getPedidosPendientes
};