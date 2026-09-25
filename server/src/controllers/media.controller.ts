import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { createMedia } from '../models/media.model.js';
import { ALLOWED_MEDIA_TYPES_MESSAGE } from '../middleware/media-upload.middleware.js';

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

        return res.status(201).json(media);
    } catch (error) {
        await unlink(req.file.path).catch(() => undefined);
        console.error('UPLOAD MEDIA ERROR:', error);
        return res.status(500).json({ message: 'Failed to save uploaded file details.' });
    }
}
