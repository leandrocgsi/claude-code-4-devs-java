import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { API_URL, CATEGORIES, FACETS, PRODUCTS_URL, buildProductResponse, halPage } from '@/test/fixtures';
import { renderHookWithProviders } from '@/test/renderWithProviders';
import { ApiError } from '@/app/core/api/httpClient';
import { productKeys } from '@/app/core/api/queryKeys';
import { useCategories } from '../useCategories/useCategories';
import { useCreateProduct } from '../useCreateProduct/useCreateProduct';
import { useDeleteProduct } from '../useDeleteProduct/useDeleteProduct';
import { useFacets } from '../useFacets/useFacets';
import { useFeaturedProducts } from '../useFeaturedProducts/useFeaturedProducts';
import { useProduct } from '../useProduct/useProduct';
import { useProducts } from '../useProducts/useProducts';
import { useRecentProducts } from '../useRecentProducts/useRecentProducts';
import { useUpdateProduct } from '../useUpdateProduct/useUpdateProduct';

const PRODUCT_INPUT = {
  name: 'Mug',
  description: 'A mug',
  price: 25,
  oldPrice: null,
  category: 'Mug',
  quantity: 3,
  color: null,
  size: null,
  featured: false,
};

describe('query keys', () => {
  it('include the filters, the page and the sort of a listing', () => {
    expect(productKeys.list({ page: 1, q: 'mug' })).toEqual(['products', 'list', { page: 1, q: 'mug' }]);
    expect(productKeys.list({ page: 1, q: 'mug' })).not.toEqual(productKeys.list({ page: 2, q: 'mug' }));
    expect(productKeys.list({ q: 'mug' })).not.toEqual(productKeys.list({ q: 'book' }));
  });

  it('all share the products root so one invalidation reaches them', () => {
    const keys = [
      productKeys.list({}),
      productKeys.featured({}),
      productKeys.recent({}),
      productKeys.detail(1),
      productKeys.facets({}),
      productKeys.categories,
    ];

    keys.forEach((key) => expect(key.slice(0, productKeys.all.length)).toEqual(productKeys.all));
  });
});

