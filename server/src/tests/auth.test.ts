
import 'dotenv/config';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app.js';
import { db } from '../database/connection.js';

describe('POST /api/auth/register', () => {
    beforeEach(async () => {
        await db('admins').del();
    });

    it('should register the first admin', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'obaidsatti17@gmail.com',
                password: '12345678',
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Admin registered successfully');
        expect(response.body.admin.email).toBe('obaidsatti17@gmail.com');
    });

    it('should reject registration when an admin already exists', async () => {
        await db('admins').insert({
            email: 'obaidsatti17@gmail.com',
            password_hash: 'existing-hash',
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'another@contentflow.com',
                password: 'password123',
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Admin already registered');
    });

    it('should reject invalid registration data', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'invalid-email',
                password: 'short',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid email or password');
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await db('admins').del();

        await request(app)
            .post('/api/auth/register')
            .send({
                email: 'obaidsatti17@gmail.com',
                password: '12345678',
            });
    });

    it('should login with valid admin credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'obaidsatti17@gmail.com',
                password: '12345678',
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeTypeOf('string');
    });

    it('should reject invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'obaidsatt@gmail.com',
                password: '1234567',
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject an unknown email', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'unknown@contentflow.com',
                password: 'password123',
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
    });
});

describe('GET /api/auth/status', () => {
    it('should report registration as available when no admin exists', async () => {
        await db('admins').del();

        const response = await request(app).get('/api/auth/status');

        expect(response.status).toBe(200);
        expect(response.body.registrationAvailable).toBe(true);
    });

    it('should report registration as unavailable when an admin exists', async () => {
        await db('admins').del();

        await request(app)
            .post('/api/auth/register')
            .send({
                email: 'obaidsatti17@gmail.com',
                password: '12345678',
            });

        const response = await request(app).get('/api/auth/status');

        expect(response.status).toBe(200);
        expect(response.body.registrationAvailable).toBe(false);
    });
});

describe('GET /api/admin/me', () => {
    beforeEach(async () => {
        await db('admins').del();

        await request(app)
            .post('/api/auth/register')
            .send({
                email: 'obaidsatti17@gmail.com',
                password: '12345678',
            });
    });

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

    it('should allow access with a valid token', async () => {
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'obaidsatti17@gmail.com',
                password: '12345678',
            });

        const token = loginResponse.body.token;

        const response = await request(app)
            .get('/api/admin/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('You are authenticated');
        expect(response.body.admin.email).toBe('obaidsatti17@gmail.com');
    });
});

afterAll(async () => {
    await db('admins').del();
    await db.destroy();
});
