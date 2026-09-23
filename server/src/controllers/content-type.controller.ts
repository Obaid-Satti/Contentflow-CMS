import type { Request, Response } from 'express';

import {
    createContentType,
    getContentTypes,
    getContentTypeById,
    updateContentType,
    deleteContentType,
} from '../models/content-type.model.js';

export async function createContentTypeController(
    req: Request,
    res: Response,
) {
    try {
        const { name, apiId, fields } = req.body;

        const contentType = await createContentType(
            name,
            apiId,
            fields,
        );

        return res.status(201).json(contentType);
    } catch (error) {
        console.error("CREATE CONTENT TYPE ERROR:", error);

        return res.status(500).json({
            message: "Failed to create content type",
            error: error instanceof Error ? error.message : error
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
        const { name, apiId, fields } = req.body;

        const contentType = await updateContentType(
            id,
            name,
            apiId,
            fields,
        );

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