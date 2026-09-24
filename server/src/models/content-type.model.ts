import { db } from '../database/connection.js';
import { validateEntryData, type EntryFieldDefinition } from '../schemas/entry.schema.js';

export interface ContentTypeFieldChange {
    fromName: string;
    toName: string;
    fromType: string;
    toType: string;
    uniqueChange?: boolean | undefined;
    confirmed?: boolean | undefined;
    deleteDuplicatesConfirmed?: boolean | undefined;
    defaultValue?: unknown;
}

type EntryData = Record<string, unknown>;

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

function parseEntryData(value: unknown): EntryData {
    if (typeof value === 'string') {
        try {
            const parsed: unknown = JSON.parse(value);
            return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
                ? parsed as EntryData
                : {};
        } catch {
            return {};
        }
    }
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value as EntryData
        : {};
}

function validateValue(field: EntryFieldDefinition, value: unknown): boolean {
    return validateEntryData([field], { [field.name]: value }).success;
}

function convertValue(value: unknown, target: EntryFieldDefinition): unknown | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    let converted: unknown = value;
    const stringTypes = ['short_text', 'long_text', 'email', 'enumeration', 'media'];
    if (stringTypes.includes(target.type)) {
        if (typeof value === 'number' || typeof value === 'boolean') converted = String(value);
        else if (typeof value !== 'string') return undefined;
    } else if (target.type === 'number') {
        if (typeof value === 'boolean') converted = value ? 1 : 0;
        else if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
            converted = Number(value);
        } else if (typeof value !== 'number') return undefined;
    } else if (target.type === 'boolean') {
        if (typeof value === 'number') {
            if (value === 0) converted = false;
            else if (value === 1) converted = true;
            else return undefined;
        } else if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['true', 'yes', '1'].includes(normalized)) converted = true;
            else if (['false', 'no', '0'].includes(normalized)) converted = false;
            else return undefined;
        } else if (typeof value !== 'boolean') return undefined;
    } else if (target.type === 'date' && typeof value !== 'string') {
        return undefined;
    }

    return validateValue(target, converted) ? converted : undefined;
}

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
    fieldChange?: ContentTypeFieldChange,
) {
    const updateData: Record<string, unknown> = {
        updated_at: db.fn.now(),
    };

    if (name !== undefined) updateData.name = name;
    if (apiId !== undefined) updateData.api_id = apiId;
    if (fields !== undefined) {
        updateData.fields = typeof fields === 'string' ? fields : JSON.stringify(fields);
    }

    return db.transaction(async (trx) => {
        const existing = await trx('content_types')
            .where({ id })
            .forUpdate()
            .first();
        if (!existing) return undefined;

        if (fieldChange && fields !== undefined) {
            const oldField = parseFields(existing.fields).find(
                (field) => field.name === fieldChange.fromName && field.type === fieldChange.fromType,
            );
            const newField = parseFields(fields).find(
                (field) => field.name === fieldChange.toName && field.type === fieldChange.toType,
            );

            if (!oldField || !newField) {
                return { kind: 'invalid_field_change' as const };
            }

            const entries = await trx('entries')
                .where({ content_type_id: id })
                .select('id', 'data', 'created_at')
                .forUpdate();
            const migratedEntries: Array<{ id: number; data: EntryData; createdAt: string | Date }> = [];
            let invalidCount = 0;

            for (const entry of entries) {
                const data = parseEntryData(entry.data);
                const sourceValue = data[fieldChange.fromName];
                const existingTargetValue = fieldChange.toName !== fieldChange.fromName
                    ? data[fieldChange.toName]
                    : undefined;
                let migratedValue: unknown;

                if (existingTargetValue !== undefined &&
                    validateValue(newField, existingTargetValue)) {
                    migratedValue = existingTargetValue;
                } else if (fieldChange.fromType === fieldChange.toType) {
                    migratedValue = sourceValue;
                } else {
                    migratedValue = convertValue(sourceValue, newField);
                }

                if (migratedValue === undefined || !validateValue(newField, migratedValue)) {
                    invalidCount += 1;
                    migratedValue = null;
                }

                migratedEntries.push({
                    id: entry.id as number,
                    data: {
                        ...data,
                        [fieldChange.toName]: migratedValue,
                    },
                    createdAt: entry.created_at as string | Date,
                });
                if (fieldChange.fromName !== fieldChange.toName) {
                    delete migratedEntries[migratedEntries.length - 1]?.data[fieldChange.fromName];
                }
            }

            if (invalidCount > 0 && newField.required && fieldChange.defaultValue !== undefined) {
                if (!validateValue(newField, fieldChange.defaultValue)) {
                    return { kind: 'invalid_default' as const };
                }
                for (const migrated of migratedEntries) {
                    if (migrated.data[fieldChange.toName] === null) {
                        migrated.data[fieldChange.toName] = fieldChange.defaultValue;
                    }
                }
            }

            const duplicateGroups = new Map<string, typeof migratedEntries>();
            if (newField.unique) {
                for (const migrated of migratedEntries) {
                    const value = migrated.data[fieldChange.toName];
                    if (value === null || value === undefined || value === '') continue;
                    const normalized = String(value).toLowerCase();
                    const group = duplicateGroups.get(normalized) ?? [];
                    group.push(migrated);
                    duplicateGroups.set(normalized, group);
                }
            }

            const duplicateGroupsWithConflicts = [...duplicateGroups.values()]
                .filter((group) => group.length > 1);
            const duplicateDeleteIds = new Set<number>();
            for (const group of duplicateGroupsWithConflicts) {
                for (const duplicate of group) duplicateDeleteIds.add(duplicate.id);
            }
            const canDeleteDuplicates = newField.unique && (
                fieldChange.fromType !== fieldChange.toType || (!oldField.unique && newField.unique)
            );
            if (duplicateDeleteIds.size > 0 && !canDeleteDuplicates) {
                return { kind: 'unique_conflict' as const, duplicateCount: duplicateDeleteIds.size };
            }

            if (!fieldChange.confirmed) {
                return {
                    kind: 'change_preview' as const,
                    totalCount: entries.length,
                    convertedCount: entries.length - invalidCount,
                    invalidCount,
                    required: newField.required,
                    duplicateDeleteCount: duplicateDeleteIds.size,
                };
            }

            if (invalidCount > 0 && newField.required && fieldChange.defaultValue === undefined) {
                return { kind: 'default_required' as const, invalidCount };
            }

            if (duplicateDeleteIds.size > 0 && !fieldChange.deleteDuplicatesConfirmed) {
                return {
                    kind: 'duplicate_delete_confirmation' as const,
                    duplicateDeleteCount: duplicateDeleteIds.size,
                };
            }

            if (duplicateDeleteIds.size > 0) {
                await trx('entries')
                    .where({ content_type_id: id })
                    .whereIn('id', [...duplicateDeleteIds])
                    .del();
            }

            for (const migrated of migratedEntries) {
                if (duplicateDeleteIds.has(migrated.id)) continue;
                await trx('entries')
                    .where({ id: migrated.id, content_type_id: id })
                    .update({ data: JSON.stringify(migrated.data), updated_at: trx.fn.now() });
            }
        }

        const [contentType] = await trx('content_types')
            .where({ id })
            .update(updateData)
            .returning('*');

        return contentType;
    });
}

export async function deleteContentType(id: number) {
    return db('content_types')
        .where({ id })
        .del();
}
