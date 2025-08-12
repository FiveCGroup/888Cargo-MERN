import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const authRequired = (req, res, next) => {
    const token = req.cookies.token;
        
    if (!token || token === 'undefined') {
        return res.status(401).json({ message: 'No hay token, acceso denegado' });
    }
    
    try {
        const decoded = jwt.verify(token, TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido' });
    }
};
