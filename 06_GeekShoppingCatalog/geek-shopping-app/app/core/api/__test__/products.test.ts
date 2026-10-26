import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { API_URL, CATEGORIES, FACETS, PRODUCTS_URL, buildProductResponse, halPage } from '@/test/fixtures';
import { ApiError } from '../httpClient';
import productsService from '../products';

function captureSearchParams(path: string, body: unknown = halPage([])) {
  const captured: { params: URLSearchParams } = { params: new URLSearchParams() };
  server.use(
    http.get(`${PRODUCTS_URL}${path}`, ({ request }) => {
      captured.params = new URL(request.url).searchParams;
      return HttpResponse.json(body as Record<string, unknown>);
    }),
  );
  return captured;
}

describe('productsService.list', () => {
  it('maps the HAL page to a PageResponse with absolute image urls', async () => {
    server.use(
      http.get(PRODUCTS_URL, () =>
        HttpResponse.json(
          halPage([buildProductResponse({ id: 1 }), buildProductResponse({ id: 2, imageUrl: null })], {
            number: 0,
            size: 12,
            totalElements: 2,
            totalPages: 1,
          }),
        ),
      ),
    );

    const page = await productsService.list();

    expect(page.content).toHaveLength(2);
    expect(page.content[0].imageUrl).toBe(`${API_URL}/api/product/v1/1/image`);
    expect(page.content[1].imageUrl).toBeNull();
    expect(page.totalElements).toBe(2);
    expect(page.first).toBe(true);
    expect(page.last).toBe(true);
  });

  it('keeps every field of the product', async () => {
    const response = buildProductResponse({
      id: 5,
      name: 'Hoodie',
      oldPrice: 300,
      price: 250,
      color: 'Black',
      size: 'M',
      rating: 4.5,
      reviewCount: 9,
      featured: true,
      popularity: 40,
    });
    server.use(http.get(PRODUCTS_URL, () => HttpResponse.json(halPage([response]))));

    const { content } = await productsService.list();

    expect(content[0]).toMatchObject({
      id: 5,
      name: 'Hoodie',
      oldPrice: 300,
      price: 250,
      color: 'Black',
      size: 'M',
      rating: 4.5,
      reviewCount: 9,
      featured: true,
      popularity: 40,
      createdAt: '2026-10-01T10:00:00',
    });
  });

  it('returns an empty page when the API answers without _embedded', async () => {
    server.use(http.get(PRODUCTS_URL, () => HttpResponse.json(halPage([]))));

    const page = await productsService.list();

    expect(page.content).toEqual([]);
    expect(page.empty).toBe(true);
    expect(page.totalPages).toBe(0);
  });

  it('sends the pagination, the sort and every filter as query parameters', async () => {
    const captured = captureSearchParams('');

    await productsService.list({
      page: 2,
      size: 24,
      direction: 'asc',
      sortBy: 'price',
      q: 'mug',
      category: 'Mug',
      minPrice: 100,
      maxPrice: 199.99,
      colors: ['Black', 'White'],
      productSizes: ['M', 'G'],
      featured: true,
    });

    expect(captured.params.get('page')).toBe('2');
    expect(captured.params.get('size')).toBe('24');
    expect(captured.params.get('direction')).toBe('asc');
    expect(captured.params.get('sortBy')).toBe('price');
    expect(captured.params.get('q')).toBe('mug');
    expect(captured.params.get('category')).toBe('Mug');
    expect(captured.params.get('minPrice')).toBe('100');
    expect(captured.params.get('maxPrice')).toBe('199.99');
    expect(captured.params.getAll('color')).toEqual(['Black', 'White']);
    expect(captured.params.getAll('productSize')).toEqual(['M', 'G']);
    expect(captured.params.get('featured')).toBe('true');
  });

  it('names the size filter productSize, never size', async () => {
    const captured = captureSearchParams('');

    await productsService.list({ size: 12, productSizes: ['M'] });

    expect(captured.params.get('size')).toBe('12');
    expect(captured.params.getAll('productSize')).toEqual(['M']);
  });

  it('omits empty filters from the request', async () => {
    const captured = captureSearchParams('');

    await productsService.list({ q: '', category: '', colors: [], productSizes: [], featured: false });

    expect([...captured.params.keys()]).toEqual([]);
  });

  it('keeps a price filter of zero', async () => {
    const captured = captureSearchParams('');

    await productsService.list({ minPrice: 0 });

    expect(captured.params.get('minPrice')).toBe('0');
  });

  it('rejects with an ApiError carrying the fields of a 400', async () => {
    server.use(
      http.get(PRODUCTS_URL, () =>
        HttpResponse.json({ detail: 'Invalid request', errors: { sortBy: 'invalid value' } }, { status: 400 }),
      ),
    );

    const error = (await productsService.list({ sortBy: 'price' }).catch((cause) => cause)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.fields).toEqual({ sortBy: 'invalid value' });
  });
});

