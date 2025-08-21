// Script para verificar carga con ID 3
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db', 'packing_list.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando carga con ID 3...');

db.all("SELECT * FROM carga WHERE id_carga = 3", (err, cargas) => {
    if (err) {
        console.error('Error:', err.message);
        return;
    }
    
    console.log('📊 Cargas encontradas:', cargas.length);
    
    if (cargas.length > 0) {
        const carga = cargas[0];
        console.log('Carga encontrada:', carga);
        console.log(`Código de carga: ${carga.codigo_carga}`);
        
        // Verificar artículos de esta carga
        db.all("SELECT * FROM articulo_packing_list WHERE id_carga = 3", (err, articulos) => {
            if (err) {
                console.error('Error:', err.message);
                return;
            }
            
            console.log('📋 Artículos encontrados:', articulos.length);
            articulos.forEach((art, i) => {
                console.log(`  ${i+1}. ID: ${art.id_articulo}, Descripción: ${art.descripcion_espanol}`);
            });
            
            if (articulos.length > 0) {
                // Verificar cajas
                db.all("SELECT * FROM caja WHERE id_articulo IN (SELECT id_articulo FROM articulo_packing_list WHERE id_carga = 3)", (err, cajas) => {
                    if (err) {
                        console.error('Error:', err.message);
                        return;
                    }
                    
                    console.log('📦 Cajas encontradas:', cajas.length);
                    cajas.slice(0,3).forEach((caja, i) => {
                        console.log(`  ${i+1}. ID: ${caja.id_caja}, Artículo: ${caja.id_articulo}, Número: ${caja.numero_caja}`);
                    });
                    
                    if (cajas.length > 0) {
                        // Verificar QRs
                        db.all(`
                            SELECT COUNT(*) as total 
                            FROM qr q
                            INNER JOIN caja c ON q.id_caja = c.id_caja
                            INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
                            WHERE a.id_carga = 3
                        `, (err, qrs) => {
                            if (err) {
                                console.error('Error:', err.message);
                                return;
                            }
                            
                            console.log('📱 QRs encontrados:', qrs[0].total);
                            
                            // Ahora probemos la consulta exacta del repositorio
                            console.log('\n🔍 Probando consulta del repositorio...');
                            db.all(`
                                SELECT 
                                    q.*, 
                                    c.numero_caja,
                                    c.total_cajas,
                                    a.descripcion_espanol, 
                                    carga.codigo_carga
                                FROM qr q
                                INNER JOIN caja c ON q.id_caja = c.id_caja
                                INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
                                INNER JOIN carga ON a.id_carga = carga.id_carga
                                WHERE carga.codigo_carga = ?
                                ORDER BY a.id_articulo, c.numero_caja
                            `, [carga.codigo_carga], (err, result) => {
                                if (err) {
                                    console.error('❌ Error en consulta del repositorio:', err.message);
                                } else {
                                    console.log('✅ Consulta exitosa. Resultados:', result.length);
                                    if (result.length > 0) {
                                        console.log('Primer resultado:', result[0]);
                                    }
                                }
                                db.close();
                            });
                        });
                    } else {
                        console.log('⚠️ No hay cajas para esta carga');
                        db.close();
                    }
                });
            } else {
                console.log('⚠️ No hay artículos para esta carga');
                db.close();
            }
        });
    } else {
        console.log('⚠️ No se encontró carga con ID 3');
        db.close();
    }
});
