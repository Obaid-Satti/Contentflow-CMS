import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app.js';
import { db } from '../database/connection.js';
import { hashApiToken } from '../services/api-token.service.js';

const runId = randomUUID().replaceAll('-', '').slice(0, 12);
const apiId = `test-public-${runId}-articles`;
const tokenNamePrefix = `Test public API ${runId}`;
const apiToken = `cf_test_${randomUUID().replaceAll('-', '')}`;

let contentTypeId: number;
let apiTokenId: number;

const publicRequest = (url = `/api/${apiId}`) => request(app)
    .get(url)
    .set('Authorization', `Bearer ${apiToken}`);

async function cleanUp() {
    await db('api_tokens').where('name', 'like', `${tokenNamePrefix}%`).del();
    await db('content_types').where({ api_id: apiId }).del();
}

beforeEach(async () => {
    await cleanUp();

    const [contentType] = await db('content_types').insert({
        name: 'Public API Test Article',
        api_id: apiId,
        fields: JSON.stringify([
            { name: 'title', type: 'short_text', required: true },
            { name: 'quantity', type: 'number', required: false },
        ]),
    }).returning('*');
    contentTypeId = contentType.id;

    await db('entries').insert([
        { content_type_id: contentTypeId, data: { title: 'Zebra guide', quantity: 3 } },
        { content_type_id: contentTypeId, data: { title: 'Tomato growing guide', quantity: 2 } },
        { content_type_id: contentTypeId, data: { title: 'Apple guide', quantity: 1 } },
    ]);

    const [createdToken] = await db('api_tokens').insert({
        name: `${tokenNamePrefix} token`,
        token_hash: hashApiToken(apiToken),
    }).returning('*');
    apiTokenId = createdToken.id;
});

afterAll(async () => {
    await cleanUp();
    await db.destroy();
});

describe('Public API token authentication', () => {
    it('rejects missing, incorrect, and deleted API tokens', async () => {
        const missingToken = await request(app).get(`/api/${apiId}`);
        expect(missingToken.status).toBe(401);

        const incorrectToken = await request(app)
            .get(`/api/${apiId}`)
            .set('Authorization', 'Bearer cf_not_a_real_token');
        expect(incorrectToken.status).toBe(401);

        await db('api_tokens').where({ id: apiTokenId }).del();
        const deletedToken = await publicRequest();
        expect(deletedToken.status).toBe(401);
    });

    it('records the last-used date after a valid token authenticates a request', async () => {
        const response = await publicRequest();
        expect(response.status).toBe(200);

        const storedToken = await db('api_tokens').where({ id: apiTokenId }).first();
        expect(storedToken?.last_used_at).not.toBeNull();
    });

    it('returns 404 for an unknown content type API ID', async () => {
        const response = await publicRequest('/api/unknown-public-content-type');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Content type not found.');
    });
});

describe('Public API query parsing', () => {
    it('caps pageSize at 100', async () => {
        const response = await publicRequest(`/api/${apiId}?pageSize=500`);

        expect(response.status).toBe(200);
        expect(response.body.meta).toMatchObject({
            page: 1,
            pageSize: 100,
            total: 3,
            totalPages: 1,
        });
    });

    it('sorts entries and filters text fields with contains', async () => {
        const sorted = await publicRequest(`/api/${apiId}?sort=title:asc`);
        expect(sorted.status).toBe(200);
        expect(sorted.body.data.map((entry: { title: string }) => entry.title)).toEqual([
            'Apple guide',
            'Tomato growing guide',
            'Zebra guide',
        ]);

        const filtered = await publicRequest(
            `/api/${apiId}?filters[title][contains]=tomato`,
        );
        expect(filtered.status).toBe(200);
        expect(filtered.body.data).toHaveLength(1);
        expect(filtered.body.data[0].title).toBe('Tomato growing guide');
    });

    it('rejects invalid query filters', async () => {
        const response = await publicRequest(
            `/api/${apiId}?filters[quantity][contains]=2`,
        );

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('quantity only supports equals filtering.');
    });
});
