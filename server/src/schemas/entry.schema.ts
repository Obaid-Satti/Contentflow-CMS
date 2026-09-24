import { z } from 'zod';

export interface EntryFieldDefinition {
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
    options?: string[];
}

export interface EntryValidationIssue {
    field: string;
    message: string;
}

export function validateEntryData(
    fields: EntryFieldDefinition[],
    input: unknown,
): { success: true; data: Record<string, unknown> } | {
    success: false;
    errors: EntryValidationIssue[];
} {
    const parsedObject = z.record(z.string(), z.unknown()).safeParse(input);
    if (!parsedObject.success) {
        return {
            success: false,
            errors: [{ field: '_form', message: 'Entry data must be a JSON object.' }],
        };
    }

    const data = parsedObject.data;
    const errors: EntryValidationIssue[] = [];
    const knownNames = new Set(fields.map((field) => field.name));

    for (const key of Object.keys(data)) {
        if (!knownNames.has(key)) {
            errors.push({ field: key, message: 'This field is not defined for the content type.' });
        }
    }

    for (const field of fields) {
        const value = data[field.name];
        const isEmpty = value === undefined || value === null || value === '';

        if (isEmpty) {
            if (field.required) {
                errors.push({ field: field.name, message: 'This field is required.' });
            }
            continue;
        }

        let valid: boolean;
        switch (field.type) {
            case 'short_text':
            case 'long_text':
                valid = typeof value === 'string';
                break;
            case 'number':
                valid = typeof value === 'number' && Number.isFinite(value);
                break;
            case 'boolean':
                valid = typeof value === 'boolean';
                break;
            case 'date':
                valid = isValidDate(value);
                break;
            case 'email':
                valid = typeof value === 'string' && z.email().safeParse(value).success;
                break;
            case 'enumeration':
                valid = typeof value === 'string' && Boolean(field.options?.includes(value));
                break;
            case 'media':
                valid = typeof value === 'string';
                break;
            default:
                valid = false;
        }

        if (!valid) {
            errors.push({ field: field.name, message: getTypeErrorMessage(field) });
        }
    }

    return errors.length > 0
        ? { success: false, errors }
        : { success: true, data };
}

function isValidDate(value: unknown): boolean {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getTypeErrorMessage(field: EntryFieldDefinition): string {
    switch (field.type) {
        case 'short_text':
        case 'long_text':
            return 'Must be text.';
        case 'number':
            return 'Must be a number.';
        case 'boolean':
            return 'Must be true or false.';
        case 'date':
            return 'Must be a valid date in YYYY-MM-DD format.';
        case 'email':
            return 'Must be a valid email address.';
        case 'enumeration':
            return `Must be one of: ${(field.options ?? []).join(', ')}.`;
        case 'media':
            return 'Must be a media file reference.';
        default:
            return 'This field has an unsupported type.';
    }
}
