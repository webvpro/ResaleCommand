/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_APPWRITE_ENDPOINT: string;
  readonly PUBLIC_APPWRITE_PROJECT_ID: string;
  readonly PUBLIC_APPWRITE_DB_ID: string;
  readonly PUBLIC_APPWRITE_COLLECTION_ID: string;
  readonly PUBLIC_APPWRITE_BUCKET_ID: string;
  readonly GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
