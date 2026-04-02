/**
 * Controlador de productos
 * Maneja las peticiones relacionadas con productos y categorías
 */

const productoService = require('../services/producto.service');
const { AppError } = require('../middlewares/error.middleware');

// Obtener todas las categorías
const getCategorias = async (req, res, next) => {
    try {
        const categorias = await productoService.getCategorias();
        res.json({
            success: true,
            data: categorias
        });
    } catch (error) {
        next(error);
    }
};

// Obtener todos los productos con sus variantes
const getProductos = async (req, res, next) => {
    try {
        const productos = await productoService.getProductosWithVariantes();
        res.json({
            success: true,
            data: productos
        });
    } catch (error) {
        next(error);
    }
};

// Obtener productos por categoría
const getProductosByCategoria = async (req, res, next) => {
    try {
        const { categoriaId } = req.params;

        if (!categoriaId) {
            throw new AppError('ID de categoría es requerido', 400);
        }

        const productos = await productoService.getProductosByCategoria(categoriaId);
        res.json({
            success: true,
            data: productos
        });
    } catch (error) {
        next(error);
    }
};

// Obtener un producto específico
const getProductoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const producto = await productoService.getProductoById(id);

        if (!producto) {
            throw new AppError('Producto no encontrado', 404);
        }

        res.json({
            success: true,
            data: producto
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategorias,
    getProductos,
    getProductosByCategoria,
    getProductoById
};