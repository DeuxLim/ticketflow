import { clearAuthToken, getAuthToken } from '@/lib/auth-session';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
export { API_BASE_URL };

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  payload: Record<string, unknown> | null;

  constructor(message: string, status: number, payload: Record<string, unknown> | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.fieldErrors = (payload?.errors as Record<string, string[]> | undefined) ?? {};
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...baseHeaders,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed.' })) as Record<string, unknown>;
    if (response.status === 401) {
      clearAuthToken();
    }
    throw new ApiError((payload.message as string | undefined) ?? 'Request failed.', response.status, payload);
  }

  return (await response.json()) as T;
}

export async function apiDownload(path: string, filename?: string): Promise<void> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Download failed.' }));
    throw new ApiError(payload.message ?? 'Download failed.', response.status);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
