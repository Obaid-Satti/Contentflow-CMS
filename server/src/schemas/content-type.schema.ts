import { z } from 'zod';

const RESERVED_FIELD_NAMES = ['id', 'created_at', 'updated_at'] as const;

const fieldTypeSchema = z.enum([
    'short_text',
    'long_text',
    'number',
    'boolean',
    'date',
    'email',
    'enumeration',
    'media',
]);

const contentTypeFieldSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Field name is required')
            .refine(
                (name) => !RESERVED_FIELD_NAMES.includes(
                    name as (typeof RESERVED_FIELD_NAMES)[number],
                ),
                {
                    message: 'Field name is reserved',
                },
            ),

        type: fieldTypeSchema,

        required: z.boolean(),

        unique: z.boolean().optional(),

        options: z.array(z.string().min(1)).optional(),
    })
    .superRefine((field, ctx) => {
        // unique is allowed only for short_text and email
        if (
            field.unique === true &&
            field.type !== 'short_text' &&
            field.type !== 'email'
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['unique'],
                message: 'Unique is only allowed for short_text and email fields',
            });
        }

        // options are required for enumeration
        if (field.type === 'enumeration') {
            if (!field.options || field.options.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['options'],
                    message: 'Options are required for enumeration fields',
                });
            }
        }

        // options are not allowed for other field types
        if (field.type !== 'enumeration' && field.options !== undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['options'],
                message: 'Options are only allowed for enumeration fields',
            });
        }
    });

export const createContentTypeSchema = z.object({
    name: z
        .string()
        .min(1, 'Content type name is required'),

    apiId: z
        .string()
        .min(1, 'API ID is required')
        .regex(
            /^[a-z0-9-]+$/,
            'API ID can only contain lowercase letters, numbers, and hyphens',
        ),

    fields: z.array(contentTypeFieldSchema).superRefine((fields, ctx) => {
        const seenNames = new Set<string>();
        fields.forEach((field, index) => {
            const normalizedName = field.name.toLowerCase();
            if (seenNames.has(normalizedName)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [index, 'name'],
                    message: 'Field names must be unique within a content type',
                });
            }
            seenNames.add(normalizedName);
        });
    }),
});

export const updateContentTypeSchema = createContentTypeSchema.extend({
    fieldChange: z.object({
        fromName: z.string().trim().min(1),
        toName: z.string().trim().min(1),
        fromType: fieldTypeSchema,
        toType: fieldTypeSchema,
        uniqueChange: z.boolean().optional(),
        confirmed: z.boolean().optional(),
        deleteDuplicatesConfirmed: z.boolean().optional(),
        defaultValue: z.unknown().optional(),
    }).refine((change) =>
        change.fromName !== change.toName || change.fromType !== change.toType || change.uniqueChange === true,
    {
        message: 'A field change must rename the field, change its type, or change its unique setting',
    }).optional(),
});
