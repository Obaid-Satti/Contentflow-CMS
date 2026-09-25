import type { Request, Response } from 'express';
import { z } from 'zod';

import {
    createApiToken,
    deleteApiToken,
    listApiTokens,
} from '../models/api-token.model.js';
import { generateApiToken, hashApiToken } from '../services/api-token.service.js';

const createApiTokenSchema = z.object({
    name: z.string().trim().min(1, 'Token name is required.').max(100),
}).strict();

function parseTokenId(value: string | string[] | undefined): number | null {
    if (typeof value !== 'string') return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function createApiTokenController(req: Request, res: Response) {
    const parsed = createApiTokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues[0]?.message ?? 'Invalid token name.',
        });
    }

    try {
        const token = generateApiToken();
        const apiToken = await createApiToken(parsed.data.name, hashApiToken(token));

        return res.status(201).json({
            ...apiToken,
            token,
        });
    } catch (error) {
        console.error('CREATE API TOKEN ERROR:', error);
        return res.status(500).json({ message: 'Failed to create API token.' });
    }
}

export async function listApiTokensController(_req: Request, res: Response) {
    try {
        return res.json({ tokens: await listApiTokens() });
    } catch (error) {
        console.error('LIST API TOKENS ERROR:', error);
        return res.status(500).json({ message: 'Failed to list API tokens.' });
    }
}

export async function deleteApiTokenController(req: Request, res: Response) {
    const id = parseTokenId(req.params.tokenId);
    if (id === null) return res.status(400).json({ message: 'Invalid API token ID.' });

    try {
        const deleted = await deleteApiToken(id);
        if (!deleted) return res.status(404).json({ message: 'API token not found.' });
        return res.status(204).send();
    } catch (error) {
        console.error('DELETE API TOKEN ERROR:', error);
        return res.status(500).json({ message: 'Failed to delete API token.' });
    }
}
