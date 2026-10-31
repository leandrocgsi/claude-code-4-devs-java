import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { CART_URL, buildCartItemResponse, buildCartResponse, buildProductResponse } from '@/test/fixtures';
import { serveCart } from '@/test/msw/serveCart';
import { useCartTokenStore } from '@/app/store/modules/cart/useCartTokenStore';
import { ApiError } from '../httpClient';
import cartService from '../cart';

async function failure(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('The request was expected to fail.');
}

describe('cartService', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartTokenStore.setState({ token: null });
  });

  it('maps the cart of the API with the absolute image url and the totals', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json(
          buildCartResponse([
            buildCartItemResponse({ id: 4, productId: 9, name: 'Black Mug', color: 'Black', size: 'M', unitPrice: 25, quantity: 2, stock: 7 }),
          ]),
        ),
      ),
    );

    const cart = await cartService.get();

    expect(cart).toEqual({
      items: [
        {
          id: 4,
          productId: 9,
          name: 'Black Mug',
          imageUrl: 'http://api.test/api/product/v1/9/image',
          color: 'Black',
          size: 'M',
          unitPrice: 25,
          quantity: 2,
          lineTotal: 50,
          stock: 7,
        },
      ],
      itemCount: 2,
      subtotal: 50,
      shipping: 10,
      total: 60,
    });
  });

  it('keeps a null image url and a null color and size', async () => {
    server.use(
      http.get(CART_URL, () => HttpResponse.json(buildCartResponse([buildCartItemResponse({ id: 1, imageUrl: null })]))),
    );

    const { items } = await cartService.get();

    expect(items[0].imageUrl).toBeNull();
    expect(items[0].color).toBeNull();
    expect(items[0].size).toBeNull();
  });

  it('reads an empty cart', async () => {
    server.use(http.get(CART_URL, () => HttpResponse.json(buildCartResponse([]))));

    expect(await cartService.get()).toEqual({ items: [], itemCount: 0, subtotal: 0, shipping: 0, total: 0 });
  });

  it('maps the shipping and the total exactly as the server sends them', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json({ items: [], itemCount: 0, subtotal: 50, shipping: 12.34, total: 99.99 }),
      ),
    );

    const cart = await cartService.get();

    expect(cart.subtotal).toBe(50);
    expect(cart.shipping).toBe(12.34);
    expect(cart.total).toBe(99.99);
  });

  it('treats a response without the shipping as no shipping', async () => {
    server.use(http.get(CART_URL, () => HttpResponse.json({ items: [], itemCount: 0, subtotal: 50, total: 50 })));

    const cart = await cartService.get();

    expect(cart.shipping).toBe(0);
    expect(cart.total).toBe(50);
  });

  it('carries the shipping and the total of the cart after adding and updating an item', async () => {
    serveCart([buildCartItemResponse({ id: 6, quantity: 1, unitPrice: 10 })], [buildProductResponse({ id: 3, price: 40 })]);

    const added = await cartService.addItem({ productId: 3, quantity: 1 });
    const updated = await cartService.updateItem(6, 5);

    expect(added.shipping).toBe(10);
    expect(added.total).toBe(added.subtotal + 10);
    expect(updated.shipping).toBe(10);
    expect(updated.total).toBe(updated.subtotal + 10);
  });

  it('reads a cart whose response has no items field', async () => {
    server.use(http.get(CART_URL, () => HttpResponse.json({ itemCount: 0, subtotal: 0, total: 0 })));

    expect((await cartService.get()).items).toEqual([]);
  });

  it('adds an item with the product and the quantity', async () => {
    const cart = serveCart([], [buildProductResponse({ id: 3, name: 'Space Book', price: 40 })]);

    const result = await cartService.addItem({ productId: 3, quantity: 2 });

    expect(cart.writes()).toMatchObject([{ method: 'POST', path: '/api/cart/v1/items', body: { productId: 3, quantity: 2 } }]);
    expect(result.items[0]).toMatchObject({ productId: 3, name: 'Space Book', quantity: 2, lineTotal: 80 });
    expect(result.itemCount).toBe(2);
  });

  it('sends the color and the size when they are given', async () => {
    const cart = serveCart([], [buildProductResponse({ id: 3 })]);

    await cartService.addItem({ productId: 3, quantity: 1, color: 'Black', size: 'M' });

    expect(cart.writes()[0].body).toEqual({ productId: 3, quantity: 1, color: 'Black', size: 'M' });
  });

  it('sets the quantity of an item', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 6, quantity: 1, unitPrice: 10 })]);

    const result = await cartService.updateItem(6, 5);

    expect(cart.writes()).toMatchObject([{ method: 'PUT', path: '/api/cart/v1/items/6', body: { quantity: 5 } }]);
    expect(result.subtotal).toBe(50);
  });

  it('removes an item', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 6 }), buildCartItemResponse({ id: 7 })]);

    await cartService.removeItem(6);

    expect(cart.writes()).toMatchObject([{ method: 'DELETE', path: '/api/cart/v1/items/6' }]);
    expect(cart.items().map((item) => item.id)).toEqual([7]);
  });

  it('clears the cart', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 6 }), buildCartItemResponse({ id: 7 })]);

    await cartService.clear();

    expect(cart.writes()).toMatchObject([{ method: 'DELETE', path: '/api/cart/v1' }]);
    expect(cart.items()).toEqual([]);
  });

  it('sends the same token in every operation', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 6 })], [buildProductResponse({ id: 3 })]);

    await cartService.get();
    await cartService.addItem({ productId: 3, quantity: 1 });
    await cartService.updateItem(6, 2);
    await cartService.removeItem(6);
    await cartService.clear();

    const token = useCartTokenStore.getState().token;
    expect(token).not.toBeNull();
    expect(cart.calls).toHaveLength(5);
    expect(cart.calls.every((call) => call.token === token)).toBe(true);
  });

  it('normalizes a ProblemDetail with the field errors of the quantity', async () => {
    serveCart([], [buildProductResponse({ id: 3, quantity: 1 })]);

    const error = await failure(cartService.addItem({ productId: 3, quantity: 5 }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.fields).toEqual({ quantity: 'Only 1 units are available' });
  });

  it('normalizes a not found ExceptionResponse', async () => {
    serveCart();

    const error = await failure(cartService.removeItem(99));

    expect(error.status).toBe(404);
    expect(error.message).toBe('No records found for this ID!');
    expect(error.fields).toBeUndefined();
  });

  it('normalizes a request that gets no response', async () => {
    server.use(http.get(CART_URL, () => HttpResponse.error()));

    const error = await failure(cartService.get());

    expect(error.status).toBe(0);
    expect(error.message).toBe('Could not connect to the server.');
  });

  it('normalizes the error of a missing token header', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json({ type: 'about:blank', title: 'Bad Request', status: 400, detail: "Required header 'X-Cart-Token' is not present." }, { status: 400 }),
      ),
    );

    const error = await failure(cartService.get());

    expect(error.status).toBe(400);
    expect(error.message).toBe("Required header 'X-Cart-Token' is not present.");
  });
});