describe('useProducts', () => {
  it('returns the page once loaded and exposes the loading state before', async () => {
    server.use(http.get(PRODUCTS_URL, () => HttpResponse.json(halPage([buildProductResponse({ id: 1 })]))));

    const { result } = renderHookWithProviders(() => useProducts({ page: 0, size: 12 }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content[0].id).toBe(1);
  });

  it('stores the result under a key that contains the filters', async () => {
    const params = { page: 0, size: 12, q: 'mug', colors: ['Black'] };
    const { result, queryClient } = renderHookWithProviders(() => useProducts(params));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(productKeys.list(params))).toBeDefined();
    expect(queryClient.getQueryData(productKeys.list({ ...params, q: 'book' }))).toBeUndefined();
  });

  it('fetches again with the new parameters when a filter changes', async () => {
    const requests: string[] = [];
    server.use(
      http.get(PRODUCTS_URL, ({ request }) => {
        requests.push(new URL(request.url).searchParams.get('q') ?? '');
        return HttpResponse.json(halPage([buildProductResponse({ id: 1 })]));
      }),
    );

    const { result, rerender } = renderHookWithProviders(({ q }) => useProducts({ page: 0, q }), {
      initialProps: { q: 'mug' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ q: 'book' });

    await waitFor(() => expect(requests).toEqual(['mug', 'book']));
  });

  it('keeps showing the previous page while the next one loads', async () => {
    let release: () => void = () => undefined;
    server.use(
      http.get(PRODUCTS_URL, async ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        if (page === '1') await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json(halPage([buildProductResponse({ id: Number(page) + 1 })], { number: Number(page) }));
      }),
    );

    const { result, rerender } = renderHookWithProviders(({ page }) => useProducts({ page }), { initialProps: { page: 0 } });
    await waitFor(() => expect(result.current.data?.content[0].id).toBe(1));

    rerender({ page: 1 });

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
    expect(result.current.data?.content[0].id).toBe(1);
    release();
    await waitFor(() => expect(result.current.data?.content[0].id).toBe(2));
  });

  it('exposes the error state with the normalized ApiError', async () => {
    server.use(http.get(PRODUCTS_URL, () => HttpResponse.json({ detail: 'Invalid sortBy' }, { status: 400 })));

    const { result } = renderHookWithProviders(() => useProducts({ page: 0 }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
  });

  it('retries once before giving up', async () => {
    let calls = 0;
    server.use(
      http.get(PRODUCTS_URL, () => {
        calls += 1;
        return HttpResponse.json({ message: 'down' }, { status: 500 });
      }),
    );

    const { result } = renderHookWithProviders(() => useProducts({ page: 0 }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(2);
  });
});

describe('useProduct', () => {
  it('loads one product', async () => {
    server.use(http.get(`${PRODUCTS_URL}/4`, () => HttpResponse.json(buildProductResponse({ id: 4, name: 'Poster' }))));

    const { result } = renderHookWithProviders(() => useProduct(4));

    await waitFor(() => expect(result.current.data?.name).toBe('Poster'));
  });

  it.each([0, -1, 1.5, Number.NaN])('does not request anything for the invalid id %s', async (id) => {
    let calls = 0;
    server.use(
      http.get(`${PRODUCTS_URL}/:id`, () => {
        calls += 1;
        return HttpResponse.json(buildProductResponse());
      }),
    );

    const { result } = renderHookWithProviders(() => useProduct(id));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.fetchStatus).toBe('idle');
    expect(calls).toBe(0);
  });

  it('does not retry a 404 and exposes it as an ApiError', async () => {
    let calls = 0;
    server.use(
      http.get(`${PRODUCTS_URL}/99`, () => {
        calls += 1;
        return HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 });
      }),
    );

    const { result } = renderHookWithProviders(() => useProduct(99));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(404);
    expect(calls).toBe(1);
  });

  it('retries other failures once', async () => {
    let calls = 0;
    server.use(
      http.get(`${PRODUCTS_URL}/5`, () => {
        calls += 1;
        return HttpResponse.json({ message: 'down' }, { status: 500 });
      }),
    );

    const { result } = renderHookWithProviders(() => useProduct(5));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(2);
  });
});

describe('useFeaturedProducts and useRecentProducts', () => {
  it('load the featured shortcut with its own key', async () => {
    const params = { page: 0, size: 8 };
    const { result, queryClient } = renderHookWithProviders(() => useFeaturedProducts(params));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.content.map((product) => product.id)).toEqual([1]);
    expect(queryClient.getQueryData(productKeys.featured(params))).toBeDefined();
    expect(queryClient.getQueryData(productKeys.recent(params))).toBeUndefined();
  });

  it('load the recent shortcut with its own key', async () => {
    const params = { page: 0, size: 8 };
    const { result, queryClient } = renderHookWithProviders(() => useRecentProducts(params));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.content).toHaveLength(3);
    expect(queryClient.getQueryData(productKeys.recent(params))).toBeDefined();
  });

  it('expose the error state', async () => {
    server.use(
      http.get(`${PRODUCTS_URL}/featured`, () => HttpResponse.json({ message: 'down' }, { status: 500 })),
      http.get(`${PRODUCTS_URL}/recent`, () => HttpResponse.json({ message: 'down' }, { status: 500 })),
    );

    const featured = renderHookWithProviders(() => useFeaturedProducts({ page: 0, size: 8 }));
    const recent = renderHookWithProviders(() => useRecentProducts({ page: 0, size: 8 }));

    await waitFor(() => expect(featured.result.current.isError).toBe(true));
    await waitFor(() => expect(recent.result.current.isError).toBe(true));
  });

  it('expose an empty page', async () => {
    server.use(http.get(`${PRODUCTS_URL}/featured`, () => HttpResponse.json(halPage([]))));

    const { result } = renderHookWithProviders(() => useFeaturedProducts({ page: 0, size: 8 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.empty).toBe(true);
  });
});

describe('useFacets', () => {
  it('loads the facets', async () => {
    const { result } = renderHookWithProviders(() => useFacets({}));

    await waitFor(() => expect(result.current.data).toEqual(FACETS));
  });

  it('keys the facets by the filters and sends them', async () => {
    const received: string[][] = [];
    server.use(
      http.get(`${PRODUCTS_URL}/facets`, ({ request }) => {
        received.push(new URL(request.url).searchParams.getAll('color'));
        return HttpResponse.json(FACETS);
      }),
    );
    const params = { colors: ['Black'] };

    const { result, queryClient } = renderHookWithProviders(() => useFacets(params));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(received).toEqual([['Black']]);
    expect(queryClient.getQueryData(productKeys.facets(params))).toEqual(FACETS);
  });

  it('exposes the error state', async () => {
    server.use(http.get(`${PRODUCTS_URL}/facets`, () => HttpResponse.json({ message: 'down' }, { status: 500 })));

    const { result } = renderHookWithProviders(() => useFacets({}));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCategories', () => {
  it('loads the categories with absolute image urls', async () => {
    const { result } = renderHookWithProviders(() => useCategories());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { ...CATEGORIES[0], imageUrl: `${API_URL}${CATEGORIES[0].imageUrl}` },
      { name: 'Book', productCount: 8, imageUrl: null },
    ]);
  });

  it('exposes the error state', async () => {
    server.use(http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json({ message: 'down' }, { status: 500 })));

    const { result } = renderHookWithProviders(() => useCategories());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('mutations invalidate the product queries', () => {
  it('useCreateProduct sends the product and invalidates the products root', async () => {
    let body: unknown;
    server.use(
      http.post(PRODUCTS_URL, async ({ request }) => {
        body = JSON.parse(await ((await request.formData()).get('product') as Blob).text());
        return HttpResponse.json(buildProductResponse({ id: 20 }), { status: 201 });
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() => useCreateProduct());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(() => result.current.mutateAsync({ product: PRODUCT_INPUT, image: null }));

    expect(body).toEqual(PRODUCT_INPUT);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all });
  });

  it('useUpdateProduct sends the product and invalidates the products root', async () => {
    let method: string | undefined;
    server.use(
      http.put(PRODUCTS_URL, ({ request }) => {
        method = request.method;
        return HttpResponse.json(buildProductResponse({ id: 3 }));
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() => useUpdateProduct());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(() => result.current.mutateAsync({ product: { ...PRODUCT_INPUT, id: 3 }, image: null }));

    expect(method).toBe('PUT');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all });
  });

  it('useDeleteProduct deletes by id and invalidates the products root', async () => {
    let deleted: string | undefined;
    server.use(
      http.delete(`${PRODUCTS_URL}/:id`, ({ params }) => {
        deleted = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() => useDeleteProduct());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(() => result.current.mutateAsync(8));

    expect(deleted).toBe('8');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productKeys.all });
  });

  it('a mutation refetches the active listing', async () => {
    let listCalls = 0;
    server.use(
      http.get(PRODUCTS_URL, () => {
        listCalls += 1;
        return HttpResponse.json(halPage([buildProductResponse({ id: 1 })]));
      }),
      http.delete(`${PRODUCTS_URL}/:id`, () => new HttpResponse(null, { status: 204 })),
    );
    const { queryClient } = renderHookWithProviders(() => useProducts({ page: 0 }));
    await waitFor(() => expect(listCalls).toBe(1));
    const mutation = renderHookWithProviders(() => useDeleteProduct(), {}, queryClient);

    await act(() => mutation.result.current.mutateAsync(1));

    await waitFor(() => expect(listCalls).toBe(2));
  });

  it('does not invalidate anything when the mutation fails', async () => {
    server.use(http.post(PRODUCTS_URL, () => HttpResponse.json({ detail: 'Validation failed', errors: { name: 'required' } }, { status: 400 })));
    const { result, queryClient } = renderHookWithProviders(() => useCreateProduct());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await result.current.mutateAsync({ product: PRODUCT_INPUT, image: null }).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
    expect((result.current.error as ApiError).fields).toEqual({ name: 'required' });
  });

  it('useDeleteProduct exposes a 404', async () => {
    server.use(http.delete(`${PRODUCTS_URL}/99`, () => HttpResponse.json({ message: 'No records found' }, { status: 404 })));
    const { result } = renderHookWithProviders(() => useDeleteProduct());

    await act(async () => {
      await result.current.mutateAsync(99).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(404);
  });
});
