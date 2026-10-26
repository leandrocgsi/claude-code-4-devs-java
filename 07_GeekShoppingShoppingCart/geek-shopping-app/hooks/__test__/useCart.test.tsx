import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { PRODUCTS_URL, buildProductResponse } from '@/test/fixtures';
import { serveProductsById } from '@/test/msw/serveProductsById';
import { createTestQueryClient, createWrapper, renderHookWithProviders } from '@/test/renderWithProviders';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import { useWishlistStore } from '@/app/store/modules/global/useWishlistStore';
import { useAddToCart } from '../useAddToCart/useAddToCart';
import { useCart } from '../useCart/useCart';
import { useCartCount } from '../useCartCount/useCartCount';
import { useIsWishlisted, useWishlist } from '../useWishlist/useWishlist';

describe('useCart', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('does not call the API and is empty when nothing was added', async () => {
    const requested = serveProductsById([]);

    const { result } = renderHookWithProviders(() => useCart());
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requested).toEqual([]);
    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.shipping).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('resolves each product through the API and computes the totals', async () => {
    const requested = serveProductsById([
      buildProductResponse({ id: 1, price: 25, quantity: 10 }),
      buildProductResponse({ id: 2, price: 40, quantity: 10 }),
    ]);
    useCartStore.setState({ quantities: { 1: 2, 2: 1 } });

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(requested.sort()).toEqual([1, 2]);
    expect(result.current.itemCount).toBe(3);
    expect(result.current.subtotal).toBe(90);
    expect(result.current.shipping).toBe(10);
    expect(result.current.total).toBe(100);
    expect(result.current.items[0].lineTotal).toBe(50);
  });

  it('caps the quantity of a line at the stock', async () => {
    serveProductsById([buildProductResponse({ id: 1, price: 10, quantity: 3 })]);
    useCartStore.setState({ quantities: { 1: 8 } });

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.items[0].lineTotal).toBe(30);
  });

  it('keeps a sold out product in the cart with the stored quantity', async () => {
    serveProductsById([buildProductResponse({ id: 3, price: 10, quantity: 0 })]);
    useCartStore.setState({ quantities: { 3: 2 } });

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('removes from the cart a product that no longer exists', async () => {
    serveProductsById([buildProductResponse({ id: 1 })]);
    useCartStore.setState({ quantities: { 1: 1, 99: 2 } });

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(useCartStore.getState().quantities).toEqual({ 1: 1 }));
    await waitFor(() => expect(result.current.items.map((item) => item.product.id)).toEqual([1]));
    expect(result.current.isError).toBe(false);
  });

  it('does not retry a missing product', async () => {
    const requested = serveProductsById([]);
    useCartStore.setState({ quantities: { 99: 1 } });

    renderHookWithProviders(() => useCart());

    await waitFor(() => expect(useCartStore.getState().quantities).toEqual({}));
    expect(requested).toEqual([99]);
  });

  it('exposes an error state and lets the user try again', async () => {
    let fail = true;
    server.use(
      http.get(`${PRODUCTS_URL}/1`, () =>
        fail ? HttpResponse.json({ message: 'down' }, { status: 500 }) : HttpResponse.json(buildProductResponse({ id: 1 })),
      ),
    );
    useCartStore.setState({ quantities: { 1: 1 } });

    const { result } = renderHookWithProviders(() => useCart());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useCartStore.getState().quantities).toEqual({ 1: 1 });

    fail = false;
    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.isError).toBe(false);
  });

  it('reflects store changes made through its own actions', async () => {
    serveProductsById([buildProductResponse({ id: 1, price: 10, quantity: 10 })]);
    const { result } = renderHookWithProviders(() => useCart());

    act(() => result.current.addItem(1, 2));
    await waitFor(() => expect(result.current.itemCount).toBe(2));

    act(() => result.current.setQuantity(1, 5));
    await waitFor(() => expect(result.current.itemCount).toBe(5));

    act(() => result.current.removeItem(1));
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('clears the cart', async () => {
    serveProductsById([buildProductResponse({ id: 1 })]);
    useCartStore.setState({ quantities: { 1: 1 } });
    const { result } = renderHookWithProviders(() => useCart());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.clear());

    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('shares the product cache with the detail query', async () => {
    const requested = serveProductsById([buildProductResponse({ id: 1 })]);
    useCartStore.setState({ quantities: { 1: 1 } });
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false, retryDelay: 0, gcTime: 60000, staleTime: 60000 } });

    const first = renderHook(() => useCart(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(first.result.current.items).toHaveLength(1));
    const second = renderHook(() => useCart(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(second.result.current.items).toHaveLength(1));
    expect(requested).toEqual([1]);
  });
});

describe('cart facade hooks', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('useAddToCart adds one unit by default and the given quantity otherwise', () => {
    const { result } = renderHook(() => useAddToCart());

    act(() => result.current(1));
    act(() => result.current(2, 3));

    expect(useCartStore.getState().quantities).toEqual({ 1: 1, 2: 3 });
  });

  it('useCartCount sums the quantities of every line', () => {
    const { result } = renderHook(() => useCartCount());
    expect(result.current).toBe(0);

    act(() => useCartStore.setState({ quantities: { 1: 2, 2: 3 } }));

    expect(result.current).toBe(5);
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
