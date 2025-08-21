// services/recuperacion.service.js
// Servicio para lógica de negocio de recuperación de contraseñas
import crypto from 'crypto';
import { get, run } from '../db.js';
import { AuthUtils } from '../utils/auth.utils.js';
import { RecuperacionValidator } from "../validators/recuperacion.validator.js";
import { WhatsAppService } from "./whatsapp.service.js";

export class RecuperacionService {
    
    // Almacenamiento temporal de tokens (en producción debería ser en BD)
    static tokenStore = new Map();

    /**
     * Enviar enlace de recuperación por WhatsApp
     * @param {string} telefono - Número de teléfono
     * @returns {Promise<Object>} - Resultado del envío
     */
    static async enviarEnlaceRecuperacion(telefono) {
        // Validar formato de teléfono
        RecuperacionValidator.validatePhoneNumber(telefono);
        
        // Normalizar teléfono
        const telefonoNormalizado = RecuperacionValidator.normalizePhoneNumber(telefono);
        
        // Verificar que el usuario exista
        const user = await get(
            'SELECT * FROM cliente WHERE telefono_cliente = ?', 
            [telefonoNormalizado]
        );

        if (!user) {
            throw new Error('No existe una cuenta con ese número de teléfono');
        }

        // Generar token de recuperación
        const tokenRecuperacion = this.generateRecoveryToken();
        const expirationTime = this.getTokenExpirationTime();

        // Almacenar token
        this.tokenStore.set(tokenRecuperacion, {
            userId: user.id_cliente,
            expires: expirationTime
        });

        // Construir enlace y enviar mensaje
        const enlace = this.buildRecoveryLink(tokenRecuperacion);
        const mensaje = this.buildRecoveryMessage(user.nombre_cliente, enlace);

        // Enviar mensaje por WhatsApp
        await WhatsAppService.sendTextMessage(telefonoNormalizado, mensaje);

        return {
            success: true,
            message: 'Hemos enviado un enlace de recuperación a tu WhatsApp.'
        };
    }

    /**
     * Verificar validez de token
     * @param {string} token - Token a verificar
     * @returns {Object} - Estado del token
     */
    static verificarToken(token) {
        const tokenData = this.tokenStore.get(token);

        if (!tokenData) {
            throw new Error('Token inválido o expirado.');
        }

        if (new Date() > tokenData.expires) {
            this.tokenStore.delete(token);
            throw new Error('El token ha expirado.');
        }

        return { valid: true };
    }

    /**
     * Cambiar contraseña usando token
     * @param {string} token - Token de recuperación
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<Object>} - Resultado del cambio
     */
    static async cambiarPassword(token, newPassword) {
        // Validar nueva contraseña
        RecuperacionValidator.validatePassword(newPassword);
        
        // Verificar token
        const tokenData = this.tokenStore.get(token);

        if (!tokenData) {
            throw new Error('Token inválido o expirado.');
        }

        if (new Date() > tokenData.expires) {
            this.tokenStore.delete(token);
            throw new Error('El token ha expirado.');
        }

        // Hashear nueva contraseña
        const hashedPassword = await AuthUtils.hashPassword(newPassword);

        // Actualizar en BD
        await run(
            'UPDATE cliente SET password = ? WHERE id_cliente = ?',
            [hashedPassword, tokenData.userId]
        );

        // Eliminar token usado
        this.tokenStore.delete(token);

        return {
            success: true,
            message: 'Contraseña actualizada correctamente.'
        };
    }

    /**
     * Generar token de recuperación
     * @returns {string} - Token único
     */
    static generateRecoveryToken() {
        return crypto.randomBytes(20).toString('hex');
    }

    /**
     * Obtener tiempo de expiración del token
     * @returns {Date} - Fecha de expiración
     */
    static getTokenExpirationTime() {
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 1); // 1 hora
        return expirationTime;
    }

    /**
     * Construir enlace de recuperación
     * @param {string} token - Token de recuperación
     * @returns {string} - URL completa
     */
    static buildRecoveryLink(token) {
        const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173/reset-password';
        return `${baseUrl}?token=${token}`;
    }

    /**
     * Construir mensaje de recuperación
     * @param {string} nombreCliente - Nombre del cliente
     * @param {string} enlace - Enlace de recuperación
     * @returns {string} - Mensaje formateado
     */
    static buildRecoveryMessage(nombreCliente, enlace) {
        return `Hola ${nombreCliente}, haz clic en este enlace para restablecer tu contraseña:\n\n${enlace}\n\nEste enlace expirará en 1 hora.`;
    }
}
