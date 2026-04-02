/**
 * Controlador de caja
 * Maneja las peticiones relacionadas con cobros
 */

const cobroService = require('../services/cobro.service');
const pedidoService = require('../services/pedido.service');
const { AppError } = require('../middlewares/error.middleware');

// Procesar cobro de pedido
const cobrarPedido = async (req, res, next) => {
    try {
        const { pedidoId } = req.params;
        const { metodo_pago, monto_recibido, referencia_pago } = req.body;

        if (!metodo_pago) {
            throw new AppError('Método de pago es obligatorio', 400);
        }

        const result = await cobroService.procesarCobro(pedidoId, {
            metodo_pago,
            monto_recibido,
            referencia_pago
        });

        res.json(result);

    } catch (error) {
        next(error);
    }
};

// Obtener pedidos pendientes (para polling del cajero)
const getPedidosPendientes = async (req, res, next) => {
    try {
        const pedidos = await pedidoService.getPedidosPendientes();
        res.json({
            success: true,
            data: pedidos
        });
    } catch (error) {
        next(error);
    }
};

// Obtener resumen de caja del día
const getResumenCaja = async (req, res, next) => {
    try {
        const resumen = await cobroService.getResumenCaja();
        res.json({
            success: true,
            data: resumen
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    cobrarPedido,
    getPedidosPendientes,
    getResumenCaja
};