describe('productsService shortcuts', () => {
  it('lists the featured products with the page and the size', async () => {
    const captured = captureSearchParams('/featured', halPage([buildProductResponse({ id: 4 })]));

    const page = await productsService.listFeatured({ page: 0, size: 8 });

    expect(captured.params.get('page')).toBe('0');
    expect(captured.params.get('size')).toBe('8');
    expect(page.content[0].id).toBe(4);
    expect(page.content[0].imageUrl).toBe(`${API_URL}/api/product/v1/4/image`);
  });

  it('lists the recent products with the page and the size', async () => {
    const captured = captureSearchParams('/recent', halPage([buildProductResponse({ id: 6 })]));

    const page = await productsService.listRecent({ page: 1, size: 4 });

    expect(captured.params.get('page')).toBe('1');
    expect(captured.params.get('size')).toBe('4');
    expect(page.content[0].id).toBe(6);
  });

  it('handles an empty featured page', async () => {
    server.use(http.get(`${PRODUCTS_URL}/featured`, () => HttpResponse.json(halPage([]))));

    const page = await productsService.listFeatured();

    expect(page.empty).toBe(true);
  });
});

describe('productsService.findById', () => {
  it('returns the product with an absolute image url', async () => {
    server.use(http.get(`${PRODUCTS_URL}/7`, () => HttpResponse.json(buildProductResponse({ id: 7, name: 'Poster' }))));

    const product = await productsService.findById(7);

    expect(product.name).toBe('Poster');
    expect(product.imageUrl).toBe(`${API_URL}/api/product/v1/7/image`);
  });

  it('rejects with a 404 ApiError for an unknown product', async () => {
    server.use(
      http.get(`${PRODUCTS_URL}/999`, () => HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 })),
    );

    const error = (await productsService.findById(999).catch((cause) => cause)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('No records found for this ID!');
  });
});

describe('productsService.facets', () => {
  it('returns the facets of the API', async () => {
    server.use(http.get(`${PRODUCTS_URL}/facets`, () => HttpResponse.json(FACETS)));

    const facets = await productsService.facets();

    expect(facets).toEqual(FACETS);
  });

  it('sends the filters but no pagination', async () => {
    const captured = captureSearchParams('/facets', FACETS);

    await productsService.facets({ q: 'mug', category: 'Mug', colors: ['Black'], productSizes: ['M'], minPrice: 10, maxPrice: 50 });

    expect(captured.params.get('q')).toBe('mug');
    expect(captured.params.get('category')).toBe('Mug');
    expect(captured.params.getAll('color')).toEqual(['Black']);
    expect(captured.params.getAll('productSize')).toEqual(['M']);
    expect(captured.params.get('minPrice')).toBe('10');
    expect(captured.params.get('maxPrice')).toBe('50');
    expect(captured.params.has('page')).toBe(false);
    expect(captured.params.has('sortBy')).toBe(false);
  });
});

describe('productsService.categories', () => {
  it('makes the relative image urls absolute and keeps the missing ones', async () => {
    server.use(http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json(CATEGORIES)));

    const categories = await productsService.categories();

    expect(categories).toEqual([
      { name: 'Mug', productCount: 6, imageUrl: `${API_URL}/api/product/v1/1/image` },
      { name: 'Book', productCount: 8, imageUrl: null },
    ]);
  });

  it('returns an empty list', async () => {
    server.use(http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json([])));

    expect(await productsService.categories()).toEqual([]);
  });
});

