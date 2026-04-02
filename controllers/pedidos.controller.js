/**
 * Controlador de mesas y pedidos
 * Maneja las peticiones relacionadas con mesas y gestión de pedidos
 */

const pedidoService = require('../services/pedido.service');
const { AppError } = require('../middlewares/error.middleware');

// Obtener todas las mesas con estado
const getMesas = async (req, res, next) => {
    try {
        const mesas = await pedidoService.getMesasConEstado();
        res.json({
            success: true,
            data: mesas
        });
    } catch (error) {
        next(error);
    }
};

// Obtener pedido por ID
const getPedidoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pedido = await pedidoService.getPedidoById(id);

        if (!pedido) {
            throw new AppError('Pedido no encontrado', 404);
        }

        res.json({
            success: true,
            data: pedido
        });
    } catch (error) {
        next(error);
    }
};

// Obtener pedido pendiente por mesa
const getPedidoByMesa = async (req, res, next) => {
    try {
        const { mesaId } = req.params;

        // Validar que mesaId existe
        const mesa = await require('../config/database').get(
            'SELECT id FROM mesas WHERE id = ? AND activo = 1',
            [mesaId]
        );

        if (!mesa) {
            throw new AppError('Mesa no encontrada', 404);
        }

        const pedido = await pedidoService.getPedidoPendienteByMesa(mesaId);

        res.json({
            success: true,
            data: pedido || null
        });
    } catch (error) {
        next(error);
    }
};

// Crear nuevo pedido para una mesa
const crearPedido = async (req, res, next) => {
    try {
        const { mesaId } = req.params;
        const pedido = await pedidoService.crearPedido(mesaId);

        res.status(201).json({
            success: true,
            message: 'Pedido creado correctamente',
            data: pedido
        });
    } catch (error) {
        next(error);
    }
};

// Agregar item a pedido
const agregarItem = async (req, res, next) => {
    try {
        const { pedidoId } = req.params;
        const { producto_id, variante_id, cantidad } = req.body;

        if (!producto_id || !cantidad) {
            throw new AppError('Producto y cantidad son obligatorios', 400);
        }

        const item = await pedidoService.agregarItem(pedidoId, producto_id, variante_id, cantidad);

        res.status(201).json({
            success: true,
            message: 'Item agregado correctamente',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// Eliminar item de pedido
const eliminarItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const result = await pedidoService.eliminarItem(itemId);

        res.json({
            success: true,
            message: result.message,
            data: {
                pedido_id: result.pedido_id,
                nuevo_total: result.nuevo_total
            }
        });
    } catch (error) {
        next(error);
    }
};

// Cancelar pedido
const cancelarPedido = async (req, res, next) => {
    try {
        const { pedidoId } = req.params;
        const result = await pedidoService.cancelarPedido(pedidoId);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Cambiar mesa de pedido
const cambiarMesa = async (req, res, next) => {
    try {
        const { pedidoId } = req.params;
        const { mesa_id } = req.body;

        if (!mesa_id) {
            throw new AppError('Mesa destino es obligatoria', 400);
        }

        const result = await pedidoService.cambiarMesa(pedidoId, mesa_id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Obtener pedidos pendientes (para cajero)
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

module.exports = {
    getMesas,
    getPedidoById,
    getPedidoByMesa,
    crearPedido,
    agregarItem,
    eliminarItem,
    cancelarPedido,
    cambiarMesa,
    getPedidosPendientes
};