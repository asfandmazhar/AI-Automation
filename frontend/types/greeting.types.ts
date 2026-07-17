/**
 * Mirrors the backend's ApiResponse envelope
 * (see backend/src/utils/ApiResponse.js).
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface Greeting {
  message: string;
  source: "database" | "default";
}
