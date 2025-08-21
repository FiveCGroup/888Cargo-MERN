// Script de prueba para verificar la funcionalidad de PDF
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

// Script de prueba para verificar la funcionalidad de PDF
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

// Función para insertar datos de prueba
function insertTestData() {
    return new Promise((resolve, reject) => {
        // Insertar una carga de prueba
        const insertCarga = `
            INSERT OR REPLACE INTO carga 
            (id_carga, codigo_carga, fecha_inicio, ciudad_destino, direccion_destino, id_cliente, fecha_creacion)
            VALUES (1, 'TEST123', date('now'), 'Bogotá', 'Calle 123', 1, datetime('now'))
        `;
        
        db.run(insertCarga, function(err) {
            if (err) {
                console.error('Error insertando carga:', err.message);
                reject(err);
                return;
            }
            
            console.log('✅ Carga de prueba insertada');
            
            // Insertar un artículo de prueba
            const insertArticle = `
                INSERT OR REPLACE INTO articulo_packing_list 
                (id_articulo, id_carga, fecha, descripcion_espanol, descripcion_chino, unidad, precio_unidad, precio_total)
                VALUES (1, 1, date('now'), 'Producto de Prueba', '测试产品', 'PCS', 10.50, 31.50)
            `;
            
            db.run(insertArticle, function(err) {
                if (err) {
                    console.error('Error insertando artículo:', err.message);
                    reject(err);
                    return;
                }
                
                console.log('✅ Artículo de prueba insertado');
                
                // Insertar cajas de prueba
                const insertCajas = [
                    { id_caja: 1, id_articulo: 1, numero_caja: 1, total_cajas: 3, cantidad_en_caja: 10 },
                    { id_caja: 2, id_articulo: 1, numero_caja: 2, total_cajas: 3, cantidad_en_caja: 10 },
                    { id_caja: 3, id_articulo: 1, numero_caja: 3, total_cajas: 3, cantidad_en_caja: 11 }
                ];
                
                const insertCajaSql = `
                    INSERT OR REPLACE INTO caja 
                    (id_caja, id_articulo, numero_caja, total_cajas, cantidad_en_caja, fecha_creacion)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `;
                
                let completedCajas = 0;
                
                insertCajas.forEach((caja, index) => {
                    db.run(insertCajaSql, [caja.id_caja, caja.id_articulo, caja.numero_caja, caja.total_cajas, caja.cantidad_en_caja], function(err) {
                        if (err) {
                            console.error(`Error insertando caja ${index + 1}:`, err.message);
                        } else {
                            console.log(`✅ Caja ${index + 1} insertada`);
                        }
                        
                        completedCajas++;
                        if (completedCajas === insertCajas.length) {
                            // Insertar QRs de prueba
                            const insertQRs = [
                                {
                                    id_caja: 1,
                                    codigo_qr: 'QR_TEST123_CAJA1_' + Date.now() + '_abc123',
                                    estado: 'generado'
                                },
                                {
                                    id_caja: 2,
                                    codigo_qr: 'QR_TEST123_CAJA2_' + Date.now() + '_def456',
                                    estado: 'generado'
                                },
                                {
                                    id_caja: 3,
                                    codigo_qr: 'QR_TEST123_CAJA3_' + Date.now() + '_ghi789',
                                    estado: 'generado'
                                }
                            ];
                            
                            const insertQRSql = `
                                INSERT OR REPLACE INTO qr 
                                (id_caja, codigo_qr, estado, fecha_generacion)
                                VALUES (?, ?, ?, datetime('now'))
                            `;
                            
                            let completedQRs = 0;
                            
                            insertQRs.forEach((qr, index) => {
                                db.run(insertQRSql, [qr.id_caja, qr.codigo_qr, qr.estado], function(err) {
                                    if (err) {
                                        console.error(`Error insertando QR ${index + 1}:`, err.message);
                                    } else {
                                        console.log(`✅ QR ${index + 1} insertado`);
                                    }
                                    
                                    completedQRs++;
                                    if (completedQRs === insertQRs.length) {
                                        resolve();
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });
    });
}

// Función para verificar datos
function verifyData() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM articulos_packing_list WHERE codigo_carga = 'TEST123'", (err, articles) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\n📊 Artículos encontrados:', articles.length);
            articles.forEach(article => {
                console.log(`- ID: ${article.id}, Código: ${article.codigo_carga}, Cajas: ${article.cantidad_cajas}`);
            });
            
            db.all(`
                SELECT q.*, a.codigo_carga 
                FROM qr_codes q 
                INNER JOIN articulos_packing_list a ON q.id_articulo = a.id 
                WHERE a.codigo_carga = 'TEST123'
            `, (err, qrs) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log('\n📱 QRs encontrados:', qrs.length);
                qrs.forEach(qr => {
                    console.log(`- Caja: ${qr.numero_caja}, Estado: ${qr.estado}, Código: ${qr.codigo_qr.substring(0, 30)}...`);
                });
                
                resolve({ articles, qrs });
            });
        });
    });
}

// Ejecutar pruebas
async function runTests() {
    try {
        console.log('🧪 Insertando datos de prueba...');
        await insertTestData();
        
        console.log('\n🔍 Verificando datos...');
        const data = await verifyData();
        
        console.log('\n✅ Datos de prueba listos para probar PDF');
        console.log('💡 Ahora puedes probar la descarga de PDF con carga "TEST123"');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    } finally {
        db.close();
    }
}

runTests();
