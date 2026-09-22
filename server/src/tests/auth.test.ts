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

describe('GET /api/admin/me', () => {
    it('should reject request without a token', async () => {
        const response = await request(app).get('/api/admin/me');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });

    it('should reject an invalid token', async () => {
        const response = await request(app)
            .get('/api/admin/me')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });
});

afterAll(async () => {
    await db.destroy();
});