import { http, HttpResponse } from 'msw';
import { CART_URL, CATEGORIES, FACETS, PRODUCTS_URL, buildCartResponse, buildProductResponse, halPage } from '../fixtures';

const catalog = [
  buildProductResponse({ id: 1, name: 'Black Mug', category: 'Mug', featured: true }),
  buildProductResponse({ id: 2, name: 'Space Book', category: 'Book', rating: 4.5, reviewCount: 12 }),
  buildProductResponse({ id: 3, name: 'Sold Out Hoodie', category: 'Hoodie', quantity: 0 }),
];

export const handlers = [
  http.get(CART_URL, () => HttpResponse.json(buildCartResponse([]))),
  http.get(`${PRODUCTS_URL}/featured`, () => HttpResponse.json(halPage(catalog.slice(0, 1)))),
  http.get(`${PRODUCTS_URL}/recent`, () => HttpResponse.json(halPage(catalog))),
  http.get(`${PRODUCTS_URL}/facets`, () => HttpResponse.json(FACETS)),
  http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json(CATEGORIES)),
  http.get(`${PRODUCTS_URL}/:id`, ({ params }) => {
    const found = catalog.find((product) => product.id === Number(params.id));
    return found
      ? HttpResponse.json(found)
      : HttpResponse.json(
          { timestamp: '2026-10-25T10:00:00', message: 'No records found for this ID!', details: 'uri=/api/product/v1' },
          { status: 404 },
        );
  }),
  http.get(PRODUCTS_URL, () => HttpResponse.json(halPage(catalog))),
];
