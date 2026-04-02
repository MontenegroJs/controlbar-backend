/**
 * Servicio de reportes
 * Maneja la generación de reportes para el administrador
 */

const dbService = require('./db.service');
const dateHelper = require('../utils/dateHelper');

// Obtener resumen del día (MODIFICADO)
const getResumenDiario = async (fecha = null) => {
  let fechaFiltro = fecha;
  if (!fechaFiltro) {
    fechaFiltro = dateHelper.getLimaDateString();
  }

  const inicioDia = dateHelper.getStartOfDay(fechaFiltro);
  const finDia = dateHelper.getEndOfDay(fechaFiltro);

  // Consulta principal de resumen
  const resumen = await dbService.get(`
    SELECT 
      COUNT(*) as cantidad_pedidos,
      SUM(total) as total_vendido,
      AVG(total) as promedio_venta,
      MIN(total) as venta_minima,
      MAX(total) as venta_maxima,
      SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
      SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
      SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
      SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin
    FROM pedidos
    WHERE estado = 'pagado' 
      AND pagado_en BETWEEN ? AND ?
  `, [inicioDia, finDia]);

  // Contar pedidos por hora
  const pedidosPorHora = await dbService.all(`
    SELECT 
      strftime('%H', pagado_en) as hora,
      COUNT(*) as cantidad,
      SUM(total) as total
    FROM pedidos
    WHERE estado = 'pagado' 
      AND pagado_en BETWEEN ? AND ?
    GROUP BY strftime('%H', pagado_en)
    ORDER BY hora ASC
  `, [inicioDia, finDia]);

  // Top 5 productos más vendidos del día
  const topProductos = await dbService.all(`
    SELECT 
      pr.id,
      pr.nombre as producto_nombre,
      SUM(pi.cantidad) as cantidad_vendida,
      SUM(pi.subtotal) as total_vendido
    FROM pedido_items pi
    JOIN pedidos p ON pi.pedido_id = p.id
    JOIN productos pr ON pi.producto_id = pr.id
    WHERE p.estado = 'pagado' 
      AND p.pagado_en BETWEEN ? AND ?
    GROUP BY pr.id, pr.nombre
    ORDER BY cantidad_vendida DESC
    LIMIT 5
  `, [inicioDia, finDia]);

  // Top 5 mesas con más consumo
  const topMesas = await dbService.all(`
    SELECT 
      m.id,
      m.nombre as mesa_nombre,
      COUNT(p.id) as cantidad_pedidos,
      SUM(p.total) as total_consumido
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    WHERE p.estado = 'pagado' 
      AND p.pagado_en BETWEEN ? AND ?
    GROUP BY m.id, m.nombre
    ORDER BY total_consumido DESC
    LIMIT 5
  `, [inicioDia, finDia]);

  return {
    fecha: fechaFiltro,
    resumen: {
      cantidad_pedidos: resumen?.cantidad_pedidos || 0,
      total_vendido: resumen?.total_vendido || 0,
      promedio_venta: resumen?.promedio_venta || 0,
      venta_minima: resumen?.venta_minima || 0,
      venta_maxima: resumen?.venta_maxima || 0,
      desglose_metodos: {
        efectivo: resumen?.total_efectivo || 0,
        tarjeta: resumen?.total_tarjeta || 0,
        yape: resumen?.total_yape || 0,
        plin: resumen?.total_plin || 0
      }
    },
    pedidos_por_hora: pedidosPorHora,
    top_productos: topProductos,
    top_mesas: topMesas
  };
};

