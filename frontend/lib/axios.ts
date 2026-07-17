import axios from "axios";
import { env } from "@/config/env";

/**
 * Shared Axios instance used by all service modules.
 * Centralizing base URL, headers, and interceptors here means
 * individual services stay focused on their own domain logic.
 */
const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Unexpected network error";
    return Promise.reject(new Error(message));
  }
);

export default httpClient;
