/**
 * Controlador de administrador
 * Maneja las peticiones de reportes y gestión administrativa
 */

const reporteService = require('../services/reporte.service');
const dbService = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

// Obtener resumen del día
const getResumenDia = async (req, res, next) => {
    try {
        const { fecha } = req.query;
        const resumen = await reporteService.getResumenDiario(fecha);

        res.json({
            success: true,
            data: resumen
        });
    } catch (error) {
        next(error);
    }
};

// Obtener lista de pedidos pagados
const getPedidosPagados = async (req, res, next) => {
    try {
        const { fecha, fecha_desde, fecha_hasta, limite = 50, pagina = 1 } = req.query;
        const offset = (pagina - 1) * limite;

        const pedidos = await reporteService.getPedidosPagados({
            fecha,
            fecha_desde,
            fecha_hasta,
            limite: parseInt(limite),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: pedidos
        });
    } catch (error) {
        next(error);
    }
};

// Obtener resumen semanal
const getResumenSemanal = async (req, res, next) => {
    try {
        const resumen = await reporteService.getResumenSemanal();

        res.json({
            success: true,
            data: resumen
        });
    } catch (error) {
        next(error);
    }
};

// Obtener todas las ventas (con filtros avanzados)
const getVentas = async (req, res, next) => {
    try {
        const { fecha_desde, fecha_hasta, metodo_pago, limite = 100, pagina = 1 } = req.query;
        const offset = (pagina - 1) * limite;

        let sql = `
      SELECT 
        p.id,
        p.numero_ticket,
        m.nombre as mesa_nombre,
        p.total,
        p.metodo_pago,
        p.referencia_pago,
        p.pagado_en,
        p.creado_en
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      WHERE p.estado = 'pagado'
    `;

        const params = [];

        if (fecha_desde) {
            sql += ` AND DATE(p.pagado_en) >= ?`;
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            sql += ` AND DATE(p.pagado_en) <= ?`;
            params.push(fecha_hasta);
        }

        if (metodo_pago) {
            sql += ` AND p.metodo_pago = ?`;
            params.push(metodo_pago);
        }

        sql += ` ORDER BY p.pagado_en DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limite), parseInt(offset));

        const ventas = await dbService.all(sql, params);

        // Contar total
        let countSql = `
      SELECT COUNT(*) as total
      FROM pedidos p
      WHERE p.estado = 'pagado'
    `;

        const countParams = [];
        if (fecha_desde) {
            countSql += ` AND DATE(p.pagado_en) >= ?`;
            countParams.push(fecha_desde);
        }
        if (fecha_hasta) {
            countSql += ` AND DATE(p.pagado_en) <= ?`;
            countParams.push(fecha_hasta);
        }
        if (metodo_pago) {
            countSql += ` AND p.metodo_pago = ?`;
            countParams.push(metodo_pago);
        }

        const total = await dbService.get(countSql, countParams);

        res.json({
            success: true,
            data: ventas,
            paginacion: {
                total: total?.total || 0,
                limite: parseInt(limite),
                offset: parseInt(offset),
                pagina: parseInt(pagina),
                total_paginas: Math.ceil((total?.total || 0) / parseInt(limite))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getResumenDia,
    getPedidosPagados,
    getResumenSemanal,
    getVentas
};