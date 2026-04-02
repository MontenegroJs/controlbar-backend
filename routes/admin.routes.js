/**
 * Rutas de administrador
 * Solo accesibles para usuarios con rol 'admin'
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol de admin
router.use(isAuthenticated);
router.use(isAdmin);

// GET /api/admin/resumen-dia - Resumen del día (con filtro opcional de fecha)
router.get('/resumen-dia', adminController.getResumenDia);

// GET /api/admin/pedidos-pagados - Lista de pedidos pagados
router.get('/pedidos-pagados', adminController.getPedidosPagados);

// GET /api/admin/resumen-semanal - Resumen de la semana
router.get('/resumen-semanal', adminController.getResumenSemanal);

// GET /api/admin/ventas - Lista de ventas con filtros
router.get('/ventas', adminController.getVentas);

module.exports = router;