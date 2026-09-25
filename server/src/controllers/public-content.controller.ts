import type { Request, Response } from 'express';

import { getContentTypeByApiId } from '../models/content-type.model.js';
import { getEntries, getEntry } from '../models/entry.model.js';
import { getMediaByStoredPaths, type MediaRecord } from '../models/media.model.js';
import type { EntryFieldDefinition } from '../schemas/entry.schema.js';

type EntryData = Record<string, unknown>;

function parseEntryId(value: string | string[] | undefined): number | null {
    if (typeof value !== 'string') return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseFields(value: unknown): EntryFieldDefinition[] {
    let fields = value;
    if (typeof fields === 'string') {
        try {
            fields = JSON.parse(fields) as unknown;
        } catch {
            return [];
        }
    }
    return Array.isArray(fields) ? fields as EntryFieldDefinition[] : [];
}

function parseData(value: unknown): EntryData {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value) as unknown;
        } catch {
            return {};
        }
    }
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value as EntryData
        : {};
}

function toPublicMedia(media: MediaRecord) {
    return {
        url: media.stored_path,
        name: media.file_name,
        mime: media.mime,
        alt: media.alt_text,
    };
}

async function expandEntryMedia(
    entries: Array<{ id: number; data: unknown; created_at: Date; updated_at: Date }>,
    fields: EntryFieldDefinition[],
) {
    const mediaFieldNames = fields
        .filter((field) => field.type === 'media')
        .map((field) => field.name);
    const dataByEntry = entries.map((entry) => parseData(entry.data));
    const paths = dataByEntry.flatMap((data) => mediaFieldNames
        .map((fieldName) => data[fieldName])
        .filter((value): value is string => typeof value === 'string' && value.length > 0));
    const mediaByPath = new Map(
        (await getMediaByStoredPaths(paths)).map((media) => [media.stored_path, media]),
    );

    return entries.map((entry, index) => {
        const data = { ...dataByEntry[index] };
        for (const fieldName of mediaFieldNames) {
            const reference = data[fieldName];
            if (reference === undefined) continue;
            data[fieldName] = typeof reference === 'string'
                ? (mediaByPath.get(reference) ? toPublicMedia(mediaByPath.get(reference)!) : null)
                : null;
        }

        return {
            id: entry.id,
            ...data,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
        };
    });
}

export async function listPublicEntriesController(req: Request, res: Response) {
    try {
        const apiId = req.params.apiId;
        if (typeof apiId !== 'string') return res.status(404).json({ message: 'Content type not found.' });

        const contentType = await getContentTypeByApiId(apiId);
        if (!contentType) return res.status(404).json({ message: 'Content type not found.' });

        const fields = parseFields(contentType.fields);
        const result = await getEntries(contentType.id, {
            page: 1,
            pageSize: 10,
            sortBy: 'updated_at',
            sortOrder: 'desc',
            searchableFields: [],
            sortableFields: fields.map((field) => ({ name: field.name, type: field.type })),
        });

        return res.json({
            data: await expandEntryMedia(result.entries, fields),
            meta: result.pagination,
        });
    } catch (error) {
        console.error('LIST PUBLIC ENTRIES ERROR:', error);
        return res.status(500).json({ message: 'Failed to get content entries.' });
    }
}

export async function getPublicEntryController(req: Request, res: Response) {
    try {
        const apiId = req.params.apiId;
        const entryId = parseEntryId(req.params.entryId);
        if (typeof apiId !== 'string' || entryId === null) {
            return res.status(404).json({ message: 'Content entry not found.' });
        }

        const contentType = await getContentTypeByApiId(apiId);
        if (!contentType) return res.status(404).json({ message: 'Content type not found.' });

        const entry = await getEntry(contentType.id, entryId);
        if (!entry) return res.status(404).json({ message: 'Content entry not found.' });

        const [data] = await expandEntryMedia([entry], parseFields(contentType.fields));
        return res.json({ data });
    } catch (error) {
        console.error('GET PUBLIC ENTRY ERROR:', error);
        return res.status(500).json({ message: 'Failed to get content entry.' });
    }
}
