const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'controlbar.db');

// Eliminar base de datos existente si es necesario (para limpiar)
if (fs.existsSync(dbPath)) {
    console.log('🗑️  Eliminando base de datos existente...');
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

// Leer y ejecutar schema.sql
const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const seedsSQL = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');

console.log('📦 Creando estructura de tablas...');

// Ejecutar schema
db.exec(schemaSQL, (err) => {
    if (err) {
        console.error('❌ Error al crear esquema:', err.message);
        process.exit(1);
    }
    console.log('✅ Esquema creado correctamente');

    // Ejecutar seeds
    console.log('🌱 Insertando datos de prueba...');
    db.exec(seedsSQL, (err) => {
        if (err) {
            console.error('❌ Error al insertar seeds:', err.message);
            process.exit(1);
        }

        console.log('✅ Datos de prueba insertados');

        // Actualizar hashes de contraseñas con bcrypt real
        console.log('🔐 Actualizando hashes de contraseñas...');

        const updatePassword = (username, plainPassword) => {
            const hash = bcrypt.hashSync(plainPassword, 10);
            db.run(
                'UPDATE usuarios SET password_hash = ? WHERE username = ?',
                [hash, username],
                (err) => {
                    if (err) console.error(`Error al actualizar ${username}:`, err.message);
                    else console.log(`   ✓ ${username} actualizado`);
                }
            );
        };

        updatePassword('mozo', 'mozo123');
        updatePassword('cajero', 'cajero123');
        updatePassword('admin', 'admin123');

        // Verificar tablas creadas
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                console.error('Error al listar tablas:', err.message);
            } else {
                console.log('\n📋 Tablas creadas:');
                tables.forEach(table => console.log(`   - ${table.name}`));
            }

            // Verificar mesas
            db.get('SELECT COUNT(*) as count FROM mesas', [], (err, result) => {
                if (!err && result) {
                    console.log(`\n🪑 Mesas creadas: ${result.count}/15`);
                }

                console.log('\n🎉 Base de datos inicializada correctamente!');
                db.close();
            });
        });
    });
});