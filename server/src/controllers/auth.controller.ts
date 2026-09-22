import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { registerSchema } from '../schemas/auth.schema.js';
import {
    createAdmin,
    findFirstAdmin,
} from '../models/admin.model.js';

export async function register(req: Request, res: Response) {
    try {
        // Validate request data
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid email or password',
            });
        }

        const { email, password } = result.data;

        // Check if an admin already exists
        const existingAdmin = await findFirstAdmin();

        if (existingAdmin) {
            return res.status(409).json({
                message: 'Admin already registered',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create first admin
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