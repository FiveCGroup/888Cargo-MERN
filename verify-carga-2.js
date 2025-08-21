// Script para verificar carga con ID 2
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db', 'packing_list.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando carga con ID 2...');

db.all("SELECT * FROM carga WHERE id_carga = 2", (err, cargas) => {
    if (err) {
        console.error('Error:', err.message);
        return;
    }
    
    console.log('📊 Carga encontrada:', cargas);
    
    if (cargas.length > 0) {
        const carga = cargas[0];
        console.log(`Código de carga: ${carga.codigo_carga}`);
        
        // Verificar artículos de esta carga
        db.all("SELECT * FROM articulo_packing_list WHERE id_carga = 2", (err, articulos) => {
            if (err) {
                console.error('Error:', err.message);
                return;
            }
            
            console.log('📋 Artículos encontrados:', articulos.length);
            
            if (articulos.length > 0) {
                // Verificar cajas
                db.all("SELECT * FROM caja WHERE id_articulo IN (SELECT id_articulo FROM articulo_packing_list WHERE id_carga = 2)", (err, cajas) => {
                    if (err) {
                        console.error('Error:', err.message);
                        return;
                    }
                    
                    console.log('📦 Cajas encontradas:', cajas.length);
                    
                    if (cajas.length > 0) {
                        // Verificar QRs
                        db.all(`
                            SELECT COUNT(*) as total 
                            FROM qr q
                            INNER JOIN caja c ON q.id_caja = c.id_caja
                            INNER JOIN articulo_packing_list a ON c.id_articulo = a.id_articulo
                            WHERE a.id_carga = 2
                        `, (err, qrs) => {
                            if (err) {
                                console.error('Error:', err.message);
                                return;
                            }
                            
                            console.log('📱 QRs encontrados:', qrs[0].total);
                            db.close();
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
        console.log('⚠️ No se encontró carga con ID 2');
        db.close();
    }
});
