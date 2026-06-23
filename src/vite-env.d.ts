/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production API base URL (e.g. https://jarvis-api.onrender.com). Leave unset for local dev. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
