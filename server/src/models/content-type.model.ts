import { db } from '../database/connection.js';

export async function createContentType(
    name: string,
    apiId: string,
    fields: unknown = [],
) {
    const [contentType] = await db('content_types')
        .insert({
            name,
            api_id: apiId,
            fields: typeof fields === 'string' ? fields : JSON.stringify(fields ?? []),
        })
        .returning('*');

    return contentType;
}

export async function getContentTypes() {
    return db('content_types')
        .select('*')
        .orderBy('created_at', 'desc');
}

export async function getContentTypeById(id: number) {
    return db('content_types')
        .where({ id })
        .first();
}

export async function updateContentType(
    id: number,
    name?: string,
    apiId?: string,
    fields?: unknown,
) {
    const updateData: Record<string, unknown> = {
        updated_at: db.fn.now(),
    };

    if (name !== undefined) updateData.name = name;
    if (apiId !== undefined) updateData.api_id = apiId;
    if (fields !== undefined) {
        updateData.fields = typeof fields === 'string' ? fields : JSON.stringify(fields);
    }

    const [contentType] = await db('content_types')
        .where({ id })
        .update(updateData)
        .returning('*');

    return contentType;
}

export async function deleteContentType(id: number) {
    return db('content_types')
        .where({ id })
        .del();
}