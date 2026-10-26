export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG, WebP or GIF image.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'The image must be at most 5 MB.';
  return null;
}
