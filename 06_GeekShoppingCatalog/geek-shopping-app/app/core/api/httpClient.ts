import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public fields?: FieldErrors,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  message?: string;
  detail?: string;
  errors?: FieldErrors;
}

async function requestInterceptor(config: InternalAxiosRequestConfig) {
  return config;
}

function errorResponseInterceptor(error: unknown) {
  if (axios.isCancel(error)) return Promise.reject(error);
  const axiosError = error as AxiosError<ErrorBody>;
  if (!axiosError.response) return Promise.reject(new ApiError('Could not connect to the server.', 0));
  const { status, data } = axiosError.response;
  const body = typeof data === 'object' && data !== null ? data : undefined;
  const message = body?.message ?? body?.detail ?? 'Unexpected server error.';
  return Promise.reject(new ApiError(message, status, body?.errors));
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
});

api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use((response) => response, errorResponseInterceptor);
