import { db } from '../database/connection.js';

export interface ApiTokenRecord {
    id: number;
    name: string;
    token_hash: string;
    created_at: Date;
    last_used_at: Date | null;
}

export type ApiTokenSummary = Omit<ApiTokenRecord, 'token_hash'>;

export async function createApiToken(
    name: string,
    tokenHash: string,
): Promise<ApiTokenSummary> {
    const [token] = await db('api_tokens')
        .insert({ name, token_hash: tokenHash })
        .returning(['id', 'name', 'created_at', 'last_used_at']);
    return token as ApiTokenSummary;
}



export async function listApiTokens(): Promise<ApiTokenSummary[]> {
    return db<ApiTokenSummary>('api_tokens')
        .select('id', 'name', 'created_at', 'last_used_at')
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc');
}

export async function deleteApiToken(id: number): Promise<boolean> {
    return (await db('api_tokens').where({ id }).del()) > 0;
}
