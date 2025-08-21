import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import swaggerUi from 'swagger-ui-express';

// Importar configuración básica
import { UPLOAD_CONFIG } from "./config.js";
import { swaggerSpec, swaggerUiOptions } from "./config/swagger.config.js";

// Importar rutas
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import recuperacionRoutes from "./routes/recuperacion.routes.js";
import cargaRoutes from "./routes/carga.routes.js";
import qrRoutes from "./routes/qr.routes.js";

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear aplicación Express
const app = express();

// Configurar middleware básico
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true  
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos (imágenes)
const uploadsPath = path.resolve(process.cwd(), UPLOAD_CONFIG.uploadPath);
app.use('/uploads', express.static(uploadsPath));

console.log('Directorio de uploads:', uploadsPath);

// Documentación de API con Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Endpoint para obtener especificación OpenAPI en JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

console.log('📚 Documentación de API disponible en: http://localhost:4000/api-docs');

// Health check endpoint
app.get('/api/health', (req, res) => {
    const healthInfo = {
        status: 'ok',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: 'SQLite',
        features: {
            authentication: true,
            tasks: true,
            qr: true,
            fileUpload: true,
            passwordRecovery: true
        }
    };
    
    res.json(healthInfo);
});

// Test POST endpoint
app.post('/api/test-post', (req, res) => {
    try {
        console.log('Test POST received:', req.body);
        res.json({
            status: 'success',
            message: 'POST funcionando correctamente',
            received: req.body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en test POST:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint para verificar las tablas de la base de datos
app.get('/api/debug/tables', async (req, res) => {
    try {
        const { query } = await import('./db.js');
        const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
        res.json({
            status: 'success',
            tables: tables.map(t => t.name),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error verificando tablas:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint para estadísticas del sistema usando repositories
app.get('/api/stats', async (req, res) => {
    try {
        const { default: databaseRepository } = await import('./repositories/index.js');
        const stats = await databaseRepository.getSystemStats();
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas del sistema',
            message: error.message
        });
    }
});

// Endpoint para verificar integridad de la base de datos
app.get('/api/integrity', async (req, res) => {
    try {
        const { default: databaseRepository } = await import('./repositories/index.js');
        const integrity = await databaseRepository.checkDatabaseIntegrity();
        res.json(integrity);
    } catch (error) {
        console.error('Error verificando integridad:', error);
        res.status(500).json({
            error: 'Error verificando integridad de la base de datos',
            message: error.message
        });
    }
});

// Configurar rutas de la API
console.log('Configurando rutas...');

// Montar rutas QR PRIMERO para evitar conflictos
app.use('/api/qr', qrRoutes);
console.log('Rutas QR montadas en /api/qr');

// Ruta de prueba directa para QR
app.get('/api/qr-test-direct', (req, res) => {
    res.json({ 
        message: 'Ruta QR directa funcionando', 
        timestamp: new Date().toISOString()
    });
});
console.log('Ruta de prueba QR habilitada: /api/qr-test-direct');

// Montar el resto de rutas
app.use('/api', authRoutes);
console.log('Rutas de autenticación montadas en /api');

app.use('/api', taskRoutes);
console.log('Rutas de tareas montadas en /api');

app.use('/api/recuperacion', recuperacionRoutes);
console.log('Rutas de recuperación montadas en /api/recuperacion');

app.use('/api/carga', cargaRoutes);
console.log('Rutas de carga montadas en /api/carga');

console.log('Todas las rutas configuradas correctamente'); 

export default app;