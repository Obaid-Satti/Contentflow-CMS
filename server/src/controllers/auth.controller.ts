import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
    loginSchema,
    registerSchema,
} from '../schemas/auth.schema.js';

import {
    createAdmin,
    findAdminByEmail,
    findFirstAdmin,
} from '../models/admin.model.js';

export async function register(req: Request, res: Response) {
    try {
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid email or password',
            });
        }

        const { email, password } = result.data;

        const existingAdmin = await findFirstAdmin();

        if (existingAdmin) {
            return res.status(409).json({
                message: 'Admin already registered',
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const admin = await createAdmin(email, passwordHash);

        return res.status(201).json({
            message: 'Admin registered successfully',
            admin,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Internal server error',
        });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }

        const { email, password } = result.data;

        const admin = await findAdminByEmail(email);

        if (!admin) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password_hash,
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }

        const token = jwt.sign(
            {
                adminId: admin.id,
                email: admin.email,
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: '24h',
            },
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Internal server error',
        });
    }
}
export async function authStatus(req: Request, res: Response) {
    try {
        const existingAdmin = await findFirstAdmin();

        return res.status(200).json({
            registrationAvailable: !existingAdmin,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Internal server error',
        });
    }
}