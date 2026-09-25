import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';

export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024;

const mediaTypesByExtension: Record<string, { mime: string; resourceType: 'image' | 'raw' }> = {
    '.jpg': { mime: 'image/jpeg', resourceType: 'image' },
    '.jpeg': { mime: 'image/jpeg', resourceType: 'image' },
    '.png': { mime: 'image/png', resourceType: 'image' },
    '.webp': { mime: 'image/webp', resourceType: 'image' },
    '.gif': { mime: 'image/gif', resourceType: 'image' },
    '.pdf': { mime: 'application/pdf', resourceType: 'raw' },
};

export const CLOUDINARY_ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'] as const;

export function getExpectedMediaType(fileName: string) {
    return mediaTypesByExtension[fileName.slice(fileName.lastIndexOf('.')).toLowerCase()] ?? null;
}

function getCloudinaryConfig() {
    if (!process.env.CLOUDINARY_URL) {
        throw new Error('Cloudinary is not configured. Set the CLOUDINARY_URL environment variable.');
    }
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
        throw new Error('CLOUDINARY_URL is missing required Cloudinary credentials.');
    }
    return config;
}

export function createCloudinaryUploadSignature(fileName: string, mime: string) {
    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    const supported = mediaTypesByExtension[extension];
    if (!supported || supported.mime !== mime.toLowerCase()) {
        throw new Error('Unsupported file type. Allowed types: JPG, PNG, WebP, GIF, PDF.');
    }

    const config = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `${randomUUID()}${supported.resourceType === 'raw' ? '.pdf' : ''}`;
    const allowedFormats = CLOUDINARY_ALLOWED_FORMATS.join(',');
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, public_id: publicId, allowed_formats: allowedFormats },
        config.api_secret as string,
    );

    return {
        cloud_name: config.cloud_name,
        api_key: config.api_key,
        timestamp,
        public_id: publicId,
        allowed_formats: allowedFormats,
        signature,
        resource_type: supported.resourceType,
    };
}

export function getCloudinaryMimeType(format: string, resourceType: string): string | null {
    const normalizedFormat = format.toLowerCase();
    if (resourceType === 'raw' && normalizedFormat === 'pdf') return 'application/pdf';
    const imageMimeByFormat: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    };
    return resourceType === 'image' ? imageMimeByFormat[normalizedFormat] ?? null : null;
}

export async function getCloudinaryAsset(publicId: string, resourceType: 'image' | 'raw') {
    getCloudinaryConfig();
    return cloudinary.api.resource(publicId, { resource_type: resourceType, type: 'upload' });
}

export async function deleteCloudinaryAsset(publicId: string, resourceType: 'image' | 'raw') {
    getCloudinaryConfig();
    return cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: 'upload',
        invalidate: true,
    });
}

export function parseCloudinaryAssetUrl(assetUrl: string): { publicId: string; resourceType: 'image' | 'raw' } | null {
    try {
        const url = new URL(assetUrl);
        if (url.hostname !== 'res.cloudinary.com') return null;
        const segments = url.pathname.split('/').filter(Boolean);
        const uploadIndex = segments.indexOf('upload');
        const resourceType = segments[uploadIndex - 1];
        if (uploadIndex < 1 || (resourceType !== 'image' && resourceType !== 'raw')) return null;

        const pathSegments = segments.slice(uploadIndex + 1);
        if (pathSegments[0] && /^v\d+$/.test(pathSegments[0])) pathSegments.shift();
        if (pathSegments.length === 0) return null;

        let publicId = pathSegments.join('/');
        if (resourceType === 'image') publicId = publicId.replace(/\.[a-z\d]+$/i, '');
        if (!/^[\da-f-]{36}(?:\.pdf)?$/i.test(publicId)) return null;
        return { publicId, resourceType };
    } catch {
        return null;
    }
}
