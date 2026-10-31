import { ApiError } from '@/app/core/api/httpClient';

const FALLBACK_MESSAGE = 'Unexpected error.';

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessage = error.fields ? Object.values(error.fields)[0] : undefined;
    return fieldMessage ?? error.message;
  }
  return error instanceof Error ? error.message : FALLBACK_MESSAGE;
}
