import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request, { type Test } from 'supertest';

const cloudinaryMocks = vi.hoisted(() => ({
    deleteCloudinaryAsset: vi.fn(),
}));

vi.mock('../services/cloudinary.service.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/cloudinary.service.js')>();
    return {
        ...actual,
        deleteCloudinaryAsset: cloudinaryMocks.deleteCloudinaryAsset,
    };
});

import app from '../app.js';
import { db } from '../database/connection.js';
import { MAX_MEDIA_SIZE_BYTES } from '../services/cloudinary.service.js';

const runId = randomUUID().replaceAll('-', '').slice(0, 12);
const apiId = `test-media-${runId}-items`;
const fileNamePrefix = `test-media-${runId}`;
const token = jwt.sign(
    { adminId: 1, email: 'media-test@contentflow.local' },
    process.env.JWT_SECRET!,
);
const auth = (testRequest: Test) => testRequest.set('Authorization', `Bearer ${token}`);

let contentTypeId: number;

async function cleanUp() {
    await db('media').where('file_name', 'like', `${fileNamePrefix}%`).del();
    await db('content_types').where({ api_id: apiId }).del();
}

beforeEach(async () => {
    await cleanUp();
    cloudinaryMocks.deleteCloudinaryAsset.mockReset();
    cloudinaryMocks.deleteCloudinaryAsset.mockResolvedValue({ result: 'ok' });

    const contentTypeResponse = await auth(request(app).post('/api/content-types')).send({
        name: 'Media Test Item',
        apiId,
        fields: [
            { name: 'title', type: 'short_text', required: true },
            { name: 'cover', type: 'media', required: false },
        ],
    });
    expect(contentTypeResponse.status).toBe(201);
    contentTypeId = contentTypeResponse.body.id;
});

afterAll(async () => {
    await cleanUp();
    await db.destroy();
});

describe('Media upload validation', () => {
    it('rejects files larger than 5 MB with a clear limit message', async () => {
        const response = await auth(request(app).post('/api/media/upload-signature')).send({
            file_name: `${fileNamePrefix}-oversized.png`,
            mime: 'image/png',
            size_bytes: MAX_MEDIA_SIZE_BYTES + 1,
        });

        expect(response.status).toBe(413);
        expect(response.body.message).toBe('File exceeds the 5 MB upload limit.');
    });

    it('rejects unsupported file types and lists the allowed types', async () => {
        const response = await auth(request(app).post('/api/media/upload-signature')).send({
            file_name: `${fileNamePrefix}-unsupported.exe`,
            mime: 'application/octet-stream',
            size_bytes: 1024,
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Unsupported file type. Allowed types: JPG, PNG, WebP, GIF, PDF.',
        );
    });
});

describe('Media deletion', () => {
    it('deletes the Cloudinary file and clears references from entries', async () => {
        const publicId = randomUUID();
        const storedPath = `https://res.cloudinary.com/contentflow-test/image/upload/v1/${publicId}.png`;
        const [media] = await db('media').insert({
            file_name: `${fileNamePrefix}-cover.png`,
            stored_path: storedPath,
            mime: 'image/png',
            size_bytes: 1024,
            alt_text: '',
        }).returning('*');
        const [entry] = await db('entries').insert({
            content_type_id: contentTypeId,
            data: { title: 'Entry with cover', cover: storedPath },
        }).returning('*');

        const response = await auth(request(app).delete(`/api/media/${media.id}`));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Media file deleted.', id: media.id });
        expect(cloudinaryMocks.deleteCloudinaryAsset).toHaveBeenCalledWith(publicId, 'image');
        await expect(db('media').where({ id: media.id }).first()).resolves.toBeUndefined();
        await expect(db('entries').where({ id: entry.id }).first('data')).resolves.toMatchObject({
            data: { title: 'Entry with cover', cover: null },
        });
    });

    it('keeps the media record and entry reference when Cloudinary deletion fails', async () => {
        cloudinaryMocks.deleteCloudinaryAsset.mockResolvedValue({ result: 'error' });
        const publicId = randomUUID();
        const storedPath = `https://res.cloudinary.com/contentflow-test/image/upload/v1/${publicId}.png`;
        const [media] = await db('media').insert({
            file_name: `${fileNamePrefix}-failed-delete.png`,
            stored_path: storedPath,
            mime: 'image/png',
            size_bytes: 1024,
            alt_text: '',
        }).returning('*');
        const [entry] = await db('entries').insert({
            content_type_id: contentTypeId,
            data: { title: 'Entry retaining cover', cover: storedPath },
        }).returning('*');

        const response = await auth(request(app).delete(`/api/media/${media.id}`));

        expect(response.status).toBe(502);
        expect(response.body.message).toBe('Cloudinary could not delete this file.');
        await expect(db('media').where({ id: media.id }).first()).resolves.toBeDefined();
        await expect(db('entries').where({ id: entry.id }).first('data')).resolves.toMatchObject({
            data: { title: 'Entry retaining cover', cover: storedPath },
        });
    });
});
