/**
 * Rutas de mesas y pedidos
 */

const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const { isAuthenticated, isMozo, isCajero, isMozoOrAdmin } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// ============================================
// MESAS
// ============================================
// GET /api/mesas - Obtener todas las mesas con estado
router.get('/mesas', pedidosController.getMesas);

// ============================================
// PEDIDOS (para mozo)
// ============================================
// GET /api/pedidos/mesa/:mesaId - Obtener pedido pendiente por mesa
router.get('/pedidos/mesa/:mesaId', isMozo, pedidosController.getPedidoByMesa);

// POST /api/pedidos/mesa/:mesaId - Crear nuevo pedido
router.post('/pedidos/mesa/:mesaId', isMozo, pedidosController.crearPedido);

// GET /api/pedidos/:id - Obtener pedido por ID
router.get('/pedidos/:id', isMozoOrAdmin, pedidosController.getPedidoById);

// POST /api/pedidos/:pedidoId/items - Agregar item
router.post('/pedidos/:pedidoId/items', isMozo, pedidosController.agregarItem);

// DELETE /api/pedido-items/:itemId - Eliminar item
router.delete('/pedido-items/:itemId', isMozo, pedidosController.eliminarItem);

// PUT /api/pedidos/:pedidoId/cancelar - Cancelar pedido
router.put('/pedidos/:pedidoId/cancelar', isMozo, pedidosController.cancelarPedido);

// PUT /api/pedidos/:pedidoId/mesa - Cambiar mesa
router.put('/pedidos/:pedidoId/mesa', isMozo, pedidosController.cambiarMesa);

// ============================================
// PEDIDOS (para cajero)
// ============================================
// GET /api/pedidos/pendientes - Obtener todos los pedidos pendientes
router.get('/pedidos/pendientes', isCajero, pedidosController.getPedidosPendientes);

module.exports = router;