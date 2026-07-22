/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the Vitals API Gateway, e.g. `https://api.vitals.example`.
   * Leave empty to use same-origin relative requests (`/api/v1/...`), e.g.
   * when the app is served behind a reverse proxy that forwards `/api` to
   * the gateway.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
