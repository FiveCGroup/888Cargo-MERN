import express from "express";

const app = express();
const PORT = 4000;

// Middleware básico
app.use(express.json());

// Ruta de prueba simple
app.get('/test', (req, res) => {
    console.log('GET /test recibido');
    res.json({ message: 'Test GET funcionando' });
});

// Ruta POST de prueba simple
app.post('/test-post', (req, res) => {
    console.log('POST /test-post recibido:', req.body);
    res.json({ 
        message: 'Test POST funcionando', 
        received: req.body 
    });
});

// Ruta de registro simple
app.post('/api/register', (req, res) => {
    console.log('POST /api/register recibido:', req.body);
    try {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ 
                message: 'Faltan campos requeridos' 
            });
        }

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: { name, email, id: Date.now() }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor' 
        });
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Servidor de prueba corriendo en http://127.0.0.1:${PORT}`);
});
