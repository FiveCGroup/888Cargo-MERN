import dotenv from 'dotenv';
import app from "./app.js";
import db, { initializeDatabase } from "./db.js";
import { PORT } from './config.js';

dotenv.config();

const startServer = async () => {
  try {
    console.log('Inicializando base de datos SQLite...');
    
    // Inicializar la base de datos SQLite
    await initializeDatabase();
    console.log('✅ Base de datos SQLite inicializada correctamente');
    
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Servidor corriendo en el puerto: ${PORT}`);
      console.log(`🗃️ Base de datos: SQLite`);
      console.log(`🔗 URL del servidor: http://127.0.0.1:${PORT}`);
      console.log(`🔗 URL del servidor: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message);
    console.error("Detalles:", error);
    process.exit(1);
  }
};

startServer();