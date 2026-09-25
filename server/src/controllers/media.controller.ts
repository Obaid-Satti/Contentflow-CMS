import { readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    createMedia,
    deleteMediaById,
    getMediaById,
    listMedia,
    updateMediaAltText,
} from '../models/media.model.js';
import {
    ALLOWED_MEDIA_TYPES_MESSAGE,
    getUploadDirectory,
} from '../middleware/media-upload.middleware.js';

function parseMediaId(value: string | string[] | undefined): number | null {
    if (typeof value !== 'string') return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getPublicMediaUrl(req: Request, storedPath: string): string {
    const normalizedPath = storedPath.replaceAll('\\', '/');
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
                url: getPublicMediaUrl(req, item.stored_path),
            })),
        });
    } catch (error) {
        console.error('LIST MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Failed to list media files.' });
    }
}

function matchesFileSignature(mime: string, bytes: Buffer): boolean {
    switch (mime) {
        case 'image/jpeg':
            return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        case 'image/png':
            return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        case 'image/webp':
            return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' &&
                bytes.toString('ascii', 8, 12) === 'WEBP';
        case 'image/gif':
            return ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6));
        case 'application/pdf':
            return bytes.toString('ascii', 0, 5) === '%PDF-';
        default:
            return false;
    }
}

function getSafeOriginalFileName(originalName: string): string {
    const normalized = originalName.replaceAll('\\', '/');
    return normalized.split('/').pop() || 'upload';
}

export async function uploadMediaController(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({ message: 'Choose a file to upload.' });
    }

    try {
        const fileBytes = await readFile(req.file.path);
        if (!matchesFileSignature(req.file.mimetype, fileBytes)) {
            await unlink(req.file.path).catch(() => undefined);
            return res.status(400).json({
                message: `Unsupported file type. Allowed types: ${ALLOWED_MEDIA_TYPES_MESSAGE}.`,
            });
        }

        const media = await createMedia({
            file_name: getSafeOriginalFileName(req.file.originalname),
            stored_path: path.posix.join('uploads', req.file.filename),
            mime: req.file.mimetype,
            size_bytes: req.file.size,
            alt_text: '',
        });

        return res.status(201).json({
            ...media,
            url: getPublicMediaUrl(req, media.stored_path),
        });
    } catch (error) {
        await unlink(req.file.path).catch(() => undefined);
        console.error('UPLOAD MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Failed to save uploaded file details.' });
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
            url: getPublicMediaUrl(req, updated.stored_path),
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

        const normalizedStoredPath = media.stored_path.replaceAll('\\', '/');
        const fileName = path.posix.basename(normalizedStoredPath);
        if (normalizedStoredPath !== `uploads/${fileName}` || fileName === '.' || fileName === '/') {
            console.error('DELETE MEDIA ERROR: Invalid stored media path.', { id });
            return res.status(500).json({ message: 'Media file has an invalid storage path.' });
        }

        const uploadDirectory = getUploadDirectory();
        const filePath = path.resolve(uploadDirectory, fileName);
        if (path.dirname(filePath) !== uploadDirectory) {
            return res.status(500).json({ message: 'Media file has an invalid storage path.' });
        }

        const stagedPath = path.join(uploadDirectory, `.${fileName}.deleting-${randomUUID()}`);
        let fileWasStaged = false;
        try {
            await rename(filePath, stagedPath);
            fileWasStaged = true;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }

        let deleted: Awaited<ReturnType<typeof deleteMediaById>>;
        try {
            deleted = await deleteMediaById(id);
        } catch (error) {
            if (fileWasStaged) await rename(stagedPath, filePath).catch(() => undefined);
            throw error;
        }

        if (!deleted) {
            if (fileWasStaged) await rename(stagedPath, filePath).catch(() => undefined);
            return res.status(404).json({ message: 'Media file not found.' });
        }

        if (fileWasStaged) {
            await unlink(stagedPath).catch((error: NodeJS.ErrnoException) => {
                console.error('DELETE MEDIA FILE CLEANUP ERROR:', error);
            });
        }

        return res.json({ message: 'Media file deleted.', id });
    } catch (error) {
        console.error('DELETE MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Failed to delete media file.' });
    }
}
