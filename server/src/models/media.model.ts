import { db } from '../database/connection.js';

export interface MediaRecord {
    id: number;
    file_name: string;
    stored_path: string;
    mime: string;
    size_bytes: string | number;
    alt_text: string;
    created_at: Date;
}

export type NewMediaRecord = Omit<MediaRecord, 'id' | 'created_at'>;

export async function createMedia(media: NewMediaRecord): Promise<MediaRecord> {
    const [created] = await db('media').insert(media).returning('*');
    return created as MediaRecord;
}
