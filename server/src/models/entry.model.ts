import { db } from '../database/connection.js';

export interface EntryListOptions {
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
    searchableFields: string[];
    sortableFields: Array<{ name: string; type: string }>;
    filters?: Array<{
        field: string;
        operator: 'equals' | 'contains';
        value: string;
    }>;
}

export async function getEntries(
    contentTypeId: number,
    options: EntryListOptions,
) {
    const query = db('entries').where({ content_type_id: contentTypeId });

    if (options.search && options.searchableFields.length > 0) {
        query.andWhere((searchQuery) => {
            for (const field of options.searchableFields) {
                searchQuery.orWhereRaw('data ->> ? ILIKE ?', [
                    field,
                    `%${options.search}%`,
                ]);
            }
        });
    }

    for (const filter of options.filters ?? []) {
        if (filter.operator === 'equals') {
            query.andWhereRaw('data ->> ? = ?', [filter.field, filter.value]);
        } else {
            query.andWhereRaw('position(lower(?) in lower(data ->> ?)) > 0', [
                filter.value,
                filter.field,
            ]);
        }
    }

    const countResult = await query.clone().count<{ count: string }[]>('* as count').first();
    const total = Number(countResult?.count ?? 0);
    const records = await query
        .clone()
        .select('*')
        .modify((builder) => {
            if (options.sortBy === 'created_at' || options.sortBy === 'updated_at') {
                builder.orderBy(options.sortBy, options.sortOrder);
            } else {
                const sortField = options.sortableFields.find(
                    (field) => field.name === options.sortBy,
                );

                if (!sortField) {
                    builder.orderBy('updated_at', 'desc');
                } else if (sortField.type === 'number') {
                    builder.orderByRaw(
                        `NULLIF(data ->> ?, '')::numeric ${options.sortOrder} NULLS LAST`,
                        [sortField.name],
                    );
                } else if (sortField.type === 'date') {
                    builder.orderByRaw(
                        `NULLIF(data ->> ?, '')::date ${options.sortOrder} NULLS LAST`,
                        [sortField.name],
                    );
                } else if (sortField.type === 'boolean') {
                    builder.orderByRaw(
                        `NULLIF(data ->> ?, '')::boolean ${options.sortOrder} NULLS LAST`,
                        [sortField.name],
                    );
                } else {
                    builder.orderByRaw(
                        `data ->> ? ${options.sortOrder} NULLS LAST`,
                        [sortField.name],
                    );
                }
            }
        })
        .orderBy('id', 'asc')
        .limit(options.pageSize)
        .offset((options.page - 1) * options.pageSize);

    return {
        entries: records,
        pagination: {
            page: options.page,
            pageSize: options.pageSize,
            total,
            totalPages: Math.ceil(total / options.pageSize),
        },
    };
}

export async function getEntry(contentTypeId: number, id: number) {
    return db('entries').where({ content_type_id: contentTypeId, id }).first();
}

export async function createEntry(contentTypeId: number, data: Record<string, unknown>) {
    const [entry] = await db('entries')
        .insert({ content_type_id: contentTypeId, data: JSON.stringify(data) })
        .returning('*');
    return entry;
}

export async function updateEntry(
    contentTypeId: number,
    id: number,
    data: Record<string, unknown>,
) {
    const [entry] = await db('entries')
        .where({ content_type_id: contentTypeId, id })
        .update({ data: JSON.stringify(data), updated_at: db.fn.now() })
        .returning('*');
    return entry;
}

export async function deleteEntry(contentTypeId: number, id: number) {
    return db('entries').where({ content_type_id: contentTypeId, id }).del();
}

export async function findEntryWithUniqueValue(
    contentTypeId: number,
    fieldName: string,
    value: string,
    excludeId?: number,
) {
    const query = db('entries').where({ content_type_id: contentTypeId });
    if (excludeId !== undefined) query.whereNot({ id: excludeId });

    query.whereRaw(
        'lower(data ->> ?) = lower(?)',
        [fieldName, value],
    );

    return query.first();
}
