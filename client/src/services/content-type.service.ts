import axios from 'axios';
import type { ContentType, ContentTypeField } from '../types/content-type';
import type { ContentEntry, EntryListResponse } from '../types/content-entry';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function notifyContentTypesChanged() {
  window.dispatchEvent(new Event('content-types-changed'));
}

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

  notifyContentTypesChanged();
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

  notifyContentTypesChanged();
  return response.data;
}

export async function deleteContentType(id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/content-types/${id}`, {
    headers: authHeaders(),
  });
  notifyContentTypesChanged();
}

export async function fetchEntries(
  contentTypeId: number,
  params: { page: number; pageSize: number; sortBy: string; sortOrder: 'asc' | 'desc'; search?: string },
): Promise<EntryListResponse> {
  const response = await axios.get<EntryListResponse>(
    `${API_BASE_URL}/content-types/${contentTypeId}/entries`,
    { headers: authHeaders(), params },
  );
  return response.data;
}

export async function fetchEntry(contentTypeId: number, entryId: number): Promise<ContentEntry> {
  const response = await axios.get<ContentEntry>(
    `${API_BASE_URL}/content-types/${contentTypeId}/entries/${entryId}`,
    { headers: authHeaders() },
  );
  return response.data;
}

export async function createEntry(
  contentTypeId: number,
  data: Record<string, unknown>,
): Promise<ContentEntry> {
  const response = await axios.post<ContentEntry>(
    `${API_BASE_URL}/content-types/${contentTypeId}/entries`,
    { data },
    { headers: authHeaders() },
  );
  return response.data;
}

export async function updateEntry(
  contentTypeId: number,
  entryId: number,
  data: Record<string, unknown>,
): Promise<ContentEntry> {
  const response = await axios.put<ContentEntry>(
    `${API_BASE_URL}/content-types/${contentTypeId}/entries/${entryId}`,
    { data },
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deleteEntry(contentTypeId: number, entryId: number): Promise<void> {
  await axios.delete(
    `${API_BASE_URL}/content-types/${contentTypeId}/entries/${entryId}`,
    { headers: authHeaders() },
  );
}