// Obtener lista de pedidos pagados con filtros (MODIFICADO)
const getPedidosPagados = async (filtros = {}) => {
  const { fecha, fecha_desde, fecha_hasta, limite = 50, offset = 0 } = filtros;

  let inicioRango = null;
  let finRango = null;

  // Lógica de filtrado por fecha
  if (fecha) {
    inicioRango = dateHelper.getStartOfDay(fecha);
    finRango = dateHelper.getEndOfDay(fecha);
  } else if (fecha_desde && fecha_hasta) {
    inicioRango = dateHelper.getStartOfDay(fecha_desde);
    finRango = dateHelper.getEndOfDay(fecha_hasta);
  } else {
    const hoy = dateHelper.getLimaDateString();
    inicioRango = dateHelper.getStartOfDay(hoy);
    finRango = dateHelper.getEndOfDay(hoy);
  }

  // Construir consulta SQL con filtro de rango
  let sql = `
    SELECT 
      p.id,
      p.numero_ticket,
      m.nombre as mesa_nombre,
      p.total,
      p.metodo_pago,
      p.referencia_pago,
      p.pagado_en,
      p.creado_en,
      (SELECT COUNT(*) FROM pedido_items WHERE pedido_id = p.id) as cantidad_items
    FROM pedidos p
    JOIN mesas m ON p.mesa_id = m.id
    WHERE p.estado = 'pagado' 
      AND p.pagado_en BETWEEN ? AND ?
    ORDER BY p.pagado_en DESC
    LIMIT ? OFFSET ?
  `;

  const params = [inicioRango, finRango, limite, offset];

  // Obtener pedidos
  const pedidos = await dbService.all(sql, params);

  // Obtener total de registros para paginación
  const countSql = `
    SELECT COUNT(*) as total
    FROM pedidos p
    WHERE p.estado = 'pagado' 
      AND p.pagado_en BETWEEN ? AND ?
  `;

  const total = await dbService.get(countSql, [inicioRango, finRango]);

  // Para cada pedido, obtener sus items
  const pedidosConItems = await Promise.all(
    pedidos.map(async (pedido) => {
      const items = await dbService.all(`
        SELECT 
          pi.id,
          pi.cantidad,
          pi.precio_unitario,
          pi.subtotal,
          pr.nombre as producto_nombre,
          pv.nombre as variante_nombre
        FROM pedido_items pi
        JOIN productos pr ON pi.producto_id = pr.id
        LEFT JOIN producto_variantes pv ON pi.variante_id = pv.id
        WHERE pi.pedido_id = ?
        ORDER BY pi.agregado_en ASC
      `, [pedido.id]);

      return {
        ...pedido,
        items
      };
    })
  );

  return {
    data: pedidosConItems,
    paginacion: {
      total: total?.total || 0,
      limite,
      offset,
      pagina: Math.floor(offset / limite) + 1,
      total_paginas: Math.ceil((total?.total || 0) / limite)
    },
    filtros_aplicados: {
      desde: inicioRango,
      hasta: finRango
    }
  };
};

// Obtener resumen semanal (MODIFICADO)
const getResumenSemanal = async () => {
  const hoy = new Date();
  const fechaInicio = new Date(hoy);
  fechaInicio.setDate(hoy.getDate() - 6); // Últimos 7 días

  const inicioStr = dateHelper.getStartOfDay(fechaInicio.toISOString().split('T')[0]);
  const finStr = dateHelper.getEndOfDay(hoy.toISOString().split('T')[0]);

  const resumenDiario = await dbService.all(`
    SELECT 
      DATE(pagado_en) as fecha,
      COUNT(*) as cantidad_pedidos,
      SUM(total) as total_vendido
    FROM pedidos
    WHERE estado = 'pagado' 
      AND pagado_en BETWEEN ? AND ?
    GROUP BY DATE(pagado_en)
    ORDER BY fecha ASC
  `, [inicioStr, finStr]);

  const totalSemana = await dbService.get(`
    SELECT 
      COUNT(*) as total_pedidos,
      SUM(total) as total_vendido,
      AVG(total) as promedio_venta
    FROM pedidos
    WHERE estado = 'pagado' 
      AND pagado_en BETWEEN ? AND ?
  `, [inicioStr, finStr]);

  return {
    periodo: {
      desde: fechaInicio.toISOString().split('T')[0],
      hasta: hoy.toISOString().split('T')[0]
    },
    resumen_diario: resumenDiario,
    total_semana: {
      cantidad_pedidos: totalSemana?.total_pedidos || 0,
      total_vendido: totalSemana?.total_vendido || 0,
      promedio_venta: totalSemana?.promedio_venta || 0
    }
  };
};

// Obtener resumen por rango de fechas
const getResumenPorRango = async (fecha_desde, fecha_hasta) => {
  const inicioRango = dateHelper.getStartOfDay(fecha_desde);
  const finRango = dateHelper.getEndOfDay(fecha_hasta);

  const resumen = await dbService.get(`
    SELECT 
      COUNT(*) as cantidad_pedidos,
      SUM(total) as total_vendido,
      AVG(total) as promedio_venta,
      SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
      SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
      SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
      SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin
    FROM pedidos
    WHERE estado = 'pagado' AND pagado_en BETWEEN ? AND ?
  `, [inicioRango, finRango]);

  return {
    desde: fecha_desde,
    hasta: fecha_hasta,
    cantidad_pedidos: resumen?.cantidad_pedidos || 0,
    total_vendido: resumen?.total_vendido || 0,
    promedio_venta: resumen?.promedio_venta || 0,
    desglose_metodos: {
      efectivo: resumen?.total_efectivo || 0,
      tarjeta: resumen?.total_tarjeta || 0,
      yape: resumen?.total_yape || 0,
      plin: resumen?.total_plin || 0
    }
  };
};

module.exports = {
  getResumenDiario,
  getPedidosPagados,
  getResumenSemanal,
  getResumenPorRango
};