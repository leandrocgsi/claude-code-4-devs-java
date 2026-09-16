import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function requestInterceptor(config: InternalAxiosRequestConfig) {
  return config;
}

function errorResponseInterceptor(error: unknown) {
  if (axios.isCancel(error)) return Promise.reject(error);
  const axiosError = error as AxiosError<{ message?: string }>;
  if (!axiosError.response) return Promise.reject(new ApiError('Could not connect to the server.', 0));
  const { status, data } = axiosError.response;
  return Promise.reject(new ApiError((typeof data === 'object' && data?.message) || 'Unexpected server error.', status));
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use((response) => response, errorResponseInterceptor);
