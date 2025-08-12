import { Router } from 'express';
import { register, login, logout, profile } from '../controllers/auth.controller.js';
import { authRequired } from '../middlewares/validateToken.js';

const router = Router();

router.post('/register', (req, res, next) => {
    req.body.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    register(req, res, next);
});
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authRequired, profile);

export default router;