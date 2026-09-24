import axios from 'axios';
import type { ContentType, ContentTypeField } from '../types/content-type';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('contentflow_token');

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function fetchContentTypes(): Promise<ContentType[]> {
  const response = await axios.get<ContentType[]>(
    `${API_BASE_URL}/content-types`,
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function createContentType(
  name: string,
  apiId: string,
  fields: ContentTypeField[] = [],
): Promise<ContentType> {
  const response = await axios.post<ContentType>(
    `${API_BASE_URL}/content-types`,
    {
      name,
      apiId,
      fields,
    },
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function updateContentType(
  id: number,
  name: string,
  apiId: string,
  fields: ContentTypeField[],
): Promise<ContentType> {
  const response = await axios.put<ContentType>(
    `${API_BASE_URL}/content-types/${id}`,
    {
      name,
      apiId,
      fields,
    },
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function deleteContentType(id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/content-types/${id}`, {
    headers: authHeaders(),
  });
}
