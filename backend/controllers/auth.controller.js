// controllers/auth.controller.js
// Controlador para manejo de autenticación - Solo responsabilidad HTTP
import { AuthService } from "../services/auth.service.js";
import { auditService } from "../services/audit.service.js";
import { notificationService } from "../services/notification.service.js";
import { AuthUtils } from "../utils/auth.utils.js";

/**
 * Registrar un nuevo usuario
 */
export const register = async (req, res) => {
    try {
        const ip = AuthUtils.extractClientIP(req);
        const result = await AuthService.registerUser(req.body, ip);
        
        // Registrar evento en auditoría
        await auditService.logEvent('user_registered', {
            userId: result.user.id,
            email: result.user.email,
            registrationMethod: 'email'
        }, {
            level: 'medium',
            ipAddress: ip,
            userAgent: req.get('User-Agent'),
            action: 'register'
        });

        // Configurar cookie
        AuthUtils.setTokenCookie(res, result.token);
        
        res.status(201).json(result.user);
        
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        
        // Registrar error en auditoría
        await auditService.logSystemError(error, {
            resource: 'user_registration',
            requestData: { email: req.body.email }
        }, {
            ipAddress: AuthUtils.extractClientIP(req),
            userAgent: req.get('User-Agent')
        });
        
        res.status(400).json({ 
            message: error.message || 'Error al registrar el usuario' 
        });
    }
};

/**
 * Iniciar sesión de usuario
 */
export const login = async (req, res) => {
    try {
        const ip = AuthUtils.extractClientIP(req);
        const userAgent = req.get('User-Agent');
        const result = await AuthService.loginUser(req.body);
        
        // Registrar login en auditoría
        await auditService.logUserLogin(result.user.id, {
            sessionId: result.sessionId || 'web_session',
            loginMethod: 'password',
            ipAddress: ip,
            userAgent
        });

        // Configurar cookie
        AuthUtils.setTokenCookie(res, result.token);
        
        res.json(result.user);
        
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        
        // Registrar intento fallido en auditoría
        await auditService.logEvent('login_failed', {
            email: req.body.email,
            reason: error.message
        }, {
            level: 'high',
            ipAddress: AuthUtils.extractClientIP(req),
            userAgent: req.get('User-Agent'),
            action: 'login_attempt_failed'
        });
        
        res.status(401).json({ 
            message: error.message || 'Error al iniciar sesión' 
        });
    }
};

/**
 * Cerrar sesión de usuario
 */
export const logout = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        // Registrar logout en auditoría si hay usuario autenticado
        if (userId) {
            await auditService.logUserLogout(userId, {
                sessionId: 'web_session',
                reason: 'manual',
                ipAddress: AuthUtils.extractClientIP(req),
                userAgent: req.get('User-Agent')
            });
        }
        
        AuthUtils.clearTokenCookie(res);
        res.json({ message: 'Sesión cerrada correctamente' });
        
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        res.status(500).json({ 
            message: 'Error al cerrar sesión' 
        });
    }
};

/**
 * Obtener perfil de usuario autenticado
 */
export const profile = async (req, res) => {
    try {
        const userProfile = await AuthService.getUserProfile(req.user.id);
        res.json(userProfile);
        
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(404).json({ 
            message: error.message || 'Error al obtener perfil de usuario' 
        });
    }
};