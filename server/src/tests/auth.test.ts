import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app.js';
import { db } from '../database/connection.js';

describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@contentflow.com',
                password: 'password123',
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeTypeOf('string');
    });

    it('should reject invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@contentflow.com',
                password: 'wrongpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
    });
});

afterAll(async () => {
    await db.destroy();
});