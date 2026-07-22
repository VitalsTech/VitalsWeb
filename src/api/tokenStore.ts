import { decodeJwt } from './jwt';

const ACCESS_KEY = 'vitals.accessToken';
const REFRESH_KEY = 'vitals.refreshToken';
const PUBLIC_ID_KEY = 'vitals.publicId';
const PATIENT_ID_KEY = 'vitals.patientId';
const FINGERPRINT_KEY = 'vitals.deviceFingerprint';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeToSession(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getPublicId(): string | null {
  return localStorage.getItem(PUBLIC_ID_KEY);
}

export function getPatientId(): string | null {
  return localStorage.getItem(PATIENT_ID_KEY);
}

export function hasSession(): boolean {
  return Boolean(getAccessToken());
}

export type Session = {
  accessToken: string;
  refreshToken: string;
  publicId?: string;
  patientId?: string;
};

export function setSession(session: Session) {
  localStorage.setItem(ACCESS_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  if (session.publicId) localStorage.setItem(PUBLIC_ID_KEY, session.publicId);
  if (session.patientId) localStorage.setItem(PATIENT_ID_KEY, session.patientId);
  notify();
}

export function setPatientId(patientId: string) {
  localStorage.setItem(PATIENT_ID_KEY, patientId);
  notify();
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PUBLIC_ID_KEY);
  localStorage.removeItem(PATIENT_ID_KEY);
  notify();
}

export function getDeviceFingerprint(): string {
  let fingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (!fingerprint) {
    fingerprint = `web-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  }
  return fingerprint;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

/**
 * The API contract (contract.txt) only documents "200 OK" for
 * /auth/login, /auth/register and /auth/refresh — the response body shape
 * isn't specified. We defensively look for common field-name variants for
 * the token pair, and additionally decode the JWT access token payload
 * (the API uses a Bearer/JWT security scheme) to recover the user's public
 * id and patient profile id from standard-ish claim names, since JWTs are
 * self-describing and don't depend on the wrapper object's shape.
 */
export function extractSession(data: unknown): Session | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  const accessToken = pickString(obj, ['accessToken', 'access_token', 'token']);
  const refreshToken = pickString(obj, ['refreshToken', 'refresh_token']);
  if (!accessToken || !refreshToken) return null;

  const claims = decodeJwt<Record<string, unknown>>(accessToken) ?? {};
  const publicId =
    pickString(obj, ['publicId', 'userId', 'id']) ??
    pickString(claims, ['publicId', 'sub', 'userId', 'nameid', 'id']);
  const patientId =
    pickString(obj, ['patientId', 'profileId']) ??
    pickString(claims, ['patientId', 'profileId', 'pid']);

  return { accessToken, refreshToken, publicId, patientId };
}
