/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Toggles the in-memory mock backend. Defaults to on; set to 'false' to hit the real API. */
  readonly VITE_USE_MOCK_BACKEND?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
