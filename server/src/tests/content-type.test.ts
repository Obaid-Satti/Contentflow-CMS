import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import request, { type Test } from 'supertest';

import app from '../app.js';
import { db } from '../database/connection.js';

const runId = randomUUID().replaceAll('-', '').slice(0, 12);
const apiIdPrefix = `test-ctb-${runId}`;
const token = jwt.sign(
    { adminId: 1, email: 'content-type-test@contentflow.local' },
    process.env.JWT_SECRET!,
);

const auth = (testRequest: Test) =>
    testRequest.set('Authorization', `Bearer ${token}`);

const contentType = (
    suffix: string,
    overrides: Record<string, unknown> = {},
) => ({
    name: 'Article',
    apiId: `${apiIdPrefix}-${suffix}`,
    fields: [
        { name: 'title', type: 'short_text', required: true },
    ],
    ...overrides,
});

const cleanupTestContentTypes = async () => {
    await db('content_types').where('api_id', 'like', `${apiIdPrefix}%`).del();
};

beforeEach(cleanupTestContentTypes);

afterAll(async () => {
    await cleanupTestContentTypes();
    await db.destroy();
});

describe('Content-Type API authentication', () => {
    it('rejects requests without a bearer token', async () => {
        const response = await request(app).get('/api/content-types');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });
});

describe('Content-Type CRUD API', () => {
    it('creates, lists, reads, updates, and deletes a content type', async () => {
        const createdResponse = await auth(request(app).post('/api/content-types'))
            .send(contentType('crud'));

        expect(createdResponse.status).toBe(201);
        expect(createdResponse.body.name).toBe('Article');
        expect(createdResponse.body.api_id).toBe(`${apiIdPrefix}-crud`);
        expect(createdResponse.body.fields).toEqual([
            { name: 'title', type: 'short_text', required: true },
        ]);

        const id = createdResponse.body.id as number;

        const listResponse = await auth(request(app).get('/api/content-types'));
        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id, api_id: `${apiIdPrefix}-crud` }),
            ]),
        );

        const readResponse = await auth(
            request(app).get(`/api/content-types/${id}`),
        );
        expect(readResponse.status).toBe(200);
        expect(readResponse.body.id).toBe(id);

        const updatedFields = [
            { name: 'title', type: 'short_text', required: true },
            { name: 'published_on', type: 'date', required: false },
        ];
        const updateResponse = await auth(
            request(app).put(`/api/content-types/${id}`),
        ).send({
            name: 'News Article',
            apiId: `${apiIdPrefix}-crud`,
            fields: updatedFields,
        });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.name).toBe('News Article');
        expect(updateResponse.body.fields).toEqual(updatedFields);

        const deleteResponse = await auth(
            request(app).delete(`/api/content-types/${id}`),
        );
        expect(deleteResponse.status).toBe(204);

        const missingResponse = await auth(
            request(app).get(`/api/content-types/${id}`),
        );
        expect(missingResponse.status).toBe(404);
    });

    it('returns 404 when updating or deleting a missing content type', async () => {
        const updateResponse = await auth(
            request(app).put('/api/content-types/2147483000'),
        ).send(contentType('missing'));
        const deleteResponse = await auth(
            request(app).delete('/api/content-types/2147483000'),
        );

        expect(updateResponse.status).toBe(404);
        expect(deleteResponse.status).toBe(404);
    });

    it('rejects a duplicate API ID with an inline conflict response', async () => {
        const duplicateId = `${apiIdPrefix}-duplicate`;
        const firstResponse = await auth(
            request(app).post('/api/content-types'),
        ).send(contentType('duplicate'));
        const duplicateResponse = await auth(
            request(app).post('/api/content-types'),
        ).send(contentType('another', { apiId: duplicateId }));

        expect(firstResponse.status).toBe(201);
        expect(duplicateResponse.status).toBe(409);
        expect(duplicateResponse.body.message).toBe(
            'A content type with this API ID already exists',
        );
    });
});

describe('Content-Type validation', () => {
    it('rejects malformed API IDs', async () => {
        const response = await auth(request(app).post('/api/content-types'))
            .send(contentType('invalid', { apiId: 'Invalid API ID' }));

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
    });

    it.each(['id', 'created_at', 'updated_at'])(
        'rejects the reserved field name %s',
        async (name) => {
            const response = await auth(
                request(app).post('/api/content-types'),
            ).send(contentType(`reserved-${name}`, {
                fields: [{ name, type: 'short_text', required: false }],
            }));

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
        },
    );

    it('rejects duplicate field names without regard to case', async () => {
        const response = await auth(request(app).post('/api/content-types'))
            .send(contentType('duplicate-fields', {
                fields: [
                    { name: 'title', type: 'short_text', required: true },
                    { name: 'Title', type: 'long_text', required: false },
                ],
            }));

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
    });

    it('requires options for enumeration fields', async () => {
        const response = await auth(request(app).post('/api/content-types'))
            .send(contentType('enum-options', {
                fields: [{ name: 'category', type: 'enumeration', required: true }],
            }));

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
    });

    it('only allows unique on short-text and email fields', async () => {
        const response = await auth(request(app).post('/api/content-types'))
            .send(contentType('invalid-unique', {
                fields: [{ name: 'description', type: 'long_text', required: false, unique: true }],
            }));

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
    });

    it('only allows enumeration options on enumeration fields', async () => {
        const response = await auth(request(app).post('/api/content-types'))
            .send(contentType('invalid-options', {
                fields: [{ name: 'title', type: 'short_text', required: false, options: ['one'] }],
            }));

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Validation failed');
    });

    it('accepts all supported field types with valid settings', async () => {
        const fields = [
            { name: 'title', type: 'short_text', required: true, unique: true },
            { name: 'body', type: 'long_text', required: false },
            { name: 'price', type: 'number', required: false },
            { name: 'active', type: 'boolean', required: true },
            { name: 'published_on', type: 'date', required: false },
            { name: 'email', type: 'email', required: false, unique: true },
            { name: 'status', type: 'enumeration', required: true, options: ['draft', 'live'] },
            { name: 'cover', type: 'media', required: false },
        ];

        const response = await auth(request(app).post('/api/content-types'))
            .send(contentType('all-field-types', { fields }));

        expect(response.status).toBe(201);
        expect(response.body.fields).toEqual(fields);
    });
});
