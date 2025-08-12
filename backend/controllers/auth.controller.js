import bcrypt from "bcrypt";
import { createAccessToken } from "../libs/jwt.js";
import * as clienteModel from "../models/user.model.js";

export const register = async (req, res) => {
    // Recibe la IP desde req.ip o req.realIp (ver ruta)
    const { name, lastname, email, phone, country, password, acceptWhatsapp } = req.body;
    const ip = req.ip || req.realIp || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Validación básica
    if (!name || !lastname || !email || !phone || !country || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si ya existe un usuario con el mismo correo
        const existingUser = await clienteModel.getClienteByEmail(email.toLowerCase());
        
        if (existingUser) {
            return res.status(400).json({ message: "Ya existe un usuario con ese correo" });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el nuevo cliente
        const newUser = await clienteModel.createCliente({
            nombre_cliente: `${name} ${lastname}`,
            correo_cliente: email.toLowerCase(),
            telefono_cliente: phone,
            ciudad_cliente: '', // Ajustar según tu esquema
            pais_cliente: country,
            password: hashedPassword
        });

        const token = await createAccessToken({ id: newUser.id_cliente });        
        res.cookie('token', token);

        res.json({
            id: newUser.id_cliente,
            name: newUser.nombre_cliente,
            email: newUser.correo_cliente
        });
        
        console.log("Usuario registrado:");
        // Mostrar IP y consentimiento en consola
        console.log("Registro nuevo usuario -> IP:", ip, "Acepta WhatsApp:", acceptWhatsapp);
    }
    catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userFound = await clienteModel.getClienteByEmail(email.toLowerCase());
        if (!userFound) {
            return res.status(401).json({ message: 'No existe un usuario con ese correo' });
        }

        // Verificar la contraseña
        if (!userFound.password) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, userFound.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const token = await createAccessToken({ id: userFound.id_cliente });
        res.cookie('token', token);
        
        return res.json({
            id: userFound.id_cliente,
            name: userFound.nombre_cliente,
            email: userFound.correo_cliente
        });
    }
    catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

export const logout = (req, res) => {
    try {
        res.clearCookie('token', { expires: new Date(0) });
        return res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
};

export const profile = async(req, res) => {
    try {
        // Buscar el cliente por ID usando SQLite
        const result = await clienteModel.getClienteById(req.user.id);
        
        if (!result) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.json({
            id: result.id_cliente,
            name: result.nombre_cliente,
            email: result.correo_cliente,
            phone: result.telefono_cliente,
            country: result.pais_cliente
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        return res.status(500).json({ message: 'Error al obtener perfil de usuario' });
    }
}