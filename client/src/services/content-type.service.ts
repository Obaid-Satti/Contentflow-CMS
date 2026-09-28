import type {
  ContentType,
  ContentTypeField,
} from '../types/content-type';

import type {
  ContentEntry,
  EntryListResponse,
} from '../types/content-entry';

import api from './api';

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
  const response = await api.get<ContentType[]>(
    '/content-types',
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
  const response = await api.post<ContentType>(
    '/content-types',
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
  fieldChange?: {
    fromName: string;
    toName: string;
    fromType: ContentTypeField['type'];
    toType: ContentTypeField['type'];
    uniqueChange?: boolean;
    confirmed?: boolean;
    deleteDuplicatesConfirmed?: boolean;
    defaultValue?: unknown;
  },
): Promise<ContentType> {
  const response = await api.put<ContentType>(
    `/content-types/${id}`,
    {
      name,
      apiId,
      fields,
      ...(fieldChange ? { fieldChange } : {}),
    },
    {
      headers: authHeaders(),
    },
  );

  notifyContentTypesChanged();

  return response.data;
}

export async function deleteContentType(
  id: number,
): Promise<void> {
  await api.delete(`/content-types/${id}`, {
    headers: authHeaders(),
  });

  notifyContentTypesChanged();
}

export async function fetchEntries(
  contentTypeId: number,
  params: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search?: string;
  },
): Promise<EntryListResponse> {
  const response = await api.get<EntryListResponse>(
    `/content-types/${contentTypeId}/entries`,
    {
      headers: authHeaders(),
      params,
    },
  );

  return response.data;
}

export async function fetchEntry(
  contentTypeId: number,
  entryId: number,
): Promise<ContentEntry> {
  const response = await api.get<ContentEntry>(
    `/content-types/${contentTypeId}/entries/${entryId}`,
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function createEntry(
  contentTypeId: number,
  data: Record<string, unknown>,
): Promise<ContentEntry> {
  const response = await api.post<ContentEntry>(
    `/content-types/${contentTypeId}/entries`,
    { data },
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function updateEntry(
  contentTypeId: number,
  entryId: number,
  data: Record<string, unknown>,
): Promise<ContentEntry> {
  const response = await api.put<ContentEntry>(
    `/content-types/${contentTypeId}/entries/${entryId}`,
    { data },
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function deleteEntry(
  contentTypeId: number,
  entryId: number,
): Promise<void> {
  await api.delete(
    `/content-types/${contentTypeId}/entries/${entryId}`,
    {
      headers: authHeaders(),
    },
  );
}