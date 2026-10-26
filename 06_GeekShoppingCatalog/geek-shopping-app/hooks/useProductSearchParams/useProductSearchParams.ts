'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SortDirection } from '@/app/core/models/pagination';
import { ProductSortField } from '@/app/core/models/product';

export const PAGE_SIZE_OPTIONS = [12, 24, 36];

export interface ProductSearch {
  page: number;
  size: number;
  direction: SortDirection;
  sortBy: ProductSortField;
  q: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  color: string;
  productSize: string;
}

const SORT_FIELDS: ProductSortField[] = ['name', 'price', 'createdAt', 'popularity', 'rating'];

const DEFAULTS: ProductSearch = {
  page: 0,
  size: 12,
  direction: 'desc',
  sortBy: 'createdAt',
  q: '',
  category: '',
  color: '',
  productSize: '',
};

interface ParamReader {
  get(name: string): string | null;
}

function toNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parse(params: ParamReader): ProductSearch {
  const page = toNumber(params.get('page'));
  const size = toNumber(params.get('size'));
  const direction = params.get('direction');
  const sortBy = params.get('sortBy') as ProductSortField | null;
  return {
    page: page !== undefined && Number.isInteger(page) && page >= 0 ? page : DEFAULTS.page,
    size: size !== undefined && PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULTS.size,
    direction: direction === 'asc' || direction === 'desc' ? direction : DEFAULTS.direction,
    sortBy: sortBy !== null && SORT_FIELDS.includes(sortBy) ? sortBy : DEFAULTS.sortBy,
    q: params.get('q') ?? DEFAULTS.q,
    category: params.get('category') ?? DEFAULTS.category,
    minPrice: toNumber(params.get('minPrice')),
    maxPrice: toNumber(params.get('maxPrice')),
    color: params.get('color') ?? DEFAULTS.color,
    productSize: params.get('productSize') ?? DEFAULTS.productSize,
  };
}

function serialize(search: ProductSearch): string {
  const params = new URLSearchParams();
  if (search.page !== DEFAULTS.page) params.set('page', String(search.page));
  if (search.size !== DEFAULTS.size) params.set('size', String(search.size));
  if (search.direction !== DEFAULTS.direction) params.set('direction', search.direction);
  if (search.sortBy !== DEFAULTS.sortBy) params.set('sortBy', search.sortBy);
  if (search.q) params.set('q', search.q);
  if (search.category) params.set('category', search.category);
  if (search.minPrice !== undefined) params.set('minPrice', String(search.minPrice));
  if (search.maxPrice !== undefined) params.set('maxPrice', String(search.maxPrice));
  if (search.color) params.set('color', search.color);
  if (search.productSize) params.set('productSize', search.productSize);
  return params.toString();
}

export function useProductSearchParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const search = useMemo(() => parse(searchParams), [searchParams]);

  const update = useCallback(
    (changes: Partial<ProductSearch>) => {
      const next: ProductSearch = { ...search, ...changes, page: changes.page ?? 0 };
      const query = serialize(next);
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [search, router, pathname],
  );

  return { search, update };
}
