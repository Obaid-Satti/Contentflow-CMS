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

export async function listMedia(): Promise<MediaRecord[]> {
    return db<MediaRecord>('media')
        .select('*')
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc');
}

export async function getMediaById(id: number): Promise<MediaRecord | undefined> {
    return db<MediaRecord>('media').where({ id }).first();
}

export async function updateMediaAltText(
    id: number,
    altText: string,
): Promise<MediaRecord | undefined> {
    const [updated] = await db<MediaRecord>('media')
        .where({ id })
        .update({ alt_text: altText })
        .returning('*');
    return updated;
}

export async function deleteMediaById(id: number): Promise<MediaRecord | undefined> {
    return db.transaction(async (trx) => {
        const media = await trx<MediaRecord>('media').where({ id }).first();
        if (!media) return undefined;

        const publicPath = `/${media.stored_path.replaceAll('\\', '/')}`;
        await trx.raw(
            `WITH referenced_media_fields AS (
                 SELECT entry.id, field_definition.value ->> 'name' AS field_name
                 FROM entries AS entry
                 JOIN content_types AS content_type
                   ON content_type.id = entry.content_type_id
                 CROSS JOIN LATERAL jsonb_array_elements(content_type.fields)
                   AS field_definition(value)
                 WHERE field_definition.value ->> 'type' = 'media'
                   AND (
                       entry.data ->> (field_definition.value ->> 'name') IN (?, ?)
                       OR right(
                           entry.data ->> (field_definition.value ->> 'name'),
                           length(?)
                       ) = ?
                   )
             )
             UPDATE entries AS entry
             SET data = (
                 SELECT COALESCE(
                     jsonb_object_agg(
                         entry_field.field_name,
                         CASE
                             WHEN EXISTS (
                                 SELECT 1
                                 FROM referenced_media_fields
                                 WHERE referenced_media_fields.id = entry.id
                                   AND referenced_media_fields.field_name = entry_field.field_name
                             )
                             THEN 'null'::jsonb
                             ELSE entry_field.field_value
                         END
                     ),
                     '{}'::jsonb
                 )
                 FROM jsonb_each(entry.data) AS entry_field(field_name, field_value)
             ),
             updated_at = CURRENT_TIMESTAMP
             WHERE entry.id IN (SELECT id FROM referenced_media_fields)`,
            [media.stored_path, publicPath, publicPath, publicPath],
        );

        await trx('media').where({ id }).del();
        return media;
    });
}
