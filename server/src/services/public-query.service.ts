import type { EntryFieldDefinition } from '../schemas/entry.schema.js';

const MAX_PAGE_SIZE = 100;
const TEXT_FIELD_TYPES = new Set(['short_text', 'long_text', 'email', 'enumeration']);

export interface PublicEntryFilter {
    field: string;
    operator: 'equals' | 'contains';
    value: string;
}

export interface PublicEntryQuery {
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    filters: PublicEntryFilter[];
}

export class PublicQueryError extends Error {}

function readSingle(searchParams: URLSearchParams, name: string): string | undefined {
    const values = searchParams.getAll(name);
    if (values.length > 1) throw new PublicQueryError(`${name} must be supplied once.`);
    return values[0];
}

function parsePositiveInteger(value: string | undefined, name: string, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    if (!/^\d+$/.test(value)) throw new PublicQueryError(`${name} must be a positive integer.`);
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1) {
        throw new PublicQueryError(`${name} must be a positive integer.`);
    }
    return number;
}

export function parsePublicEntryQuery(
    originalUrl: string,
    fields: EntryFieldDefinition[],
): PublicEntryQuery {
    const searchParams = new URL(originalUrl, 'http://contentflow.local').searchParams;
    const page = parsePositiveInteger(readSingle(searchParams, 'page'), 'page', 1);
    const requestedPageSize = parsePositiveInteger(readSingle(searchParams, 'pageSize'), 'pageSize', 10);
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const sort = readSingle(searchParams, 'sort');

    let sortBy = 'updated_at';
    let sortOrder: 'asc' | 'desc' = 'desc';
    if (sort !== undefined) {
        const match = /^([^:]+):(asc|desc)$/i.exec(sort);
        if (!match) throw new PublicQueryError('sort must use the format field:asc or field:desc.');
        const [, requestedField, requestedOrder] = match;
        if (!requestedField || !requestedOrder) throw new PublicQueryError('Invalid sort value.');
        if (!fields.some((field) => field.name === requestedField) &&
            !['created_at', 'updated_at'].includes(requestedField)) {
            throw new PublicQueryError('sort must use a content field or timestamp.');
        }
        sortBy = requestedField;
        sortOrder = requestedOrder.toLowerCase() as 'asc' | 'desc';
    }

    const fieldByName = new Map(fields.map((field) => [field.name, field]));
    const filters: PublicEntryFilter[] = [];
    for (const [key, value] of searchParams.entries()) {
        if (!key.startsWith('filters[')) continue;

        const match = /^filters\[([^\]]+)]\[(equals|contains)]$/i.exec(key);
        if (!match) {
            throw new PublicQueryError('Filters must use filters[field][equals] or filters[field][contains].');
        }

        const [, fieldName, operator] = match;
        if (!fieldName || !operator) throw new PublicQueryError('Invalid filter.');
        const field = fieldByName.get(fieldName);
        if (!field) throw new PublicQueryError(`Unknown filter field: ${fieldName}.`);
        if (operator === 'contains' && !TEXT_FIELD_TYPES.has(field.type)) {
            throw new PublicQueryError(`${fieldName} only supports equals filtering.`);
        }
        filters.push({
            field: fieldName,
            operator: operator as PublicEntryFilter['operator'],
            value,
        });
    }

    return { page, pageSize, sortBy, sortOrder, filters };
}
