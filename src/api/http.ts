import {
  clearSession,
  extractSession,
  getAccessToken,
  getDeviceFingerprint,
  getRefreshToken,
  setSession,
} from './tokenStore';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** Gateway origin for REST and SignalR. Empty string means same-origin relative URLs. */
export function getApiBaseUrl(): string {
  return BASE_URL;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  query?: QueryParams;
  skipAuth?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const first = obj.errors[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && typeof (first as Record<string, unknown>).message === 'string') {
        return (first as Record<string, unknown>).message as string;
      }
    }
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
    if (typeof obj.title === 'string' && obj.title.trim()) return obj.title;
  }
  return fallback || 'Не удалось выполнить операцию';
}

/** User-facing API error text (Russian when gateway provides it). */
export function formatApiError(error: unknown, fallback = 'Не удалось выполнить операцию'): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, skipAuth } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? safeJsonParse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, extractErrorMessage(data, response.statusText), data);
  }

  return data as T;
}

let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = rawRequest<unknown>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken, deviceFingerprint: getDeviceFingerprint() },
      skipAuth: true,
    })
      .then((data) => {
        const session = extractSession(data);
        if (!session) {
          clearSession();
          return null;
        }
        setSession(session);
        return session.accessToken;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * Performs an authenticated API request against the Vitals API Gateway.
 * On a 401 it transparently attempts a single token refresh + retry before
 * giving up (and clearing the session, forcing a re-login).
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !options.skipAuth) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return rawRequest<T>(path, options);
      }
    }
    throw error;
  }
}
