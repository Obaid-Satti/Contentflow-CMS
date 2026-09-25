import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<MediaAsset>(
    `${API_BASE_URL}/media`,
    formData,
    { headers: authHeaders() },
  );
  return response.data;
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
