import type { Request, Response } from 'express';

import {
    createContentType,
    getContentTypes,
    getContentTypeById,
    updateContentType,
    deleteContentType,
} from '../models/content-type.model.js';

import {
    createContentTypeSchema,
    updateContentTypeSchema,
} from '../schemas/content-type.schema.js';

function getContentTypeFields(fields: unknown): Array<{ name: string; type: string }> {
    let parsedFields = fields;
    if (typeof parsedFields === 'string') {
        try {
            parsedFields = JSON.parse(parsedFields) as unknown;
        } catch {
            return [];
        }
    }

    if (!Array.isArray(parsedFields)) return [];
    return parsedFields.filter(
        (field): field is { name: string; type: string } =>
            typeof field === 'object' && field !== null &&
            'name' in field && typeof field.name === 'string' &&
            'type' in field && typeof field.type === 'string',
    );
}

export async function createContentTypeController(
    req: Request,
    res: Response,
) {
    try {
        const result = createContentTypeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: result.error.flatten(),
            });
        }

        const { name, apiId, fields } = result.data;

        const contentType = await createContentType(
            name,
            apiId,
            fields,
        );

        return res.status(201).json(contentType);
    } catch (error) {
        console.error('CREATE CONTENT TYPE ERROR:', error);

        if (
            error instanceof Error &&
            'code' in error &&
            error.code === '23505'
        ) {
            return res.status(409).json({
                message: 'A content type with this API ID already exists',
            });
        }

        return res.status(500).json({
            message: 'Failed to create content type',
            error: error instanceof Error ? error.message : error,
        });
    }
}

export async function getContentTypesController(
    _req: Request,
    res: Response,
) {
    try {
        const contentTypes = await getContentTypes();

        return res.json(contentTypes);
    } catch (error) {
        console.error(error);

        return res
            .status(500)
            .json({ message: 'Failed to get content types' });
    }
}

export async function getContentTypeByIdController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        const contentType = await getContentTypeById(id);

        if (!contentType) {
            return res
                .status(404)
                .json({ message: 'Content type not found' });
        }

        return res.json(contentType);
    } catch (error) {
        console.error(error);

        return res
            .status(500)
            .json({ message: 'Failed to get content type' });
    }
}

export async function updateContentTypeController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        const result = updateContentTypeSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: result.error.flatten(),
            });
        }

        const { name, apiId, fields, fieldChange } = result.data;

        if (fieldChange) {
            const currentContentType = await getContentTypeById(id);
            if (!currentContentType) {
                return res.status(404).json({ message: 'Content type not found' });
            }
            const currentFields = getContentTypeFields(currentContentType.fields);
            if (!currentFields.some((field) =>
                field.name === fieldChange.fromName && field.type === fieldChange.fromType,
            ) || !fields.some((field) =>
                field.name === fieldChange.toName && field.type === fieldChange.toType,
            )) {
                return res.status(400).json({
                    message: 'Field change must match the current and updated field definitions',
                });
            }
        }

        const contentType = await updateContentType(
            id,
            name,
            apiId,
            fields,
            fieldChange,
        );

        if (contentType && 'kind' in contentType) {
            if (contentType.kind === 'change_preview') {
                return res.status(409).json({
                    code: 'FIELD_CHANGE_CONFIRMATION_REQUIRED',
                    message: 'Review the existing entry values before applying this field change.',
                    totalCount: contentType.totalCount,
                    convertedCount: contentType.convertedCount,
                    invalidCount: contentType.invalidCount,
                    required: contentType.required,
                    duplicateDeleteCount: contentType.duplicateDeleteCount,
                });
            }
            if (contentType.kind === 'duplicate_delete_confirmation') {
                return res.status(409).json({
                    code: 'FIELD_CHANGE_DUPLICATE_DELETE_CONFIRMATION_REQUIRED',
                    message: 'This change will delete every entry that has a duplicate value.',
                    duplicateDeleteCount: contentType.duplicateDeleteCount,
                });
            }
            if (contentType.kind === 'default_required') {
                return res.status(409).json({
                    code: 'FIELD_TYPE_DEFAULT_REQUIRED',
                    message: 'Choose a default value for entries that cannot be converted.',
                    invalidCount: contentType.invalidCount,
                });
            }
            if (contentType.kind === 'invalid_default') {
                return res.status(400).json({
                    code: 'FIELD_TYPE_DEFAULT_INVALID',
                    message: 'The selected default value is invalid for this field type.',
                });
            }
            if (contentType.kind === 'unique_conflict') {
                return res.status(409).json({
                    code: 'FIELD_TYPE_UNIQUE_CONFLICT',
                    message: `${contentType.duplicateCount} converted value(s) would violate this field's unique setting. Correct the existing entries before changing the type.`,
                });
            }
            return res.status(400).json({
                message: 'Field change does not match the saved content type definition.',
            });
        }

        if (!contentType) {
            return res
                .status(404)
                .json({ message: 'Content type not found' });
        }

        return res.json(contentType);
    } catch (error) {
        console.error(error);

        if (
            error instanceof Error &&
            'code' in error &&
            error.code === '23505'
        ) {
            return res.status(409).json({
                message: 'A content type with this API ID already exists',
            });
        }

        return res
            .status(500)
            .json({ message: 'Failed to update content type' });
    }
}

export async function deleteContentTypeController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        const deletedRows = await deleteContentType(id);

        if (deletedRows === 0) {
            return res
                .status(404)
                .json({ message: 'Content type not found' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error(error);

        return res
            .status(500)
            .json({ message: 'Failed to delete content type' });
    }
}
