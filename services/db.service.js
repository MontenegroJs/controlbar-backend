const db = require('../config/database');
const dateHelper = require('../utils/dateHelper');

// Ejecutar query con promesas
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// Obtener un solo registro
const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

// Obtener múltiples registros
const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Ejecutar múltiples queries en una transacción
const transaction = async (callback) => {
    try {
        await run('BEGIN TRANSACTION');
        const result = await callback();
        await run('COMMIT');
        return result;
    } catch (error) {
        await run('ROLLBACK');
        throw error;
    }
};

// Obtener el próximo número de ticket (correlativo global)
const getNextTicketNumber = async () => {
    const result = await get(`
    SELECT MAX(numero_ticket) as max_ticket FROM pedidos
  `);
    return (result?.max_ticket || 0) + 1;
};

// Verificar si una mesa tiene pedido pendiente
const getPedidoPendienteByMesa = async (mesaId) => {
    return await get(`
    SELECT id FROM pedidos 
    WHERE mesa_id = ? AND estado = 'pendiente'
  `, [mesaId]);
};

// Obtener fecha actual en hora Lima para SQLite
const getCurrentLimaTime = () => {
    return dateHelper.getLimaDateTime();
};

module.exports = {
    run,
    get,
    all,
    transaction,
    getNextTicketNumber,
    getPedidoPendienteByMesa,
    getCurrentLimaTime
};