import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);
const VIDEO_EXTENSIONS = new Set(['.3gp', '.avi', '.flv', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.webm', '.wmv']);
const ALLOWED_TYPES_MESSAGE = 'JPG, PNG, WebP, GIF, and PDF';

export interface MediaAsset {
  id: number;
  file_name: string;
  stored_path: string;
  mime: string;
  size_bytes: number | string;
  alt_text: string;
  created_at: string;
  url: string;
}

export function validateMediaUpload(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (file.type.toLowerCase().startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) {
    return 'Video files aren’t supported.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Files must be 5 MB or smaller.';
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return `This file type isn’t supported. Allowed types: ${ALLOWED_TYPES_MESSAGE}.`;
  }

  return null;
}

export function getMediaFileUrl(reference: string): string | null {
  if (/^https?:\/\//i.test(reference)) return reference;

  const normalizedPath = reference.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalizedPath.startsWith('uploads/')) return null;

  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  return new URL(`/${normalizedPath}`, apiUrl.origin).toString();
}

function authHeaders() {
  const token = localStorage.getItem('contentflow_token');

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function fetchMedia(): Promise<MediaAsset[]> {
  const response = await axios.get<{ media: MediaAsset[] }>(
    `${API_BASE_URL}/media`,
    { headers: authHeaders() },
  );
  return response.data.media;
}

export async function uploadMedia(file: File): Promise<MediaAsset> {
  const signatureResponse = await axios.post<{
    cloud_name: string;
    api_key: string;
    timestamp: number;
    public_id: string;
    allowed_formats: string;
    signature: string;
    resource_type: 'image' | 'raw';
  }>(`${API_BASE_URL}/media/upload-signature`, {
    file_name: file.name,
    mime: file.type,
    size_bytes: file.size,
  }, { headers: authHeaders() });
  const signedUpload = signatureResponse.data;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signedUpload.api_key);
  formData.append('timestamp', String(signedUpload.timestamp));
  formData.append('public_id', signedUpload.public_id);
  formData.append('allowed_formats', signedUpload.allowed_formats);
  formData.append('signature', signedUpload.signature);

  let cloudinaryResponse: { secure_url: string };
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signedUpload.cloud_name)}/${signedUpload.resource_type}/upload`,
      { method: 'POST', body: formData },
    );
    const responseBody = await response.json() as typeof cloudinaryResponse & { error?: { message?: string } };
    if (!response.ok) {
      throw new Error(responseBody.error?.message ?? 'Cloudinary could not upload this file. Please try again.');
    }
    cloudinaryResponse = responseBody;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Cloudinary could not upload this file. Please try again.',
      { cause: error },
    );
  }

  const registeredResponse = await axios.post<MediaAsset>(
    `${API_BASE_URL}/media/register-upload`,
    { file_name: file.name, secure_url: cloudinaryResponse.secure_url },
    { headers: authHeaders() },
  );
  return registeredResponse.data;
}

export async function updateMediaAltText(id: number, altText: string): Promise<MediaAsset> {
  const response = await axios.patch<MediaAsset>(
    `${API_BASE_URL}/media/${id}/alt-text`,
    { alt_text: altText },
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deleteMedia(id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/media/${id}`, {
    headers: authHeaders(),
  });
}
