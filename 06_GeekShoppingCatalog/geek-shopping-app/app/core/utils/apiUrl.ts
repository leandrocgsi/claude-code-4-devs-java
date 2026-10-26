const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export function toApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
