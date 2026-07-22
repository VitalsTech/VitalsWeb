/**
 * Minimal JWT payload decoder (no signature verification — this runs in the
 * browser purely to read non-sensitive claims like `sub`/`publicId` that the
 * gateway embeds in the access token; the token itself is always validated
 * server-side).
 */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
