import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import request, { type Test } from 'supertest';

import app from '../app.js';
import { db } from '../database/connection.js';

const apiIdPrefix = `test-entry-${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const token = jwt.sign(
    { adminId: 1, email: 'entry-test@contentflow.local' },
    process.env.JWT_SECRET!,
);
const auth = (testRequest: Test) =>
    testRequest.set('Authorization', `Bearer ${token}`);

let contentTypeId: number;

async function deleteTestContentTypes() {
    await db('content_types').where('api_id', 'like', `${apiIdPrefix}%`).del();
}

beforeEach(async () => {
    await deleteTestContentTypes();

    const response = await auth(request(app).post('/api/content-types')).send({
        name: 'Entry Test Type',
        apiId: `${apiIdPrefix}-items`,
        fields: [
            { name: 'title', type: 'short_text', required: true, unique: true },
            { name: 'quantity', type: 'number', required: true },
            { name: 'email', type: 'email', required: false, unique: true },
            { name: 'published_on', type: 'date', required: false },
            { name: 'status', type: 'enumeration', required: false, options: ['draft', 'published'] },
            { name: 'description', type: 'long_text', required: false },
        ],
    });

    expect(response.status).toBe(201);
    contentTypeId = response.body.id;
});

afterAll(async () => {
    await deleteTestContentTypes();
    await db.destroy();
});

const entriesUrl = () => `/api/content-types/${contentTypeId}/entries`;
const createEntry = (data: Record<string, unknown>) =>
    auth(request(app).post(entriesUrl())).send({ data });

describe('Content Entry API authentication', () => {
    it('rejects requests without a bearer token', async () => {
        const response = await request(app).get(entriesUrl());

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });
});

describe('Content Entry CRUD API', () => {
    it('creates, lists, reads, updates, and deletes an entry', async () => {
        const createResponse = await createEntry({
            title: 'First item',
            quantity: 2,
            email: 'editor@example.com',
            published_on: '2026-09-24',
            status: 'draft',
        });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.data.title).toBe('First item');
        expect(createResponse.body.content_type_id).toBe(contentTypeId);

        const entryId = createResponse.body.id as number;
        const listResponse = await auth(request(app).get(entriesUrl()));
        expect(listResponse.status).toBe(200);
        expect(listResponse.body.entries).toHaveLength(1);
        expect(listResponse.body.pagination).toMatchObject({
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
        });

        const readResponse = await auth(
            request(app).get(`${entriesUrl()}/${entryId}`),
        );
        expect(readResponse.status).toBe(200);
        expect(readResponse.body.id).toBe(entryId);

        const updateResponse = await auth(
            request(app).put(`${entriesUrl()}/${entryId}`),
        ).send({
            data: {
                title: 'Updated item',
                quantity: 3,
                status: 'published',
            },
        });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data).toEqual({
            title: 'Updated item',
            quantity: 3,
            status: 'published',
        });
        expect(new Date(updateResponse.body.updated_at).getTime()).toBeGreaterThanOrEqual(
            new Date(createResponse.body.updated_at).getTime(),
        );

        const deleteResponse = await auth(
            request(app).delete(`${entriesUrl()}/${entryId}`),
        );
        expect(deleteResponse.status).toBe(204);

        const missingResponse = await auth(
            request(app).get(`${entriesUrl()}/${entryId}`),
        );
        expect(missingResponse.status).toBe(404);
    });

    it('does not expose an entry through a different content type', async () => {
        const created = await createEntry({ title: 'Scoped item', quantity: 1 });
        const response = await auth(
            request(app).get(`/api/content-types/2147483000/entries/${created.body.id}`),
        );

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Content type not found');
    });
});

describe('Content Entry server validation', () => {
    it('rejects an empty required field with a field-specific error', async () => {
        const response = await createEntry({ title: '', quantity: 1 });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual({
            field: 'title',
            message: 'This field is required.',
        });
    });

    it('rejects whitespace in a required field during update', async () => {
        const created = await createEntry({ title: 'Update required', quantity: 1 });
        const response = await auth(
            request(app).put(`${entriesUrl()}/${created.body.id}`),
        ).send({ data: { title: '   ', quantity: 1 } });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual({
            field: 'title',
            message: 'This field is required.',
        });
    });

    it('rejects text in a number field', async () => {
        const response = await createEntry({ title: 'Numeric test', quantity: 'many' });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual({
            field: 'quantity',
            message: 'Must be a number.',
        });
    });

    it('rejects invalid email, date, and enumeration values', async () => {
        const invalidCases = [
            { email: 'not-an-email' },
            { published_on: '2026-02-30' },
            { status: 'archived' },
        ];

        for (const extraData of invalidCases) {
            const response = await createEntry({
                title: `Invalid ${Object.keys(extraData)[0]}`,
                quantity: 1,
                ...extraData,
            });
            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBeGreaterThan(0);
        }
    });

    it('revalidates number, email, date, and enumeration values during update', async () => {
        const created = await createEntry({ title: 'Update validation', quantity: 1 });
        const invalidCases = [
            { quantity: 'two' },
            { email: 'invalid-address' },
            { published_on: '2026-02-30' },
            { status: 'archived' },
        ];

        for (const extraData of invalidCases) {
            const response = await auth(
                request(app).put(`${entriesUrl()}/${created.body.id}`),
            ).send({
                data: {
                    title: 'Update validation',
                    quantity: 1,
                    ...extraData,
                },
            });
            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBeGreaterThan(0);
        }
    });

    it('rejects values for fields not defined on the content type', async () => {
        const response = await createEntry({
            title: 'Unknown key',
            quantity: 1,
            not_a_field: 'value',
        });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual({
            field: 'not_a_field',
            message: 'This field is not defined for the content type.',
        });
    });

    it('rejects duplicate unique field values with a clear conflict', async () => {
        await createEntry({ title: 'Unique item', quantity: 1, email: 'same@example.com' });
        const duplicate = await createEntry({
            title: 'Different title',
            quantity: 2,
            email: 'SAME@example.com',
        });

        expect(duplicate.status).toBe(409);
        expect(duplicate.body.errors).toContainEqual({
            field: 'email',
            message: 'A value for email already exists.',
        });
    });

    it('allows an entry to keep its own unique value when updating', async () => {
        const created = await createEntry({ title: 'Keep title', quantity: 1 });
        const response = await auth(
            request(app).put(`${entriesUrl()}/${created.body.id}`),
        ).send({ data: { title: 'Keep title', quantity: 2 } });

        expect(response.status).toBe(200);
        expect(response.body.data.quantity).toBe(2);
    });

    it('rejects a duplicate unique value when updating another entry', async () => {
        await createEntry({ title: 'Taken title', quantity: 1 });
        const second = await createEntry({ title: 'Available title', quantity: 2 });
        const response = await auth(
            request(app).put(`${entriesUrl()}/${second.body.id}`),
        ).send({ data: { title: 'Taken title', quantity: 2 } });

        expect(response.status).toBe(409);
        expect(response.body.errors).toContainEqual({
            field: 'title',
            message: 'A value for title already exists.',
        });
    });
});

describe('Content Entry list query behavior', () => {
    it('paginates 30 entries and sorts globally across page boundaries', async () => {
        const createdIds: number[] = [];
        for (let index = 1; index <= 30; index += 1) {
            const response = await createEntry({
                title: `Item ${String(index).padStart(2, '0')}`,
                quantity: index,
            });
            createdIds.push(response.body.id as number);
        }

        for (const [index, id] of createdIds.entries()) {
            await db('entries').where({ id }).update({
                updated_at: new Date(Date.UTC(2026, 0, 1, 0, index)),
            });
        }

        const firstPage = await auth(
            request(app).get(entriesUrl()).query({
                page: 1,
                pageSize: 10,
                sortBy: 'title',
                sortOrder: 'desc',
            }),
        );
        const lastPage = await auth(
            request(app).get(entriesUrl()).query({
                page: 3,
                pageSize: 10,
                sortBy: 'title',
                sortOrder: 'desc',
            }),
        );
        const numericPage = await auth(
            request(app).get(entriesUrl()).query({
                page: 1,
                pageSize: 10,
                sortBy: 'quantity',
                sortOrder: 'asc',
            }),
        );
        const largerPage = await auth(
            request(app).get(entriesUrl()).query({ page: 1, pageSize: 25 }),
        );
        const latestUpdatedFirstPage = await auth(
            request(app).get(entriesUrl()).query({
                page: 1,
                pageSize: 10,
                sortBy: 'updated_at',
                sortOrder: 'desc',
            }),
        );
        const latestUpdatedLastPage = await auth(
            request(app).get(entriesUrl()).query({
                page: 3,
                pageSize: 10,
                sortBy: 'updated_at',
                sortOrder: 'desc',
            }),
        );

        expect(firstPage.body.pagination).toMatchObject({ total: 30, totalPages: 3 });
        expect(firstPage.body.entries.map((entry: { data: { title: string } }) => entry.data.title))
            .toEqual(Array.from({ length: 10 }, (_, index) => `Item ${String(30 - index).padStart(2, '0')}`));
        expect(lastPage.body.entries.map((entry: { data: { title: string } }) => entry.data.title))
            .toEqual(Array.from({ length: 10 }, (_, index) => `Item ${String(10 - index).padStart(2, '0')}`));
        expect(numericPage.body.entries.map((entry: { data: { quantity: number } }) => entry.data.quantity))
            .toEqual(Array.from({ length: 10 }, (_, index) => index + 1));
        expect(largerPage.body.entries).toHaveLength(25);
        expect(largerPage.body.pagination.totalPages).toBe(2);
        expect(latestUpdatedFirstPage.body.entries.map((entry: { id: number }) => entry.id))
            .toEqual(createdIds.slice(-10).reverse());
        expect(latestUpdatedLastPage.body.entries.map((entry: { id: number }) => entry.id))
            .toEqual(createdIds.slice(0, 10).reverse());
    });

    it('rejects unsupported page sizes and sort fields', async () => {
        const invalidPageSize = await auth(
            request(app).get(entriesUrl()).query({ pageSize: 20 }),
        );
        const invalidSortField = await auth(
            request(app).get(entriesUrl()).query({ sortBy: 'not_a_field' }),
        );

        expect(invalidPageSize.status).toBe(400);
        expect(invalidSortField.status).toBe(400);
    });

    it('searches across text fields and returns only matching entries', async () => {
        await createEntry({ title: 'Needle in title', quantity: 1 });
        await createEntry({ title: 'Another item', quantity: 2, description: 'Needle in description' });
        await createEntry({ title: 'Unrelated item', quantity: 3 });

        const response = await auth(
            request(app).get(entriesUrl()).query({ search: 'needle' }),
        );

        expect(response.status).toBe(200);
        expect(response.body.pagination.total).toBe(2);
        expect(response.body.entries).toHaveLength(2);
    });

    it('counts filtered search results before applying pagination', async () => {
        for (let index = 1; index <= 12; index += 1) {
            await createEntry({
                title: `Matching guide ${String(index).padStart(2, '0')}`,
                quantity: index,
            });
        }
        for (let index = 1; index <= 3; index += 1) {
            await createEntry({ title: `Other item ${index}`, quantity: index + 12 });
        }

        const response = await auth(
            request(app).get(entriesUrl()).query({
                page: 2,
                pageSize: 10,
                search: 'matching guide',
            }),
        );

        expect(response.status).toBe(200);
        expect(response.body.pagination).toMatchObject({
            page: 2,
            pageSize: 10,
            total: 12,
            totalPages: 2,
        });
        expect(response.body.entries).toHaveLength(2);
        expect(response.body.entries.every((entry: { data: { title: string } }) =>
            entry.data.title.toLowerCase().includes('matching guide'),
        )).toBe(true);
    });
});
