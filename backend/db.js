import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configuración de SQLite
const dbPath = path.join(__dirname, '..', 'database', 'app.db');

// Crear la base de datos SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Función para promisificar las consultas de SQLite
export const query = (sql, params = []) => {
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

// Función para ejecutar comandos SQL (INSERT, UPDATE, DELETE)
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Función para obtener un solo registro
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Función para inicializar las tablas
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando estructura de base de datos...');
    
    // Verificar si necesitamos recrear las tablas
    try {
      // Verificar la estructura actual de las tablas
      const resultAPL = await query("PRAGMA table_info(articulo_packing_list)");
      const tieneImagenData = resultAPL.some(col => col.name === 'imagen_data');
      
      const resultCarga = await query("PRAGMA table_info(carga)");
      const tieneCodigoCarga = resultCarga.some(col => col.name === 'codigo_carga');
      
      // Verificar si la tabla caja tiene los nuevos campos
      const resultCaja = await query("PRAGMA table_info(caja)");
      const tieneTotalCajas = resultCaja.some(col => col.name === 'total_cajas');
      
      // Verificar si existe la tabla qr
      const tablas = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='qr'");
      const existeTablaQR = tablas.length > 0;
      
      if (!tieneCodigoCarga || !tieneImagenData || !tieneTotalCajas || !existeTablaQR) {
        console.log('🔄 Actualizando estructura de base de datos (agregando campos QR y total cajas)...');
        
        // Eliminar tablas en el orden correcto (respetando foreign keys)
        await run(`DROP TABLE IF EXISTS qr`);
        await run(`DROP TABLE IF EXISTS caja`);
        await run(`DROP TABLE IF EXISTS articulo_packing_list`);
        await run(`DROP TABLE IF EXISTS carga`);
      }
    } catch (error) {
      console.log('🔄 Creando tablas por primera vez...');
    }

    // Crear tabla cliente (actualizada)
    await run(`
      CREATE TABLE IF NOT EXISTS cliente (
        id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_cliente TEXT NOT NULL,
        correo_cliente TEXT UNIQUE,
        telefono_cliente TEXT,
        ciudad_cliente TEXT,
        pais_cliente TEXT,
        direccion_entrega TEXT,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla carga (nueva estructura)
    await run(`
      CREATE TABLE IF NOT EXISTS carga (
        id_carga INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_carga TEXT NOT NULL UNIQUE,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        ciudad_destino TEXT,
        direccion_destino TEXT,
        archivo_original TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        id_cliente INTEGER NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
      )
    `);

    // Crear tabla articulo_packing_list (nueva estructura)
    await run(`
      CREATE TABLE IF NOT EXISTS articulo_packing_list (
        id_articulo INTEGER PRIMARY KEY AUTOINCREMENT,
        id_carga INTEGER NOT NULL,
        fecha DATE,
        cn TEXT,
        ref_art TEXT,
        descripcion_espanol TEXT,
        descripcion_chino TEXT,
        unidad TEXT,
        precio_unidad REAL,
        precio_total REAL,
        material TEXT,
        unidades_empaque INTEGER,
        marca_producto TEXT,
        serial TEXT,
        medida_largo REAL,
        medida_ancho REAL,
        medida_alto REAL,
        cbm REAL,
        gw REAL,
        imagen_url TEXT,
        imagen_data BLOB,
        imagen_nombre TEXT,
        imagen_tipo TEXT,
        FOREIGN KEY (id_carga) REFERENCES carga(id_carga)
      )
    `);

    // Crear tabla caja (nueva estructura con campos para QR)
    await run(`
      CREATE TABLE IF NOT EXISTS caja (
        id_caja INTEGER PRIMARY KEY AUTOINCREMENT,
        id_articulo INTEGER NOT NULL,
        numero_caja INTEGER NOT NULL,
        total_cajas INTEGER NOT NULL,
        cantidad_en_caja INTEGER,
        cbm REAL,
        gw REAL,
        descripcion_contenido TEXT,
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_articulo) REFERENCES articulo_packing_list(id_articulo)
      )
    `);

    // Crear tabla qr (nueva tabla para códigos QR)
    await run(`
      CREATE TABLE IF NOT EXISTS qr (
        id_qr INTEGER PRIMARY KEY AUTOINCREMENT,
        id_caja INTEGER NOT NULL,
        codigo_qr TEXT NOT NULL UNIQUE,
        tipo_qr TEXT DEFAULT 'caja',
        datos_qr TEXT,
        fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_impresion DATETIME,
        estado TEXT DEFAULT 'generado',
        url_imagen TEXT,
        formato TEXT DEFAULT 'PNG',
        tamaño INTEGER DEFAULT 200,
        nivel_correccion TEXT DEFAULT 'M',
        FOREIGN KEY (id_caja) REFERENCES caja(id_caja)
      )
    `);

    console.log('✅ Estructura de base de datos lista para Packing List con QR');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

// Inicializar la base de datos al cargar el módulo
initializeDatabase();

export default db;