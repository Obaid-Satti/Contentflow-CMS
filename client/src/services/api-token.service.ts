import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApiTokens(): Promise<ApiTokenSummary[]> {
  const response = await axios.get<{ tokens: ApiTokenSummary[] }>(
    `${API_BASE_URL}/api-tokens`,
    { headers: authHeaders() },
  );
  return response.data.tokens;
}

export async function createApiToken(name: string): Promise<CreatedApiToken> {
  const response = await axios.post<CreatedApiToken>(
    `${API_BASE_URL}/api-tokens`,
    { name },
    { headers: authHeaders() },
  );
  return response.data;
}

export async function deleteApiToken(id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/api-tokens/${id}`, {
    headers: authHeaders(),
  });
}
