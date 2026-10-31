import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  ApiFieldError,
  PaginationMeta,
} from "@/types/api";
import { clearSession, getToken } from "@/lib/session";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

/**
 * Typed error thrown by the API layer. Exposes the backend message, any Zod
 * field errors, and the HTTP status so callers (toasts, form error mapping)
 * can react consistently.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(message: string, status: number, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject the bearer token from the session store on every request.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
  }
  return config;
});

function toApiError(error: unknown): ApiRequestError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorEnvelope>;
    const status = axiosError.response?.status ?? 0;
    const body = axiosError.response?.data;
    const message =
      body?.message ??
      axiosError.message ??
      "Terjadi kesalahan jaringan tak terduga";
    return new ApiRequestError(message, status, body?.errors ?? []);
  }
  if (error instanceof ApiRequestError) {
    return error;
  }
  return new ApiRequestError(
    error instanceof Error ? error.message : "Terjadi kesalahan tak terduga",
    0
  );
}

// Unwrap the envelope on success; throw a typed error otherwise. A 401 clears
// the session so the app can redirect to /login.
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiEnvelope<unknown> | ApiErrorEnvelope;
    if (body && typeof body === "object" && body.success === false) {
      throw new ApiRequestError(
        body.message,
        response.status,
        (body as ApiErrorEnvelope).errors ?? []
      );
    }
    return response;
  },
  (error) => {
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      clearSession();
    }
    return Promise.reject(apiError);
  }
);

/**
 * Perform a request and return the unwrapped `data` payload from the envelope.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  return response.data.data as T;
}

/**
 * Perform a request and return both `data` and `pagination` for list endpoints.
 */
export async function requestPaginated<T>(
  config: AxiosRequestConfig
): Promise<{ data: T; pagination?: PaginationMeta }> {
  const response = await apiClient.request<ApiEnvelope<T>>(config);
  return {
    data: response.data.data as T,
    pagination: response.data.pagination,
  };
}

/**
 * Fetch a binary payload (e.g. an invoice PDF) with the auth header attached.
 * Errors still unwrap to ApiRequestError via the shared helper.
 */
export async function requestBlob(config: AxiosRequestConfig): Promise<Blob> {
  try {
    const token = getToken();
    const response = await axios.request<Blob>({
      baseURL: API_BASE_URL,
      responseType: "blob",
      ...config,
      headers: {
        ...(config.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      clearSession();
    }
    throw apiError;
  }
}
