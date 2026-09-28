
import api from './api';

export interface ApiTokenSummary {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

interface CreatedApiToken extends ApiTokenSummary {
  token: string;
}

function authHeaders() {
  const token = localStorage.getItem('contentflow_token');

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function fetchApiTokens(): Promise<ApiTokenSummary[]> {
  const response = await api.get<{ tokens: ApiTokenSummary[] }>(
    '/api-tokens',
    {
      headers: authHeaders(),
    },
  );

  return response.data.tokens;
}

export async function createApiToken(
  name: string,
): Promise<CreatedApiToken> {
  const response = await api.post<CreatedApiToken>(
    '/api-tokens',
    { name },
    {
      headers: authHeaders(),
    },
  );

  return response.data;
}

export async function deleteApiToken(
  id: number,
): Promise<void> {
  await api.delete(`/api-tokens/${id}`, {
    headers: authHeaders(),
  });
}