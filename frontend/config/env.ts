/**
 * Centralized environment configuration for the client.
 * Only `NEXT_PUBLIC_*` variables are readable in the browser, so any
 * value the client needs must be exposed with that prefix at build time.
 */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1",
  appEnv: process.env.NODE_ENV ?? "development",
} as const;
