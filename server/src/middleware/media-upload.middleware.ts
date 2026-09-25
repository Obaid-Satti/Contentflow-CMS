import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer, { type FileFilterCallback } from 'multer';
import type { NextFunction, Request, Response } from 'express';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = ['JPG', 'PNG', 'WebP', 'GIF', 'PDF'] as const;
export const ALLOWED_MEDIA_TYPES_MESSAGE = ALLOWED_MEDIA_TYPES.join(', ');

const uploadDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../uploads',
);

const supportedFiles: Record<string, { mime: string; extension: string }> = {
    '.jpg': { mime: 'image/jpeg', extension: '.jpg' },
    '.jpeg': { mime: 'image/jpeg', extension: '.jpg' },
    '.png': { mime: 'image/png', extension: '.png' },
    '.webp': { mime: 'image/webp', extension: '.webp' },
    '.gif': { mime: 'image/gif', extension: '.gif' },
    '.pdf': { mime: 'application/pdf', extension: '.pdf' },
};

export class UnsupportedMediaTypeError extends Error {
    constructor() {
        super(`Unsupported file type. Allowed types: ${ALLOWED_MEDIA_TYPES_MESSAGE}.`);
        this.name = 'UnsupportedMediaTypeError';
    }
}

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        try {
            mkdirSync(uploadDirectory, { recursive: true });
            callback(null, uploadDirectory);
        } catch (error) {
            callback(error as Error, uploadDirectory);
        }
    },
    filename: (_req, file, callback) => {
        const extension = supportedFiles[path.extname(file.originalname).toLowerCase()]?.extension;
        callback(null, `${randomUUID()}${extension ?? ''}`);
    },
});

const multerUpload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (_req, file, callback: FileFilterCallback) => {
        const supported = supportedFiles[path.extname(file.originalname).toLowerCase()];
        if (!supported || file.mimetype.toLowerCase() !== supported.mime) {
            callback(new UnsupportedMediaTypeError());
            return;
        }
        callback(null, true);
    },
});

export function mediaUploadMiddleware(req: Request, res: Response, next: NextFunction) {
    multerUpload.single('file')(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ message: 'File exceeds the 5 MB upload limit.' });
            return;
        }

        if (error instanceof UnsupportedMediaTypeError) {
            res.status(400).json({ message: error.message });
            return;
        }

        if (error instanceof multer.MulterError) {
            res.status(400).json({ message: error.message });
            return;
        }

        next(error);
    });
}

export function getUploadDirectory() {
    return uploadDirectory;
}
