import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://localhost:5000/api';
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const adminEmail = `e2e-${runId}@contentflow.test`;
const adminPassword = 'ContentFlowE2E!123';
const serverRequire = createRequire(path.resolve(process.cwd(), 'server/package.json'));
const dotenv = serverRequire('dotenv') as { config: (options: { path: string }) => void };
const bcrypt = serverRequire('bcrypt') as { hash: (value: string, rounds: number) => Promise<string> };
const { Client } = serverRequire('pg') as {
    Client: new (config: Record<string, unknown>) => {
        connect: () => Promise<void>;
        end: () => Promise<void>;
        query: (text: string, values?: unknown[]) => Promise<unknown>;
    };
};

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const database = new Client(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

test.beforeAll(async () => {
    await database.connect();
    await database.query(
        'INSERT INTO admins (email, password_hash) VALUES ($1, $2)',
        [adminEmail, await bcrypt.hash(adminPassword, 12)],
    );
});

test.afterAll(async () => {
    await database.query('DELETE FROM admins WHERE email = $1', [adminEmail]);
    await database.end();
});

test('admin can create content and retrieve it through the public API', async ({ page, request }) => {
    const suffix = runId;
    const contentTypeName = `E2E Article ${suffix}`;
    const apiId = `e2e-articles-${suffix}`;
    const entryTitle = `Published from Playwright ${suffix}`;
    let adminToken = '';
    let contentTypeId: number | undefined;
    let apiTokenId: number | undefined;

    try {
        await page.goto('/login');
        await page.locator('#email').fill(adminEmail);
        await page.locator('#password').fill(adminPassword);
        await page.getByRole('button', { name: 'Sign in to ContentFlow' }).click();
        await expect(page).toHaveURL(/\/content-manager$/);

        adminToken = await page.evaluate(() => localStorage.getItem('contentflow_token') ?? '');
        expect(adminToken).not.toBe('');

        await page.goto('/content-types');
        await page.getByRole('button', { name: 'Create new content type' }).click();
        await page.locator('#content-type-name').fill(contentTypeName);
        await page.locator('#content-type-api-id').fill(apiId);
        await page.getByRole('button', { name: 'Create Content Type' }).click();
        await expect(page.getByRole('table').getByText(contentTypeName, { exact: true })).toBeVisible();

        const contentTypesResponse = await request.get(`${apiBaseUrl}/content-types`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(contentTypesResponse.ok()).toBeTruthy();
        const contentTypes = await contentTypesResponse.json() as Array<{ id: number; api_id: string }>;
        contentTypeId = contentTypes.find((contentType) => contentType.api_id === apiId)?.id;
        expect(contentTypeId).toBeDefined();

        const contentTypeRow = page.getByRole('row').filter({ hasText: contentTypeName });
        await contentTypeRow.getByRole('button', { name: 'Fields' }).click();
        await page.locator('#field-name').fill('title');
        await page.getByLabel('Required').check();
        await page.getByRole('button', { name: 'Add Field' }).click();
        await expect(contentTypeRow.getByRole('button', { name: 'title' })).toBeVisible();

        await page.goto(`/content-manager/${contentTypeId}/entries/new`);
        await page.locator('#entry-title').fill(entryTitle);
        await page.getByRole('button', { name: 'Create Entry' }).click();
        await expect(page).toHaveURL(new RegExp(`/content-manager/${contentTypeId}$`));
        await expect(page.getByText(entryTitle, { exact: true })).toBeVisible();

        const createTokenResponse = await request.post(`${apiBaseUrl}/api-tokens`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { name: `Playwright ${suffix}` },
        });
        expect(createTokenResponse.status()).toBe(201);
        const { id, token: publicToken } = await createTokenResponse.json() as {
            id: number;
            token: string;
        };
        apiTokenId = id;

        const publicResponse = await request.get(`${apiBaseUrl}/${apiId}`, {
            headers: { Authorization: `Bearer ${publicToken}` },
        });
        expect(publicResponse.status()).toBe(200);
        const publicContent = await publicResponse.json() as {
            data: Array<{ title: string }>;
            meta: { total: number };
        };
        expect(publicContent.meta.total).toBe(1);
        expect(publicContent.data).toContainEqual(expect.objectContaining({ title: entryTitle }));
    } finally {
        if (adminToken && contentTypeId) {
            await request.delete(`${apiBaseUrl}/content-types/${contentTypeId}`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
        }
        if (adminToken && apiTokenId) {
            await request.delete(`${apiBaseUrl}/api-tokens/${apiTokenId}`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });
        }
    }
});
