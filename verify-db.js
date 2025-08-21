// Script para verificar estructura de base de datos
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db', 'packing_list.db');
console.log('Ruta de la base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
        return;
    }
    console.log('✅ Conectado a la base de datos SQLite');
});

// Verificar tablas existentes
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error obteniendo tablas:', err.message);
        return;
    }
    
    console.log('\n📊 Tablas existentes:');
    tables.forEach(table => {
        console.log(`- ${table.name}`);
    });
    
    // Si hay tablas, mostrar su estructura
    if (tables.length > 0) {
        console.log('\n🏗️ Estructura de tablas:');
        
        let completed = 0;
        tables.forEach(table => {
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (!err) {
                    console.log(`\n📋 Tabla: ${table.name}`);
                    columns.forEach(col => {
                        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                    });
                }
                
                completed++;
                if (completed === tables.length) {
                    db.close();
                }
            });
        });
    } else {
        console.log('⚠️ No se encontraron tablas en la base de datos');
        db.close();
    }
});
