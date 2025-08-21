import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a la base de datos
const dbPath = path.join(__dirname, '..', 'db', 'packing_list.db');
console.log('Conectando a base de datos:', dbPath);

const db = new sqlite3.Database(dbPath);

// Función para crear datos de prueba
function createTestData() {
    // Primero verificar qué tablas existen
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.log('Error al listar tablas:', err.message);
            return;
        }
        console.log('📋 Tablas disponibles:', tables.map(t => t.name));
        
        // Verificar estructura de tabla carga
        db.all("PRAGMA table_info(carga)", (err, columns) => {
            if (err) {
                console.log('Error al obtener info de tabla carga:', err.message);
                return;
            }
            console.log('📋 Estructura tabla carga:');
            console.table(columns);

            // Ahora insertar datos usando la estructura correcta
            insertTestData();
        });
    });
}

function insertTestData() {
    // Insertar cliente primero
    db.run(`INSERT OR IGNORE INTO cliente (id_cliente, nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente) 
            VALUES (1, 'Cliente Test', 'test@test.com', '123456789', 'Bogotá', 'Colombia')`, function(err) {
        if (err) {
            console.log('Error al insertar cliente:', err.message);
        } else {
            console.log('✅ Cliente creado/verificado');
        }
    });

    // Insertar carga con estructura correcta
    db.run(`INSERT OR IGNORE INTO carga (id_carga, codigo_carga, fecha_inicio, ciudad_destino, direccion_destino, archivo_original, id_cliente) 
            VALUES (3, 'TEST-CARGA-3', date('now'), 'Miami', 'Test Address', 'test_file.xlsx', 1)`, function(err) {
        if (err) {
            console.log('Error al insertar carga:', err.message);
            return;
        }
        console.log('✅ Carga 3 creada/verificada');

        // Insertar artículos de packing list
        const articulos = [
            { id_carga: 3, descripcion_espanol: 'Test Item 1', unidades_empaque: 5 },
            { id_carga: 3, descripcion_espanol: 'Test Item 2', unidades_empaque: 10 },
            { id_carga: 3, descripcion_espanol: 'Test Item 3', unidades_empaque: 3 }
        ];

        let articuloIds = [];
        articulos.forEach((art, index) => {
            db.run(`INSERT INTO articulo_packing_list (id_carga, descripcion_espanol, unidades_empaque) 
                    VALUES (?, ?, ?)`, 
                   [art.id_carga, art.descripcion_espanol, art.unidades_empaque], function(err) {
                if (err) {
                    console.log('Error al insertar artículo:', err.message);
                } else {
                    console.log(`✅ Artículo ${art.descripcion_espanol} creado con ID: ${this.lastID}`);
                    articuloIds[index] = this.lastID;
                    
                    // Crear caja para este artículo
                    db.run(`INSERT INTO caja (id_articulo, numero_caja, total_cajas, cantidad_en_caja, descripcion_contenido) 
                            VALUES (?, 1, 1, ?, ?)`, 
                           [this.lastID, art.unidades_empaque, art.descripcion_espanol], function(err) {
                        if (err) {
                            console.log('Error al insertar caja:', err.message);
                        } else {
                            console.log(`✅ Caja creada para artículo ${art.descripcion_espanol} con ID: ${this.lastID}`);
                            
                            // Crear QR para esta caja
                            const qrCode = `QR${String(index + 1).padStart(3, '0')}-CARGA3`;
                            db.run(`INSERT INTO qr (id_caja, codigo_qr, tipo_qr, datos_qr) 
                                    VALUES (?, ?, 'caja', ?)`, 
                                   [this.lastID, qrCode, JSON.stringify({
                                       caja_id: this.lastID,
                                       articulo_id: articuloIds[index],
                                       carga_id: 3,
                                       descripcion: art.descripcion_espanol
                                   })], function(err) {
                                if (err) {
                                    console.log('Error al insertar QR:', err.message);
                                } else {
                                    console.log(`✅ QR ${qrCode} creado`);
                                }
                            });
                        }
                    });
                }
                
                // Si es el último artículo, verificar los datos después de un tiempo
                if (index === articulos.length - 1) {
                    setTimeout(() => {
                        verificarDatos();
                    }, 2000);
                }
            });
        });
    });
}

function verificarDatos() {
    db.all(`SELECT 
                q.id_qr,
                q.codigo_qr,
                q.tipo_qr,
                c.numero_caja,
                c.descripcion_contenido,
                a.descripcion_espanol,
                ca.codigo_carga
            FROM qr q
            JOIN caja c ON q.id_caja = c.id_caja
            JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
            JOIN carga ca ON a.id_carga = ca.id_carga
            WHERE ca.id_carga = 3`, (err, rows) => {
        if (err) {
            console.log('Error al consultar datos finales:', err.message);
        } else {
            console.log('\n📋 QRs creados para carga 3:');
            console.table(rows);
        }
        db.close();
        console.log('\n✅ Datos de prueba creados exitosamente para carga ID: 3');
    });
}

createTestData();
