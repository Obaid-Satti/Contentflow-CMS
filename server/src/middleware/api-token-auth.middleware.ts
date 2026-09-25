import type { NextFunction, Request, Response } from 'express';

import {
    findApiTokenByHash,
    recordApiTokenUse,
} from '../models/api-token.model.js';
import { hashApiToken } from '../services/api-token.service.js';

export interface ApiTokenRequest extends Request {
    apiToken?: {
        id: number;
        name: string;
    };
}

function unauthorized(res: Response) {
    return res.status(401).json({ message: 'Unauthorized' });
}

export async function apiTokenAuthMiddleware(
    req: ApiTokenRequest,
    res: Response,
    next: NextFunction,
) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

    if (!token) return unauthorized(res);

    try {
        const apiToken = await findApiTokenByHash(hashApiToken(token));
        if (!apiToken) return unauthorized(res);

        const recorded = await recordApiTokenUse(apiToken.id);
        if (!recorded) return unauthorized(res);

        req.apiToken = { id: apiToken.id, name: apiToken.name };
        return next();
    } catch (error) {
        console.error('API TOKEN AUTH ERROR:', error);
        return res.status(500).json({ message: 'Failed to authenticate API token.' });
    }
}
