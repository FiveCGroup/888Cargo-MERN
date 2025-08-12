// backend/routes/recuperacion.js
import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import * as clienteModel from '../models/user.model.js';
import bcrypt from 'bcrypt';
import { get, run } from '../db.js';

const router = Router();

// Configuración de WhatsApp Business API
const WHATSAPP_TOKEN = 'TU_TOKEN_DE_ACCESO'; // <-- Reemplaza con tu token real
const PHONE_NUMBER_ID = 'TU_PHONE_NUMBER_ID'; // <-- Reemplaza con tu ID real
const FRONTEND_BASE_URL = 'http://localhost:5173/reset-password';

// Almacenamiento temporal de tokens (para producción, usa base de datos)
const tokenStore = new Map();

router.post('/enviar-enlace', async (req, res) => {
    const { telefono } = req.body;

    try {
        // 1️⃣ Verifica que el usuario exista por número de teléfono usando SQLite
        const user = await get('SELECT * FROM cliente WHERE telefono_cliente = ?', [telefono.replace('+', '')]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No existe una cuenta con ese número de teléfono'
            });
        }

        // 2️⃣ Valida formato de número
        if (!telefono.match(/^\+?[0-9]{10,15}$/)) {
            throw new Error("Número inválido (ej: +573001112233)");
        }

        // 3️⃣ Verifica opt-in (adaptar según estructura de SQLite)
        // Nota: En SQLite no tenemos un campo whatsappOptIn, así que lo omitimos temporalmente
        // o agregamos la columna correspondiente a la tabla cliente

        // 4️⃣ Genera token de recuperación
        const tokenRecuperacion = crypto.randomBytes(20).toString('hex');
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 1); // 1 hora

        tokenStore.set(tokenRecuperacion, {
            userId: user.id_cliente,
            expires: expirationTime
        });

        // 5️⃣ Construye enlace y mensaje
        const enlace = `${FRONTEND_BASE_URL}?token=${tokenRecuperacion}`;
        const mensaje = `Hola ${user.nombre_cliente}, haz clic en este enlace para restablecer tu contraseña:\n\n${enlace}\n\nEste enlace expirará en 1 hora.`;

        // 6️⃣ Envía mensaje con API oficial de Meta
        await axios.post(
            `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: telefono.replace('+', ''),
                type: "text",
                text: { body: mensaje }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return res.json({
            success: true,
            message: 'Hemos enviado un enlace de recuperación a tu WhatsApp.'
        });

    } catch (error) {
        console.error('Error al enviar enlace de recuperación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud de recuperación.'
        });
    }
});

router.get('/verificar-token/:token', (req, res) => {
    const { token } = req.params;
    const tokenData = tokenStore.get(token);

    if (!tokenData) {
        return res.status(400).json({
            valid: false,
            message: 'Token inválido o expirado.'
        });
    }

    if (new Date() > tokenData.expires) {
        tokenStore.delete(token);
        return res.status(400).json({
            valid: false,
            message: 'El token ha expirado.'
        });
    }

    return res.json({ valid: true });
});

router.post('/cambiar-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Token y nueva contraseña son requeridos.'
        });
    }

    const tokenData = tokenStore.get(token);

    if (!tokenData) {
        return res.status(400).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }

    if (new Date() > tokenData.expires) {
        tokenStore.delete(token);
        return res.status(400).json({
            success: false,
            message: 'El token ha expirado.'
        });
    }

    try {
        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar en BD SQLite
        await run(
            'UPDATE cliente SET password = ? WHERE id_cliente = ?',
            [hashedPassword, tokenData.userId]
        );

        // Eliminar token usado
        tokenStore.delete(token);

        return res.json({
            success: true,
            message: 'Contraseña actualizada correctamente.'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la contraseña.'
        });
    }
});

export default router;
