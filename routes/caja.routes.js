/**
 * Rutas de caja y cobros
 */

const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');
const { isAuthenticated, isCajero } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol de cajero
router.use(isAuthenticated);
router.use(isCajero);

// GET /api/caja/pedidos-pendientes - Obtener pedidos pendientes (polling)
router.get('/pedidos-pendientes', cajaController.getPedidosPendientes);

// POST /api/caja/cobrar/:pedidoId - Procesar cobro
router.post('/cobrar/:pedidoId', cajaController.cobrarPedido);

// GET /api/caja/resumen - Obtener resumen de caja del día
router.get('/resumen', cajaController.getResumenCaja);

module.exports = router;