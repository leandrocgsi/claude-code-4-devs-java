import { PageResponse } from '@/app/core/models/pagination';

export interface HalPage<T> {
  _embedded?: Record<string, T[]>;
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export function toPageResponse<T, R>(halPage: HalPage<T>, mapItem: (item: T) => R): PageResponse<R> {
  const embedded = halPage._embedded ? (Object.values(halPage._embedded)[0] ?? []) : [];
  const content = embedded.map(mapItem);
  const page = halPage.page ?? {
    size: content.length,
    number: 0,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
  };

  return {
    content,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    size: page.size,
    number: page.number,
    first: page.number === 0,
    last: page.number >= page.totalPages - 1,
    empty: content.length === 0,
  };
}
