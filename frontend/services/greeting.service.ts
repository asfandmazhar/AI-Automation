import httpClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/api";
import type { ApiResponse, Greeting } from "@/types/greeting.types";

/**
 * Fetches the greeting message from the backend.
 * Services own all direct API interaction — components and hooks
 * should never call `httpClient` or `axios` directly.
 */
export const fetchGreeting = async (): Promise<Greeting> => {
  const { data } = await httpClient.get<ApiResponse<Greeting>>(API_ENDPOINTS.hello);
  return data.data;
};
