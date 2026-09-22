import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
    res.json({
        message: 'You are authenticated',
        admin: req.admin,
    });
});

export default router;