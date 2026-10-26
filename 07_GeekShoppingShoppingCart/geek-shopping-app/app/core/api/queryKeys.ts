import { FacetsQueryParams, ProductsQueryParams, ShortcutQueryParams } from './products';

export const productKeys = {
  all: ['products'] as const,
  list: (params: ProductsQueryParams) => ['products', 'list', params] as const,
  featured: (params: ShortcutQueryParams) => ['products', 'featured', params] as const,
  recent: (params: ShortcutQueryParams) => ['products', 'recent', params] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
  facets: (params: FacetsQueryParams) => ['products', 'facets', params] as const,
  categories: ['products', 'categories'] as const,
};
