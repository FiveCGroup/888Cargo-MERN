import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";  
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import recuperacionRoutes from "./routes/recuperacion.routes.js";
import cargaRoutes from "./routes/carga.routes.js";

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true  
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());  

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: 'SQLite'
    });
});

app.use('/api', authRoutes);
app.use('/api', taskRoutes);
app.use('/api/recuperacion', recuperacionRoutes);
app.use('/api/carga', cargaRoutes); 

export default app;