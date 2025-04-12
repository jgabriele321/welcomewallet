/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_PRIVY_VERIFICATION_KEY: string;
  readonly VITE_BASE_RPC_URL: string;
  readonly VITE_GROK_API_KEY: string;
  readonly VITE_GROK_API_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}