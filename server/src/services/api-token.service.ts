import { createHash, randomBytes } from 'node:crypto';

export function generateApiToken(): string {
    return `cf_${randomBytes(32).toString('base64url')}`;
}

export function hashApiToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
