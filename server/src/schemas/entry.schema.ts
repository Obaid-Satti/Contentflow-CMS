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

function isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getValueSchema(field: EntryFieldDefinition): z.ZodType {
    switch (field.type) {
        case 'short_text':
        case 'long_text':
            return z.string({ error: 'Must be text.' });
        case 'number':
            return z.number({ error: 'Must be a number.' }).finite('Must be a finite number.');
        case 'boolean':
            return z.boolean({ error: 'Must be true or false.' });
        case 'date':
            return z.string().refine(isValidDate, 'Must be a valid date in YYYY-MM-DD format.');
        case 'email':
            return z.email('Must be a valid email address.');
        case 'enumeration':
            return z.string().refine(
                (value) => field.options?.includes(value) ?? false,
                `Must be one of: ${(field.options ?? []).join(', ')}.`,
            );
        case 'media':
            return z.string().min(1, 'Must be a media file reference.');
        default:
            return z.never({ error: 'This field has an unsupported type.' });
    }
}

export function validateEntryData(
    fields: EntryFieldDefinition[],
    input: unknown,
): { success: true; data: Record<string, unknown> } | {
    success: false;
    errors: EntryValidationIssue[];
} {
    const entryDataSchema = z.record(z.string(), z.unknown()).superRefine((data, ctx) => {
        const definedFields = new Set(fields.map((field) => field.name));

        for (const key of Object.keys(data)) {
            if (!definedFields.has(key)) {
                ctx.addIssue({
                    code: 'custom',
                    path: [key],
                    message: 'This field is not defined for the content type.',
                });
            }
        }

        for (const field of fields) {
            const value = data[field.name];
            const empty = value === undefined || value === null || value === '' ||
                (typeof value === 'string' && value.trim() === '');

            if (empty) {
                if (field.required) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [field.name],
                        message: 'This field is required.',
                    });
                }
                continue;
            }

            const parsedValue = getValueSchema(field).safeParse(value);
            if (!parsedValue.success) {
                ctx.addIssue({
                    code: 'custom',
                    path: [field.name],
                    message: parsedValue.error.issues[0]?.message ?? 'Invalid field value.',
                });
            }
        }
    });

    const parsed = entryDataSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            errors: parsed.error.issues.map((issue) => ({
                field: typeof issue.path[0] === 'string' ? issue.path[0] : '_form',
                message: issue.message,
            })),
        };
    }

    return { success: true, data: parsed.data };
}
