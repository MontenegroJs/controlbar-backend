/**
 * Rutas de productos y categorías
 */

const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET /api/categorias - Obtener todas las categorías
router.get('/categorias', productosController.getCategorias);

// GET /api/productos - Obtener todos los productos con variantes
router.get('/productos', productosController.getProductos);

// GET /api/productos/categoria/:categoriaId - Obtener productos por categoría
router.get('/productos/categoria/:categoriaId', productosController.getProductosByCategoria);

// GET /api/productos/:id - Obtener un producto específico
router.get('/productos/:id', productosController.getProductoById);

module.exports = router;