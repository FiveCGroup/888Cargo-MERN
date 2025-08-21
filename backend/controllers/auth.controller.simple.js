// controllers/auth.controller.simple.js
// Versión simplificada para diagnóstico
import { createAccessToken } from "../libs/jwt.js";
import bcrypt from "bcrypt";
import { userRepository } from "../repositories/index.js";

/**
 * Registrar un nuevo usuario - versión simplificada
 */
export const register = async (req, res) => {
    try {
        console.log("Request data:", req.body);
        
        const { name, lastname, email, phone, country, password } = req.body;
        
        // Validación básica
        if (!name || !lastname || !email || !password) {
            return res.status(400).json({ 
                message: 'Faltan campos requeridos: name, lastname, email, password' 
            });
        }

        // Verificar si ya existe un usuario con el mismo correo
        const normalizedEmail = email.toLowerCase().trim();
        
        try {
            const existingUser = await userRepository.findByEmail(normalizedEmail);
            if (existingUser) {
                return res.status(400).json({ 
                    message: "Ya existe un usuario con ese correo" 
                });
            }
        } catch (error) {
            console.log("Error verificando usuario existente (puede ser normal si no existe):", error.message);
        }

        // Crear el nuevo usuario usando el repository
        const newUser = await userRepository.createUser({
            username: `${name}_${lastname}`.toLowerCase().replace(' ', '_'),
            email: normalizedEmail,
            password: password, // El repository se encarga del hash
            nombre_cliente: `${name} ${lastname}`,
            correo_cliente: normalizedEmail,
            telefono_cliente: phone || '',
            ciudad_cliente: '', 
            pais_cliente: country || '',
            is_active: 1
        });

        // Generar token
        const token = await createAccessToken({ id: newUser.id });
        
        // Configurar cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });
        
        console.log("Usuario registrado exitosamente:", newUser);
        
        res.status(201).json({
            id: newUser.id,
            name: newUser.nombre_cliente,
            email: newUser.correo_cliente
        });
        
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).json({ 
            message: error.message || 'Error al registrar el usuario' 
        });
    }
};

/**
 * Iniciar sesión de usuario - versión simplificada
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validación básica
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email y contraseña son requeridos' 
            });
        }

        // Normalizar email
        const normalizedEmail = email.toLowerCase().trim();
        
        // Verificar credenciales usando el repository
        const userFound = await userRepository.verifyCredentials(normalizedEmail, password);
        if (!userFound) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas' 
            });
        }

        // Verificar que el usuario esté activo
        if (!userFound.is_active) {
            return res.status(401).json({ 
                message: 'Usuario inactivo' 
            });
        }
        
        // Generar token
        const token = await createAccessToken({ id: userFound.id });
        
        // Configurar cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.json({
            id: userFound.id,
            name: userFound.nombre_cliente || userFound.username,
            email: userFound.correo_cliente || userFound.email
        });
        
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ 
            message: error.message || 'Error al iniciar sesión' 
        });
    }
};

/**
 * Cerrar sesión de usuario
 */
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', { 
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.json({ message: 'Sesión cerrada correctamente' });
        
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        res.status(500).json({ 
            message: 'Error al cerrar sesión' 
        });
    }
};

/**
 * Obtener perfil de usuario
 */
export const profile = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                message: 'No hay usuario autenticado' 
            });
        }
        
        // Obtener perfil del usuario usando el repository
        const result = await userRepository.findByIdSafe(userId);
        
        if (!result) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }

        const userProfile = {
            id: result.id,
            name: result.nombre_cliente || result.username,
            email: result.correo_cliente || result.email,
            phone: result.telefono_cliente,
            country: result.pais_cliente,
            isActive: result.is_active,
            createdAt: result.created_at
        };
        
        res.json(userProfile);
        
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ 
            message: error.message || 'Error al obtener perfil de usuario' 
        });
    }
};
