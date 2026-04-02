/**
 * Script de migración para corregir zona horaria de fechas existentes
 * Ejecutar: node db/migration-timezone.js
 */

const db = require('../config/database');

console.log('🕒 Corrigiendo zona horaria de fechas existentes...');

// Convertir fechas existentes de UTC a Lima (UTC-5)
db.run(`
  UPDATE pedidos 
  SET 
    creado_en = datetime(creado_en, '-5 hours'),
    actualizado_en = datetime(actualizado_en, '-5 hours'),
    pagado_en = datetime(pagado_en, '-5 hours')
  WHERE creado_en IS NOT NULL
`, function (err) {
    if (err) {
        console.error('❌ Error al migrar fechas:', err.message);
    } else {
        console.log(`✅ ${this.changes} registros actualizados a hora Lima`);
    }

    // También actualizar items de pedido si es necesario
    db.run(`
    UPDATE pedido_items 
    SET agregado_en = datetime(agregado_en, '-5 hours')
    WHERE agregado_en IS NOT NULL
  `, function (err) {
        if (err) {
            console.error('❌ Error al migrar fechas de items:', err.message);
        } else {
            console.log(`✅ ${this.changes} items actualizados a hora Lima`);
        }

        db.close();
        console.log('🎉 Migración completada');
    });
});