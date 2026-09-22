import { Router } from 'express';
import { register } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register the first admin
 *     description: Creates the first admin account. Registration is disabled once an admin already exists.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@contentflow.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: password123
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: Invalid email or password
 *       409:
 *         description: Admin already registered
 *       500:
 *         description: Internal server error
 */
router.post('/register', register);

export default router;