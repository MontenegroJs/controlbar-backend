/**
 * Servicio de productos
 * Maneja la lógica de negocio para productos, categorías y variantes
 */

const dbService = require('./db.service');

// Obtener todas las categorías activas
const getCategorias = async () => {
    return await dbService.all(`
    SELECT id, nombre 
    FROM categorias 
    WHERE activo = 1 
    ORDER BY nombre
  `);
};

// Obtener todos los productos con sus variantes
const getProductosWithVariantes = async () => {
    // Obtener todos los productos activos
    const productos = await dbService.all(`
    SELECT p.id, p.categoria_id, p.nombre, p.precio_base, c.nombre as categoria_nombre
    FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
    WHERE p.activo = 1
    ORDER BY c.nombre, p.nombre
  `);

    // Obtener todas las variantes activas
    const variantes = await dbService.all(`
    SELECT pv.id, pv.producto_id, pv.nombre, pv.precio_extra
    FROM producto_variantes pv
    WHERE pv.activo = 1
    ORDER BY pv.producto_id, pv.nombre
  `);

    // Agrupar variantes por producto
    const variantesPorProducto = {};
    variantes.forEach(variante => {
        if (!variantesPorProducto[variante.producto_id]) {
            variantesPorProducto[variante.producto_id] = [];
        }
        variantesPorProducto[variante.producto_id].push({
            id: variante.id,
            nombre: variante.nombre,
            precio_extra: variante.precio_extra
        });
    });

    // Construir respuesta con productos y sus variantes
    const productosConVariantes = productos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre,
        precio_base: producto.precio_base,
        categoria_id: producto.categoria_id,
        categoria_nombre: producto.categoria_nombre,
        variantes: variantesPorProducto[producto.id] || []
    }));

    return productosConVariantes;
};

// Obtener productos por categoría
const getProductosByCategoria = async (categoriaId) => {
    const productos = await dbService.all(`
    SELECT p.id, p.nombre, p.precio_base
    FROM productos p
    WHERE p.categoria_id = ? AND p.activo = 1
    ORDER BY p.nombre
  `, [categoriaId]);

    // Obtener variantes para estos productos
    const productoIds = productos.map(p => p.id);
    if (productoIds.length === 0) return productos;

    const placeholders = productoIds.map(() => '?').join(',');
    const variantes = await dbService.all(`
    SELECT pv.id, pv.producto_id, pv.nombre, pv.precio_extra
    FROM producto_variantes pv
    WHERE pv.producto_id IN (${placeholders}) AND pv.activo = 1
  `, productoIds);

    const variantesPorProducto = {};
    variantes.forEach(variante => {
        if (!variantesPorProducto[variante.producto_id]) {
            variantesPorProducto[variante.producto_id] = [];
        }
        variantesPorProducto[variante.producto_id].push({
            id: variante.id,
            nombre: variante.nombre,
            precio_extra: variante.precio_extra
        });
    });

    return productos.map(producto => ({
        ...producto,
        variantes: variantesPorProducto[producto.id] || []
    }));
};

// Obtener un producto específico con sus variantes
const getProductoById = async (productoId) => {
    const producto = await dbService.get(`
    SELECT p.id, p.categoria_id, p.nombre, p.precio_base, p.activo, c.nombre as categoria_nombre
    FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
    WHERE p.id = ?
  `, [productoId]);

    if (!producto) return null;

    const variantes = await dbService.all(`
    SELECT id, nombre, precio_extra
    FROM producto_variantes
    WHERE producto_id = ? AND activo = 1
    ORDER BY nombre
  `, [productoId]);

    return {
        ...producto,
        variantes
    };
};

// Validar producto y variante (para agregar a pedido)
const validarProductoYVariante = async (productoId, varianteId) => {
    // Obtener producto
    const producto = await dbService.get(`
    SELECT id, nombre, precio_base, activo
    FROM productos
    WHERE id = ? AND activo = 1
  `, [productoId]);

    if (!producto) {
        throw new Error('Producto no encontrado o inactivo');
    }

    let variante = null;
    let precioExtra = 0;

    // Si se especificó variante, validarla
    if (varianteId) {
        variante = await dbService.get(`
      SELECT id, nombre, precio_extra, activo
      FROM producto_variantes
      WHERE id = ? AND producto_id = ? AND activo = 1
    `, [varianteId, productoId]);

        if (!variante) {
            throw new Error('Variante no encontrada o inactiva para este producto');
        }
        precioExtra = variante.precio_extra;
    }

    const precioUnitario = producto.precio_base + precioExtra;

    return {
        producto,
        variante,
        precioUnitario,
        precioBase: producto.precio_base,
        precioExtra
    };
};

module.exports = {
    getCategorias,
    getProductosWithVariantes,
    getProductosByCategoria,
    getProductoById,
    validarProductoYVariante
};