const NEW_PRODUCT = {
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

describe('productsService.create', () => {
  it('posts a multipart request whose product part is a JSON blob and whose image part is the file', async () => {
    const received: { type?: string; product?: unknown; imageType?: string; imageSize?: number; contentType?: string | null } = {};
    server.use(
      http.post(PRODUCTS_URL, async ({ request }) => {
        const form = await request.formData();
        const product = form.get('product') as Blob;
        const image = form.get('image') as File;
        received.type = product.type;
        received.product = JSON.parse(await product.text());
        received.imageType = image.type;
        received.imageSize = image.size;
        received.contentType = request.headers.get('content-type');
        return HttpResponse.json(buildProductResponse({ id: 15, name: 'Mug' }), {
          status: 201,
          headers: { Location: `${PRODUCTS_URL}/15` },
        });
      }),
    );

    const created = await productsService.create(NEW_PRODUCT, new File(['abc'], 'mug.jpg', { type: 'image/jpeg' }));

    expect(received.type).toBe('application/json');
    expect(received.product).toEqual(NEW_PRODUCT);
    expect(received.imageType).toBe('image/jpeg');
    expect(received.imageSize).toBe(3);
    expect(received.contentType).toContain('multipart/form-data');
    expect(created.id).toBe(15);
    expect(created.imageUrl).toBe(`${API_URL}/api/product/v1/15/image`);
  });

  it('omits the image part when there is no file', async () => {
    let hasImage: boolean | undefined;
    server.use(
      http.post(PRODUCTS_URL, async ({ request }) => {
        hasImage = (await request.formData()).has('image');
        return HttpResponse.json(buildProductResponse({ id: 16, imageUrl: null }), { status: 201 });
      }),
    );

    const created = await productsService.create(NEW_PRODUCT, null);

    expect(hasImage).toBe(false);
    expect(created.imageUrl).toBeNull();
  });

  it('exposes the per-field errors of a 400', async () => {
    server.use(
      http.post(PRODUCTS_URL, () =>
        HttpResponse.json(
          { detail: 'Validation failed', errors: { name: 'must not be blank', image: 'Unsupported image type' } },
          { status: 400 },
        ),
      ),
    );

    const error = (await productsService.create(NEW_PRODUCT).catch((cause) => cause)) as ApiError;

    expect(error.status).toBe(400);
    expect(error.fields).toEqual({ name: 'must not be blank', image: 'Unsupported image type' });
  });
});

describe('productsService.update', () => {
  it('puts a multipart request with the id inside the product part', async () => {
    const received: { method?: string; product?: unknown; hasImage?: boolean } = {};
    server.use(
      http.put(PRODUCTS_URL, async ({ request }) => {
        const form = await request.formData();
        received.method = request.method;
        received.product = JSON.parse(await (form.get('product') as Blob).text());
        received.hasImage = form.has('image');
        return HttpResponse.json(buildProductResponse({ id: 3, name: 'Edited' }));
      }),
    );

    const updated = await productsService.update({ ...NEW_PRODUCT, id: 3, name: 'Edited' });

    expect(received.method).toBe('PUT');
    expect(received.product).toEqual({ ...NEW_PRODUCT, id: 3, name: 'Edited' });
    expect(received.hasImage).toBe(false);
    expect(updated.name).toBe('Edited');
  });

  it('sends the replacement image when there is one', async () => {
    let imageType: string | undefined;
    server.use(
      http.put(PRODUCTS_URL, async ({ request }) => {
        imageType = ((await request.formData()).get('image') as File).type;
        return HttpResponse.json(buildProductResponse({ id: 3 }));
      }),
    );

    await productsService.update({ ...NEW_PRODUCT, id: 3 }, new File(['x'], 'new.jpg', { type: 'image/jpeg' }));

    expect(imageType).toBe('image/jpeg');
  });

  it('rejects with a 404 when the product no longer exists', async () => {
    server.use(http.put(PRODUCTS_URL, () => HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 })));

    const error = (await productsService.update({ ...NEW_PRODUCT, id: 99 }).catch((cause) => cause)) as ApiError;

    expect(error.status).toBe(404);
  });
});

describe('productsService.remove', () => {
  it('sends a DELETE and resolves with nothing on 204', async () => {
    let method: string | undefined;
    server.use(
      http.delete(`${PRODUCTS_URL}/4`, ({ request }) => {
        method = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(productsService.remove(4)).resolves.toBeUndefined();
    expect(method).toBe('DELETE');
  });

  it('rejects with a 404 for an unknown product', async () => {
    server.use(http.delete(`${PRODUCTS_URL}/99`, () => HttpResponse.json({ message: 'No records found' }, { status: 404 })));

    const error = (await productsService.remove(99).catch((cause) => cause)) as ApiError;

    expect(error.status).toBe(404);
  });
});
