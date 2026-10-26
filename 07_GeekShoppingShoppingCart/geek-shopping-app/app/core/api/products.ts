import { api } from './httpClient';
import { HalPage, toPageResponse } from './hal';
import { Product, ProductInput, ProductSortField } from '@/app/core/models/product';
import { Category } from '@/app/core/models/category';
import { Facets } from '@/app/core/models/facets';
import { PageResponse, SortDirection } from '@/app/core/models/pagination';
import { toApiUrl } from '@/app/core/utils/apiUrl';

export interface ProductsQueryParams {
  page?: number;
  size?: number;
  direction?: SortDirection;
  sortBy?: ProductSortField;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  productSizes?: string[];
  featured?: boolean;
}

export type FacetsQueryParams = Omit<ProductsQueryParams, 'page' | 'size' | 'direction' | 'sortBy'>;

export interface ShortcutQueryParams {
  page?: number;
  size?: number;
}

interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  quantity: number;
  featured: boolean;
  createdAt: string;
  color?: string | null;
  size?: string | null;
  popularity: number;
  rating?: number | null;
  reviewCount: number;
  imageUrl?: string | null;
}

const PRODUCTS_PATH = '/api/product/v1';

function toProduct(response: ProductResponse): Product {
  return {
    id: response.id,
    name: response.name,
    description: response.description,
    price: response.price,
    oldPrice: response.oldPrice,
    category: response.category,
    quantity: response.quantity,
    featured: response.featured,
    createdAt: response.createdAt,
    color: response.color,
    size: response.size,
    popularity: response.popularity,
    rating: response.rating,
    reviewCount: response.reviewCount,
    imageUrl: response.imageUrl ? toApiUrl(response.imageUrl) : null,
  };
}

function toFilterParams(params: FacetsQueryParams) {
  return {
    q: params.q || undefined,
    category: params.category || undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    color: params.colors?.length ? params.colors : undefined,
    productSize: params.productSizes?.length ? params.productSizes : undefined,
    featured: params.featured ? true : undefined,
  };
}

function toFormData(product: ProductInput, image?: File | null): FormData {
  const formData = new FormData();
  formData.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }));
  if (image) formData.append('image', image);
  return formData;
}

const MULTIPART_HEADERS = { 'Content-Type': 'multipart/form-data' };

const productsService = {
  async list(params: ProductsQueryParams = {}): Promise<PageResponse<Product>> {
    const { data } = await api.get<HalPage<ProductResponse>>(PRODUCTS_PATH, {
      params: {
        page: params.page,
        size: params.size,
        direction: params.direction,
        sortBy: params.sortBy,
        ...toFilterParams(params),
      },
    });
    return toPageResponse(data, toProduct);
  },

  async listFeatured(params: ShortcutQueryParams = {}): Promise<PageResponse<Product>> {
    const { data } = await api.get<HalPage<ProductResponse>>(`${PRODUCTS_PATH}/featured`, { params });
    return toPageResponse(data, toProduct);
  },

  async listRecent(params: ShortcutQueryParams = {}): Promise<PageResponse<Product>> {
    const { data } = await api.get<HalPage<ProductResponse>>(`${PRODUCTS_PATH}/recent`, { params });
    return toPageResponse(data, toProduct);
  },

  async findById(id: number): Promise<Product> {
    const { data } = await api.get<ProductResponse>(`${PRODUCTS_PATH}/${id}`);
    return toProduct(data);
  },

  async facets(params: FacetsQueryParams = {}): Promise<Facets> {
    const { data } = await api.get<Facets>(`${PRODUCTS_PATH}/facets`, { params: toFilterParams(params) });
    return data;
  },

  async categories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>(`${PRODUCTS_PATH}/categories`);
    return data.map((category) => ({
      ...category,
      imageUrl: category.imageUrl ? toApiUrl(category.imageUrl) : null,
    }));
  },

  async create(product: ProductInput, image?: File | null): Promise<Product> {
    const { data } = await api.post<ProductResponse>(PRODUCTS_PATH, toFormData(product, image), {
      headers: MULTIPART_HEADERS,
    });
    return toProduct(data);
  },

  async update(product: ProductInput, image?: File | null): Promise<Product> {
    const { data } = await api.put<ProductResponse>(PRODUCTS_PATH, toFormData(product, image), {
      headers: MULTIPART_HEADERS,
    });
    return toProduct(data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${PRODUCTS_PATH}/${id}`);
  },
};

export default productsService;
