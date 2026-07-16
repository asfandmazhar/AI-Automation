/**
 * Centralized API endpoint paths, relative to the configured base URL.
 * Keeps route strings out of service files so they're defined once.
 */
export const API_ENDPOINTS = {
  hello: "/hello",
} as const;
