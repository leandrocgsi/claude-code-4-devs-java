import { http, HttpResponse } from 'msw';
import { CART_URL, CartItemResponse, ProductResponse, buildCartResponse } from '../fixtures';
import { server } from './server';

export interface CartCall {
  method: string;
  path: string;
  token: string | null;
  body: unknown;
}

function withQuantity(item: CartItemResponse, quantity: number): CartItemResponse {
  return { ...item, quantity, lineTotal: item.unitPrice * quantity };
}

function validationError(field: string, message: string) {
  return HttpResponse.json(
    { type: 'about:blank', title: 'Bad Request', status: 400, detail: 'Validation failed', errors: { [field]: message } },
    { status: 400 },
  );
}

function notFound() {
  return HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 });
}

export function holdAddRequests() {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.post(`${CART_URL}/items`, async () => {
      await gate;
      return HttpResponse.json(buildCartResponse([]));
    }),
  );
  return release;
}

export function serveCart(initial: CartItemResponse[] = [], products: ProductResponse[] = []) {
  let items = [...initial];
  let nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const calls: CartCall[] = [];

  const record = (request: Request, body: unknown = null) => {
    calls.push({
      method: request.method,
      path: new URL(request.url).pathname,
      token: request.headers.get('X-Cart-Token'),
      body,
    });
  };

  server.use(
    http.get(CART_URL, ({ request }) => {
      record(request);
      return HttpResponse.json(buildCartResponse(items));
    }),
    http.delete(CART_URL, ({ request }) => {
      record(request);
      items = [];
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${CART_URL}/items`, async ({ request }) => {
      const body = (await request.json()) as { productId: number; quantity: number };
      record(request, body);
      const product = products.find((candidate) => candidate.id === body.productId);
      if (!product) return notFound();
      const existing = items.find((item) => item.productId === body.productId);
      const quantity = body.quantity + (existing?.quantity ?? 0);
      if (quantity > product.quantity) return validationError('quantity', `Only ${product.quantity} units are available`);
      if (existing) {
        items = items.map((item) => (item === existing ? withQuantity(item, quantity) : item));
      } else {
        items = [
          ...items,
          {
            id: nextId++,
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            color: product.color,
            size: product.size,
            unitPrice: product.price,
            quantity,
            lineTotal: product.price * quantity,
            stock: product.quantity,
          },
        ];
      }
      return HttpResponse.json(buildCartResponse(items));
    }),
    http.put(`${CART_URL}/items/:itemId`, async ({ request, params }) => {
      const body = (await request.json()) as { quantity: number };
      record(request, body);
      const target = items.find((item) => item.id === Number(params.itemId));
      if (!target) return notFound();
      if (body.quantity > target.stock) return validationError('quantity', `Only ${target.stock} units are available`);
      items = items.map((item) => (item === target ? withQuantity(item, body.quantity) : item));
      return HttpResponse.json(buildCartResponse(items));
    }),
    http.delete(`${CART_URL}/items/:itemId`, ({ request, params }) => {
      record(request);
      const id = Number(params.itemId);
      if (!items.some((item) => item.id === id)) return notFound();
      items = items.filter((item) => item.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return {
    calls,
    items: () => items,
    writes: () => calls.filter((call) => call.method !== 'GET'),
  };
}
