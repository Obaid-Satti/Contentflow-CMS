import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    createCloudinaryUploadSignature,
    deleteCloudinaryAsset,
    getCloudinaryAsset,
    getCloudinaryMimeType,
    getExpectedMediaType,
    MAX_MEDIA_SIZE_BYTES,
    parseCloudinaryAssetUrl,
} from '../services/cloudinary.service.js';
import {
    createMedia,
    deleteMediaById,
    getMediaById,
    listMedia,
    updateMediaAltText,
} from '../models/media.model.js';

function parseMediaId(value: string | string[] | undefined): number | null {
    if (typeof value !== 'string') return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getPublicMediaUrl(req: Request, media: { stored_path: string }): string {
    if (/^https?:\/\//i.test(media.stored_path)) return media.stored_path;
    const normalizedPath = media.stored_path.replaceAll('\\', '/');
    const host = req.get('host');
    return host
        ? `${req.protocol}://${host}/${normalizedPath}`
        : `/${normalizedPath}`;
}

const mediaAltTextSchema = z.object({
    alt_text: z.string().trim().max(1000, 'Alt text must be 1000 characters or fewer.'),
}).strict();

export async function listMediaController(req: Request, res: Response) {
    try {
        const media = await listMedia();
        return res.json({
            media: media.map((item) => ({
                ...item,
                url: getPublicMediaUrl(req, item),
            })),
        });
    } catch (error) {
        console.error('LIST MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Failed to list media files.' });
    }
}

const uploadSignatureSchema = z.object({
    file_name: z.string().trim().min(1).max(255),
    mime: z.string().trim().min(1),
    size_bytes: z.number().int().positive().max(MAX_MEDIA_SIZE_BYTES),
}).strict();

export function createMediaUploadSignatureController(req: Request, res: Response) {
    if (typeof req.body?.size_bytes === 'number' && req.body.size_bytes > MAX_MEDIA_SIZE_BYTES) {
        return res.status(413).json({ message: 'File exceeds the 5 MB upload limit.' });
    }

    const parsed = uploadSignatureSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues[0]?.message ?? 'Choose a supported file up to 5 MB.',
        });
    }

    try {
        if (!getExpectedMediaType(parsed.data.file_name) ||
            getExpectedMediaType(parsed.data.file_name)?.mime !== parsed.data.mime.toLowerCase()) {
            return res.status(400).json({ message: 'Unsupported file type. Allowed types: JPG, PNG, WebP, GIF, PDF.' });
        }
        return res.json(createCloudinaryUploadSignature(parsed.data.file_name, parsed.data.mime));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not prepare the upload.';
        const isConfigurationError = message.startsWith('Cloudinary is not configured');
        return res.status(isConfigurationError ? 503 : 400).json({ message });
    }
}

const cloudinaryUploadSchema = z.object({
    file_name: z.string().trim().min(1).max(255),
    secure_url: z.string().url(),
}).strict();

export async function registerCloudinaryMediaController(req: Request, res: Response) {
    const parsed = cloudinaryUploadSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid uploaded media.' });
    }

    const { file_name, secure_url } = parsed.data;
    const normalizedName = file_name.replaceAll('\\', '/').split('/').pop() ?? '';
    const identity = parseCloudinaryAssetUrl(secure_url);
    if (!identity) return res.status(400).json({ message: 'Invalid Cloudinary file URL.' });

    try {
        const asset = await getCloudinaryAsset(identity.publicId, identity.resourceType);
        const mime = getCloudinaryMimeType(String(asset.format ?? ''), String(asset.resource_type ?? ''));
        const sizeBytes = Number(asset.bytes);
        const expectedType = getExpectedMediaType(normalizedName);
        if (!mime || !expectedType || expectedType.mime !== mime || expectedType.resourceType !== identity.resourceType ||
            asset.resource_type !== identity.resourceType || asset.secure_url !== secure_url ||
            !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_MEDIA_SIZE_BYTES) {
            await deleteCloudinaryAsset(identity.publicId, identity.resourceType).catch(() => undefined);
            return res.status(sizeBytes > MAX_MEDIA_SIZE_BYTES ? 413 : 400).json({
                message: sizeBytes > MAX_MEDIA_SIZE_BYTES
                    ? 'File exceeds the 5 MB upload limit.'
                    : 'The uploaded file type is not supported.',
            });
        }

        const media = await createMedia({
            file_name: normalizedName,
            stored_path: secure_url,
            mime,
            size_bytes: sizeBytes,
            alt_text: '',
        });
        return res.status(201).json({ ...media, url: media.stored_path });
    } catch (error) {
        await deleteCloudinaryAsset(identity.publicId, identity.resourceType).catch(() => undefined);
        console.error('REGISTER CLOUDINARY MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Could not finish saving the uploaded file.' });
    }
}

export async function updateMediaAltTextController(req: Request, res: Response) {
    const id = parseMediaId(req.params.mediaId);
    if (id === null) return res.status(400).json({ message: 'Invalid media ID.' });

    const parsed = mediaAltTextSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: parsed.error.issues[0]?.message ?? 'Invalid alt text.',
        });
    }

    try {
        const media = await getMediaById(id);
        if (!media) return res.status(404).json({ message: 'Media file not found.' });
        if (!media.mime.startsWith('image/')) {
            return res.status(400).json({ message: 'Alt text can only be set for images.' });
        }

        const updated = await updateMediaAltText(id, parsed.data.alt_text);
        if (!updated) return res.status(404).json({ message: 'Media file not found.' });

        return res.json({
            ...updated,
            url: getPublicMediaUrl(req, updated),
        });
    } catch (error) {
        console.error('UPDATE MEDIA ALT TEXT ERROR:', error);
        return res.status(500).json({ message: 'Failed to update image alt text.' });
    }
}

export async function deleteMediaController(req: Request, res: Response) {
    const id = parseMediaId(req.params.mediaId);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid media ID.' });
    }

    try {
        const media = await getMediaById(id);
        if (!media) return res.status(404).json({ message: 'Media file not found.' });

        const identity = parseCloudinaryAssetUrl(media.stored_path);
        if (identity) {
            const cloudDelete = await deleteCloudinaryAsset(identity.publicId, identity.resourceType);
            if (cloudDelete.result !== 'ok' && cloudDelete.result !== 'not found') {
                return res.status(502).json({ message: 'Cloudinary could not delete this file.' });
            }
            const deleted = await deleteMediaById(id);
            if (!deleted) return res.status(404).json({ message: 'Media file not found.' });
            return res.json({ message: 'Media file deleted.', id });
        }

        const deleted = await deleteMediaById(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Media file not found.' });
        }
        return res.json({ message: 'Media file deleted.', id });
    } catch (error) {
        console.error('DELETE MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Failed to delete media file.' });
    }
}
