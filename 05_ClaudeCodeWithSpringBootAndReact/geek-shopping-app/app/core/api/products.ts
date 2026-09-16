import { api } from './httpClient';
import { Product } from '@/app/core/models/product';
import { PageResponse, SortDirection } from '@/app/core/models/pagination';
import { MOCK_PRODUCTS } from '@/app/core/mocks/products';

export interface ProductsQueryParams {
  page?: number;
  size?: number;
  direction?: SortDirection;
}

const PRODUCTS_PATH = '/api/product/v1';

export const USE_MOCK_PRODUCT_DATA = true;

function buildMockPage(params: ProductsQueryParams): PageResponse<Product> {
  const { page = 0, size = 12, direction = 'asc' } = params;
  const sorted = [...MOCK_PRODUCTS].sort((a, b) =>
    direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const content = sorted.slice(start, start + size);

  return {
    content,
    totalElements,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  };
}

const productsService = {
  async list(params: ProductsQueryParams = {}): Promise<PageResponse<Product>> {
    if (USE_MOCK_PRODUCT_DATA) {
      return buildMockPage(params);
    }
    const { page = 0, size = 12, direction = 'asc' } = params;
    const { data } = await api.get<PageResponse<Product>>(PRODUCTS_PATH, {
      params: { page, size, direction },
    });
    return data;
  },
};

export default productsService;
