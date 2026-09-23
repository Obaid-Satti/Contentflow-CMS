import { Router } from 'express';

import {
    authStatus,
    login,
    register,
} from '../controllers/auth.controller.js';

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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login admin
 *     description: Authenticates the admin and returns a JWT valid for 24 hours.
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
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check registration status
 *     description: Checks whether first-admin registration is still available.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Registration status returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registrationAvailable:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error
 */
router.get('/status', authStatus);

export default router;