import axios from 'axios';
import type { ContentType } from '../types/content-type';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('contentflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchContentTypes(): Promise<ContentType[]> {
  const response = await axios.get<ContentType[]>(`${API_BASE_URL}/content-types`, {
    headers: authHeaders(),
  });
  return response.data;
}
