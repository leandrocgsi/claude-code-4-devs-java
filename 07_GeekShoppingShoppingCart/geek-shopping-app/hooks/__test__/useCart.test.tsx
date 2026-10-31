import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { CART_URL, buildCartItemResponse, buildProductResponse } from '@/test/fixtures';
import { holdAddRequests, serveCart } from '@/test/msw/serveCart';
import { renderHookWithProviders } from '@/test/renderWithProviders';
import { useCartTokenStore } from '@/app/store/modules/cart/useCartTokenStore';
import { useToastStore } from '@/app/store/modules/global/useToastStore';
import { useWishlistStore } from '@/app/store/modules/global/useWishlistStore';
import { useAddToCart } from '../useAddToCart/useAddToCart';
import { useCart } from '../useCart/useCart';
import { useCartCount } from '../useCartCount/useCartCount';
import { useClearCart } from '../useClearCart/useClearCart';
import { useRemoveCartItem } from '../useRemoveCartItem/useRemoveCartItem';
import { useUpdateCartItem } from '../useUpdateCartItem/useUpdateCartItem';
import { useToast, useToasts } from '../useToast/useToast';
import { useIsWishlisted, useWishlist } from '../useWishlist/useWishlist';

beforeEach(() => {
  localStorage.clear();
  useCartTokenStore.setState({ token: null });
  useToastStore.setState({ toasts: [] });
});

describe('useCart', () => {
  it('is empty when the API has no cart for the token', async () => {
    const cart = serveCart();

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(cart.calls).toHaveLength(1));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('exposes the items and the totals computed by the server', async () => {
    serveCart([
      buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 2, color: 'Black' }),
      buildCartItemResponse({ id: 2, name: 'Space Book', unitPrice: 40, quantity: 1 }),
    ]);

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.itemCount).toBe(3);
    expect(result.current.subtotal).toBe(90);
    expect(result.current.total).toBe(90);
    expect(result.current.items[0]).toMatchObject({
      id: 1,
      productId: 1,
      name: 'Black Mug',
      color: 'Black',
      unitPrice: 25,
      quantity: 2,
      lineTotal: 50,
      stock: 10,
      imageUrl: 'http://api.test/api/product/v1/1/image',
    });
  });

  it('sends the same generated token on every cart request', async () => {
    const cart = serveCart();

    const { result } = renderHookWithProviders(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.refetch());

    const tokens = cart.calls.map((call) => call.token);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toBe(useCartTokenStore.getState().token);
    expect(tokens[1]).toBe(tokens[0]);
    expect(tokens[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('exposes an error state and lets the user try again', async () => {
    let fail = true;
    server.use(
      http.get(CART_URL, () =>
        fail ? HttpResponse.json({ message: 'down' }, { status: 500 }) : HttpResponse.json({ items: [], itemCount: 0, subtotal: 0, total: 0 }),
      ),
    );

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.isError).toBe(true));

    fail = false;
    await act(() => result.current.refetch());

    await waitFor(() => expect(result.current.isError).toBe(false));
  });

  it('treats a response without items as an empty cart', async () => {
    server.use(http.get(CART_URL, () => HttpResponse.json({ itemCount: 0, subtotal: 0, total: 0 })));

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });
});

