import type { Request, Response } from 'express';

import { getContentTypeById } from '../models/content-type.model.js';
import {
    createEntry,
    deleteEntry,
    findEntryWithUniqueValue,
    getEntries,
    getEntry,
    updateEntry,
} from '../models/entry.model.js';
import {
    validateEntryData,
    type EntryFieldDefinition,
} from '../schemas/entry.schema.js';

function parseId(value: string | string[] | undefined): number | null {
    if (typeof value !== 'string') return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getFieldDefinitions(contentType: { fields: unknown }): EntryFieldDefinition[] {
    const fields = typeof contentType.fields === 'string'
        ? JSON.parse(contentType.fields) as unknown
        : contentType.fields;
    return Array.isArray(fields) ? fields as EntryFieldDefinition[] : [];
}

async function validateAndCheckUnique(
    contentTypeId: number,
    fields: EntryFieldDefinition[],
    input: unknown,
    excludeEntryId?: number,
) {
    const result = validateEntryData(fields, input);
    if (!result.success) return { ...result, status: 400 as const };

    const errors = [];
    for (const field of fields) {
        const value = result.data[field.name];
        if (!field.unique || value === undefined || value === null || value === '') {
            continue;
        }

        const duplicate = await findEntryWithUniqueValue(
            contentTypeId,
            field.name,
            String(value),
            excludeEntryId,
        );
        if (duplicate) {
            errors.push({
                field: field.name,
                message: `A value for ${field.name} already exists.`,
            });
        }
    }

    return errors.length > 0
        ? { success: false as const, status: 409 as const, errors }
        : result;
}

export async function listEntriesController(req: Request, res: Response) {
    try {
        const contentTypeId = parseId(req.params.contentTypeId);
        if (contentTypeId === null) {
            return res.status(400).json({ message: 'Invalid content type ID' });
        }

        const contentType = await getContentTypeById(contentTypeId);
        if (!contentType) {
            return res.status(404).json({ message: 'Content type not found' });
        }

        const fields = getFieldDefinitions(contentType);
        const page = Number(req.query.page ?? 1);
        const pageSize = Number(req.query.pageSize ?? 10);
        const sortBy = typeof req.query.sortBy === 'string'
            ? req.query.sortBy
            : 'updated_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const search = typeof req.query.search === 'string'
            ? req.query.search.trim().slice(0, 200)
            : undefined;

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({ message: 'Page must be a positive integer' });
        }
        if (!Number.isInteger(pageSize) || ![10, 25].includes(pageSize)) {
            return res.status(400).json({ message: 'Page size must be 10 or 25' });
        }

        const result = await getEntries(contentTypeId, {
            page,
            pageSize,
            sortBy,
            sortOrder,
            ...(search !== undefined ? { search } : {}),
            searchableFields: fields
                .filter((field) => ['short_text', 'long_text', 'email'].includes(field.type))
                .map((field) => field.name),
            sortableFields: fields.map((field) => field.name),
        });

        return res.json(result);
    } catch (error) {
        console.error('LIST ENTRIES ERROR:', error);
        return res.status(500).json({ message: 'Failed to list entries' });
    }
}

export async function getEntryController(req: Request, res: Response) {
    try {
        const contentTypeId = parseId(req.params.contentTypeId);
        const entryId = parseId(req.params.entryId);
        if (contentTypeId === null || entryId === null) {
            return res.status(400).json({ message: 'Invalid content type or entry ID' });
        }

        const contentType = await getContentTypeById(contentTypeId);
        if (!contentType) {
            return res.status(404).json({ message: 'Content type not found' });
        }

        const entry = await getEntry(contentTypeId, entryId);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        return res.json(entry);
    } catch (error) {
        console.error('GET ENTRY ERROR:', error);
        return res.status(500).json({ message: 'Failed to get entry' });
    }
}

export async function createEntryController(req: Request, res: Response) {
    try {
        const contentTypeId = parseId(req.params.contentTypeId);
        if (contentTypeId === null) {
            return res.status(400).json({ message: 'Invalid content type ID' });
        }

        const contentType = await getContentTypeById(contentTypeId);
        if (!contentType) {
            return res.status(404).json({ message: 'Content type not found' });
        }

        const result = await validateAndCheckUnique(
            contentTypeId,
            getFieldDefinitions(contentType),
            req.body?.data,
        );
        if (!result.success) {
            return res.status(result.status)
                .json({ message: 'Entry validation failed', errors: result.errors });
        }

        const entry = await createEntry(contentTypeId, result.data);
        return res.status(201).json(entry);
    } catch (error) {
        console.error('CREATE ENTRY ERROR:', error);
        return res.status(500).json({ message: 'Failed to create entry' });
    }
}

export async function updateEntryController(req: Request, res: Response) {
    try {
        const contentTypeId = parseId(req.params.contentTypeId);
        const entryId = parseId(req.params.entryId);
        if (contentTypeId === null || entryId === null) {
            return res.status(400).json({ message: 'Invalid content type or entry ID' });
        }

        const contentType = await getContentTypeById(contentTypeId);
        if (!contentType) {
            return res.status(404).json({ message: 'Content type not found' });
        }
        const existingEntry = await getEntry(contentTypeId, entryId);
        if (!existingEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        const result = await validateAndCheckUnique(
            contentTypeId,
            getFieldDefinitions(contentType),
            req.body?.data,
            entryId,
        );
        if (!result.success) {
            return res.status(result.status)
                .json({ message: 'Entry validation failed', errors: result.errors });
        }

        const entry = await updateEntry(contentTypeId, entryId, result.data);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        return res.json(entry);
    } catch (error) {
        console.error('UPDATE ENTRY ERROR:', error);
        return res.status(500).json({ message: 'Failed to update entry' });
    }
}

export async function deleteEntryController(req: Request, res: Response) {
    try {
        const contentTypeId = parseId(req.params.contentTypeId);
        const entryId = parseId(req.params.entryId);
        if (contentTypeId === null || entryId === null) {
            return res.status(400).json({ message: 'Invalid content type or entry ID' });
        }

        const contentType = await getContentTypeById(contentTypeId);
        if (!contentType) {
            return res.status(404).json({ message: 'Content type not found' });
        }

        const deletedRows = await deleteEntry(contentTypeId, entryId);
        if (deletedRows === 0) return res.status(404).json({ message: 'Entry not found' });
        return res.status(204).send();
    } catch (error) {
        console.error('DELETE ENTRY ERROR:', error);
        return res.status(500).json({ message: 'Failed to delete entry' });
    }
}
