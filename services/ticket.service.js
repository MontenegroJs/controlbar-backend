/**
 * Servicio de generación de tickets
 * Formatea y prepara el ticket para impresión
 */

const dbService = require('./db.service');

// Formatear fecha y hora
const formatDateTime = (date) => {
    const d = new Date(date);
    return {
        fecha: d.toLocaleDateString('es-PE'),
        hora: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };
};

// Formatear precio con 2 decimales
const formatPrice = (price) => {
    return `S/ ${price.toFixed(2)}`;
};

// Generar contenido del ticket
const generarTicket = async (pedidoId) => {
    // Obtener datos del pedido con items
    const pedido = await dbService.get(`
    SELECT p.*, m.nombre as mesa_nombre
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    WHERE p.id = ?
  `, [pedidoId]);

    if (!pedido) {
        throw new Error('Pedido no encontrado');
    }

    // Obtener items del pedido
    const items = await dbService.all(`
    SELECT pi.*, pr.nombre as producto_nombre, pv.nombre as variante_nombre
    FROM pedido_items pi
    JOIN productos pr ON pi.producto_id = pr.id
    LEFT JOIN producto_variantes pv ON pi.variante_id = pv.id
    WHERE pi.pedido_id = ?
    ORDER BY pi.agregado_en ASC
  `, [pedidoId]);

    const { fecha, hora } = formatDateTime(pedido.pagado_en || new Date());

    // Construir contenido del ticket
    let ticket = '';
    ticket += '='.repeat(40) + '\n';
    ticket += '         CONTROL BAR          \n';
    ticket += '        TICKET DE VENTA        \n';
    ticket += '='.repeat(40) + '\n';
    ticket += `Ticket N°: ${pedido.numero_ticket}\n`;
    ticket += `Mesa: ${pedido.mesa_nombre}\n`;
    ticket += `Fecha: ${fecha}\n`;
    ticket += `Hora: ${hora}\n`;
    ticket += '-'.repeat(40) + '\n';
    ticket += 'PRODUCTO                    TOTAL\n';
    ticket += '-'.repeat(40) + '\n';

    items.forEach(item => {
        let nombre = item.producto_nombre;
        if (item.variante_nombre) {
            nombre += ` (${item.variante_nombre})`;
        }
        const itemTotal = item.subtotal;
        ticket += `${nombre}\n`;
        ticket += `  ${item.cantidad} x ${formatPrice(item.precio_unitario)}`;
        ticket += `     ${formatPrice(itemTotal)}\n`;
    });

    ticket += '-'.repeat(40) + '\n';
    ticket += `TOTAL:                     ${formatPrice(pedido.total)}\n`;
    ticket += '-'.repeat(40) + '\n';
    ticket += `Método de pago: ${pedido.metodo_pago?.toUpperCase() || '-'}\n`;

    if (pedido.metodo_pago === 'efectivo') {
        ticket += `Recibido: ${formatPrice(pedido.monto_recibido)}\n`;
        ticket += `Vuelto: ${formatPrice(pedido.vuelto)}\n`;
    }

    if (pedido.referencia_pago) {
        ticket += `Referencia: ${pedido.referencia_pago}\n`;
    }

    ticket += '='.repeat(40) + '\n';
    ticket += '     ¡GRACIAS POR SU VISITA!     \n';
    ticket += '='.repeat(40) + '\n';

    return {
        pedidoId: pedido.id,
        numeroTicket: pedido.numero_ticket,
        contenido: ticket,
        items,
        total: pedido.total,
        metodoPago: pedido.metodo_pago
    };
};

// Simular impresión (en desarrollo, mostrar en consola)
const imprimirTicket = async (pedidoId) => {
    const ticket = await generarTicket(pedidoId);
    console.log('\n' + '='.repeat(40));
    console.log('🖨️  IMPRESIÓN DE TICKET');
    console.log('='.repeat(40));
    console.log(ticket.contenido);
    console.log('='.repeat(40));
    console.log('✅ Ticket generado correctamente');
    return ticket;
};

module.exports = {
    generarTicket,
    imprimirTicket,
    formatPrice
};