describe('cart hooks', () => {
  it('useCartCount returns the number of units of the cart', async () => {
    serveCart([buildCartItemResponse({ id: 1, quantity: 2 }), buildCartItemResponse({ id: 2, quantity: 3 })]);

    const { result } = renderHookWithProviders(() => useCartCount());
    expect(result.current).toBe(0);

    await waitFor(() => expect(result.current).toBe(5));
  });

  it('useAddToCart adds one unit by default and the given quantity otherwise', async () => {
    const cart = serveCart([], [buildProductResponse({ id: 1 }), buildProductResponse({ id: 2 })]);
    const { result } = renderHookWithProviders(() => useAddToCart());

    act(() => result.current.addItem(1));
    await waitFor(() => expect(cart.writes()).toHaveLength(1));
    act(() => result.current.addItem(2, 3));
    await waitFor(() => expect(cart.writes()).toHaveLength(2));

    expect(cart.writes().map((call) => call.body)).toEqual([
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 3 },
    ]);
  });

  it('useAddToCart refreshes the cart, confirms with a toast and calls onAdded', async () => {
    serveCart([], [buildProductResponse({ id: 1 })]);
    const onAdded = vi.fn();
    const { result } = renderHookWithProviders(() => ({ cart: useCart(), add: useAddToCart() }));
    await waitFor(() => expect(result.current.cart.isLoading).toBe(false));

    act(() => result.current.add.addItem(1, 2, onAdded));

    await waitFor(() => expect(result.current.cart.itemCount).toBe(2));
    expect(onAdded).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().toasts.map((toast) => [toast.tone, toast.message])).toEqual([
      ['success', 'Added to your cart.'],
    ]);
  });

  it('useAddToCart shows the message of the API when the quantity exceeds the stock', async () => {
    serveCart([], [buildProductResponse({ id: 1, quantity: 2 })]);
    const onAdded = vi.fn();
    const { result } = renderHookWithProviders(() => useAddToCart());

    act(() => result.current.addItem(1, 5, onAdded));

    await waitFor(() => expect(useToastStore.getState().toasts).toHaveLength(1));
    expect(useToastStore.getState().toasts[0]).toMatchObject({ tone: 'error', message: 'Only 2 units are available' });
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('useAddToCart is pending while the request is in flight', async () => {
    const release = holdAddRequests();
    const { result } = renderHookWithProviders(() => useAddToCart());
    expect(result.current.isPending).toBe(false);

    act(() => result.current.addItem(1));

    await waitFor(() => expect(result.current.isPending).toBe(true));
    release();
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('useUpdateCartItem sets the quantity and refreshes the cart', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 7, quantity: 1, unitPrice: 10 })]);
    const { result } = renderHookWithProviders(() => ({ cart: useCart(), update: useUpdateCartItem() }));
    await waitFor(() => expect(result.current.cart.itemCount).toBe(1));

    act(() => result.current.update.mutate({ itemId: 7, quantity: 4 }));

    await waitFor(() => expect(result.current.cart.itemCount).toBe(4));
    expect(result.current.cart.subtotal).toBe(40);
    expect(cart.writes()).toMatchObject([{ method: 'PUT', path: '/api/cart/v1/items/7', body: { quantity: 4 } }]);
  });

  it('useUpdateCartItem exposes the API error without changing the cart', async () => {
    serveCart([buildCartItemResponse({ id: 7, quantity: 1, stock: 3 })]);
    const { result } = renderHookWithProviders(() => ({ cart: useCart(), update: useUpdateCartItem() }));
    await waitFor(() => expect(result.current.cart.itemCount).toBe(1));

    act(() => result.current.update.mutate({ itemId: 7, quantity: 9 }));

    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(result.current.cart.itemCount).toBe(1);
  });

  it('useRemoveCartItem removes the line and refreshes the cart', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1 }), buildCartItemResponse({ id: 2 })]);
    const { result } = renderHookWithProviders(() => ({ cart: useCart(), remove: useRemoveCartItem() }));
    await waitFor(() => expect(result.current.cart.items).toHaveLength(2));

    act(() => result.current.remove.mutate(1));

    await waitFor(() => expect(result.current.cart.items.map((item) => item.id)).toEqual([2]));
    expect(cart.writes()).toMatchObject([{ method: 'DELETE', path: '/api/cart/v1/items/1' }]);
  });

  it('useRemoveCartItem shows a toast when the API fails', async () => {
    serveCart([buildCartItemResponse({ id: 1 })]);
    const { result } = renderHookWithProviders(() => useRemoveCartItem());

    act(() => result.current.mutate(99));

    await waitFor(() => expect(useToastStore.getState().toasts).toHaveLength(1));
    expect(useToastStore.getState().toasts[0]).toMatchObject({ tone: 'error', message: 'No records found for this ID!' });
  });

  it('useClearCart empties the cart and refreshes it', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1 }), buildCartItemResponse({ id: 2 })]);
    const { result } = renderHookWithProviders(() => ({ cart: useCart(), clear: useClearCart() }));
    await waitFor(() => expect(result.current.cart.items).toHaveLength(2));

    act(() => result.current.clear.mutate());

    await waitFor(() => expect(result.current.cart.items).toEqual([]));
    expect(cart.writes()).toMatchObject([{ method: 'DELETE', path: '/api/cart/v1' }]);
  });

  it('useClearCart shows a toast when the API fails', async () => {
    server.use(http.delete(CART_URL, () => HttpResponse.json({ message: 'down' }, { status: 500 })));
    const { result } = renderHookWithProviders(() => useClearCart());

    act(() => result.current.mutate());

    await waitFor(() => expect(useToastStore.getState().toasts).toHaveLength(1));
    expect(useToastStore.getState().toasts[0]).toMatchObject({ tone: 'error', message: 'down' });
  });
});

describe('wishlist facade hooks', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
  });

  it('useWishlist counts the products and toggles them', () => {
    const { result } = renderHook(() => useWishlist());
    expect(result.current.count).toBe(0);

    act(() => result.current.toggle(1));
    act(() => result.current.toggle(2));
    expect(result.current.count).toBe(2);

    act(() => result.current.toggle(1));
    expect(result.current.count).toBe(1);
  });

  it('useIsWishlisted follows only its own product', () => {
    const { result } = renderHook(() => useIsWishlisted(1));
    expect(result.current).toBe(false);

    act(() => useWishlistStore.getState().toggle(2));
    expect(result.current).toBe(false);

    act(() => useWishlistStore.getState().toggle(1));
    expect(result.current).toBe(true);
  });
});

describe('toast facade hooks', () => {
  it('useToast shows and dismisses toasts through the store', () => {
    const { result } = renderHook(() => ({ api: useToast(), toasts: useToasts() }));

    act(() => result.current.api.show('info', 'Hello'));
    expect(result.current.toasts).toHaveLength(1);

    act(() => result.current.api.dismiss(result.current.toasts[0].id));
    expect(result.current.toasts).toEqual([]);
  });
});
