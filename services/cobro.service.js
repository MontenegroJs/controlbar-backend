/**
 * Servicio de cobro
 * Maneja la lógica de pago, validaciones y generación de ticket
 */

const dbService = require('./db.service');
const ticketService = require('./ticket.service');
const { AppError } = require('../middlewares/error.middleware');

// Procesar cobro de pedido
const procesarCobro = async (pedidoId, datosPago) => {
    const { metodo_pago, monto_recibido, referencia_pago } = datosPago;

    // Obtener pedido con sus datos
    const pedido = await dbService.get(`
    SELECT p.*, m.nombre as mesa_nombre
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    WHERE p.id = ?
  `, [pedidoId]);

    if (!pedido) {
        throw new AppError('Pedido no encontrado', 404);
    }

    // Validar estado del pedido
    if (pedido.estado !== 'pendiente') {
        throw new AppError(`No se puede cobrar un pedido en estado ${pedido.estado}`, 400);
    }

    // Validar que el pedido no esté vacío
    if (pedido.total <= 0) {
        throw new AppError('No se puede cobrar un pedido con total 0', 400);
    }

    // Validar método de pago
    const metodosPermitidos = ['efectivo', 'tarjeta', 'yape', 'plin'];
    if (!metodosPermitidos.includes(metodo_pago)) {
        throw new AppError(`Método de pago no válido. Permitidos: ${metodosPermitidos.join(', ')}`, 400);
    }

    let vuelto = null;
    let montoRecibido = null;
    let referencia = null;

    // Validaciones según método de pago
    switch (metodo_pago) {
        case 'efectivo':
            if (!monto_recibido || monto_recibido <= 0) {
                throw new AppError('Para pago en efectivo, el monto recibido es obligatorio', 400);
            }
            if (monto_recibido < pedido.total) {
                throw new AppError(`Monto insuficiente. Total: S/ ${pedido.total.toFixed(2)}`, 400);
            }
            montoRecibido = monto_recibido;
            vuelto = monto_recibido - pedido.total;
            break;

        case 'yape':
        case 'plin':
            if (!referencia_pago || referencia_pago.trim() === '') {
                throw new AppError(`Para pago con ${metodo_pago.toUpperCase()}, el código de operación es obligatorio`, 400);
            }
            if (referencia_pago.length < 6) {
                throw new AppError('El código de operación debe tener al menos 6 caracteres', 400);
            }
            referencia = referencia_pago;
            break;

        case 'tarjeta':
            // No requiere validaciones adicionales
            break;
    }

    // Generar número de ticket correlativo global
    const numeroTicket = await dbService.getNextTicketNumber();

    // Obtener fecha actual en hora Lima
    const fechaLima = dbService.getCurrentLimaTime();

    // Actualizar pedido con fecha en hora Lima
    await dbService.run(`
    UPDATE pedidos 
    SET estado = 'pagado',
        metodo_pago = ?,
        monto_recibido = ?,
        vuelto = ?,
        referencia_pago = ?,
        numero_ticket = ?,
        pagado_en = ?,
        actualizado_en = ?
    WHERE id = ?
  `, [metodo_pago, montoRecibido, vuelto, referencia, numeroTicket, fechaLima, fechaLima, pedidoId]);

    // Generar ticket
    const ticket = await ticketService.generarTicket(pedidoId);

    // Imprimir ticket (en consola para desarrollo)
    await ticketService.imprimirTicket(pedidoId);

    return {
        success: true,
        message: 'Cobro procesado correctamente',
        data: {
            pedido_id: pedidoId,
            mesa: pedido.mesa_nombre,
            total: pedido.total,
            metodo_pago,
            numero_ticket: numeroTicket,
            vuelto,
            ticket
        }
    };
};  

// Obtener resumen de caja del día
const getResumenCaja = async () => {
    const hoy = new Date().toISOString().split('T')[0];

    const resumen = await dbService.get(`
    SELECT 
      COUNT(*) as cantidad_pedidos,
      SUM(total) as total_vendido,
      SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
      SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
      SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
      SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin
    FROM pedidos
    WHERE estado = 'pagado' AND DATE(pagado_en) = ?
  `, [hoy]);

    return {
        fecha: hoy,
        ...resumen,
        total_vendido: resumen?.total_vendido || 0,
        cantidad_pedidos: resumen?.cantidad_pedidos || 0,
        desglose: {
            efectivo: resumen?.total_efectivo || 0,
            tarjeta: resumen?.total_tarjeta || 0,
            yape: resumen?.total_yape || 0,
            plin: resumen?.total_plin || 0
        }
    };
};

module.exports = {
    procesarCobro,
    getResumenCaja
};