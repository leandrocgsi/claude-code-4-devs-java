import { Product } from '@/app/core/models/product';

export const API_URL = 'http://api.test';

export const PRODUCTS_URL = `${API_URL}/api/product/v1`;

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  category: string;
  quantity: number;
  featured: boolean;
  createdAt: string;
  color: string | null;
  size: string | null;
  popularity: number;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
}

export function buildProductResponse(overrides: Partial<ProductResponse> = {}): ProductResponse {
  const id = overrides.id ?? 1;
  return {
    id,
    name: `Product ${id}`,
    description: `Description ${id}`,
    price: 25,
    oldPrice: null,
    category: 'Mug',
    quantity: 10,
    featured: false,
    createdAt: '2026-10-01T10:00:00',
    color: null,
    size: null,
    popularity: 0,
    rating: null,
    reviewCount: 0,
    imageUrl: `/api/product/v1/${id}/image`,
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  const id = overrides.id ?? 1;
  return {
    ...buildProductResponse({ id }),
    imageUrl: `${API_URL}/api/product/v1/${id}/image`,
    ...overrides,
  };
}

interface HalPageOptions {
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

export function halPage(items: ProductResponse[], options: HalPageOptions = {}) {
  const size = options.size ?? 12;
  const totalElements = options.totalElements ?? items.length;
  const totalPages = options.totalPages ?? Math.ceil(totalElements / size);
  const number = options.number ?? 0;
  if (items.length === 0) return { _links: { self: { href: `${PRODUCTS_URL}` } }, page: { size, totalElements: 0, totalPages: 0, number } };
  return {
    _embedded: { products: items },
    _links: { self: { href: `${PRODUCTS_URL}` } },
    page: { size, totalElements, totalPages, number },
  };
}

export const FACETS = {
  priceRanges: [
    { min: 0, max: 100, count: 8 },
    { min: 100, max: 200, count: 4 },
    { min: 200, max: null, count: 2 },
  ],
  colors: [
    { name: 'Black', count: 5 },
    { name: 'White', count: 3 },
  ],
  sizes: [
    { name: 'M', count: 4 },
    { name: 'G', count: 2 },
  ],
  categories: [
    { name: 'Mug', count: 6 },
    { name: 'Book', count: 8 },
  ],
};

export const CATEGORIES = [
  { name: 'Mug', productCount: 6, imageUrl: '/api/product/v1/1/image' },
  { name: 'Book', productCount: 8, imageUrl: null },
];

export const CART_URL = `${API_URL}/api/cart/v1`;

export interface CartItemResponse {
  id: number;
  productId: number;
  name: string;
  imageUrl: string | null;
  color: string | null;
  size: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
}

export function buildCartItemResponse(overrides: Partial<CartItemResponse> = {}): CartItemResponse {
  const productId = overrides.productId ?? overrides.id ?? 1;
  const unitPrice = overrides.unitPrice ?? 25;
  const quantity = overrides.quantity ?? 1;
  return {
    id: productId,
    productId,
    name: `Product ${productId}`,
    imageUrl: `/api/product/v1/${productId}/image`,
    color: null,
    size: null,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    stock: 10,
    ...overrides,
  };
}

export const FLAT_SHIPPING = 10;

export function buildCartResponse(items: CartItemResponse[], shipping: number = items.length > 0 ? FLAT_SHIPPING : 0) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    _links: { self: { href: CART_URL, type: 'GET' } },
  };
}
