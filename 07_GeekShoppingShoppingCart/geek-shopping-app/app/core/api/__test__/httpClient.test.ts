import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { API_URL } from '@/test/fixtures';
import { useCartTokenStore } from '@/app/store/modules/cart/useCartTokenStore';
import { ApiError, api } from '../httpClient';

async function failure(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('The request was expected to fail.');
}

describe('httpClient error normalization', () => {
  it('reads the message of an ExceptionResponse', async () => {
    server.use(
      http.get(`${API_URL}/boom`, () =>
        HttpResponse.json(
          { timestamp: '2026-10-25T10:00:00', message: 'No records found for this ID!', details: 'uri=/boom' },
          { status: 404 },
        ),
      ),
    );

    const error = await failure(api.get('/boom'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('No records found for this ID!');
    expect(error.fields).toBeUndefined();
  });

  it('reads the detail and the per-field errors of a ProblemDetail', async () => {
    server.use(
      http.post(`${API_URL}/boom`, () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Bad Request',
            status: 400,
            detail: 'Validation failed',
            errors: { name: 'must not be blank', price: 'must be greater than 0' },
          },
          { status: 400 },
        ),
      ),
    );

    const error = await failure(api.post('/boom', {}));

    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.fields).toEqual({ name: 'must not be blank', price: 'must be greater than 0' });
  });

  it('prefers the message over the detail when both exist', async () => {
    server.use(
      http.get(`${API_URL}/boom`, () => HttpResponse.json({ message: 'From message', detail: 'From detail' }, { status: 400 })),
    );

    const error = await failure(api.get('/boom'));

    expect(error.message).toBe('From message');
  });

  it('keeps the field errors of an image problem', async () => {
    server.use(
      http.post(`${API_URL}/boom`, () =>
        HttpResponse.json({ detail: 'Invalid image', errors: { image: 'The image must be at most 5 MB.' } }, { status: 400 }),
      ),
    );

    const error = await failure(api.post('/boom', {}));

    expect(error.fields).toEqual({ image: 'The image must be at most 5 MB.' });
  });

  it('falls back to a generic message when the body is not an error object', async () => {
    server.use(http.get(`${API_URL}/boom`, () => new HttpResponse('Internal Server Error', { status: 500 })));

    const error = await failure(api.get('/boom'));

    expect(error.status).toBe(500);
    expect(error.message).toBe('Unexpected server error.');
    expect(error.fields).toBeUndefined();
  });

  it('falls back to a generic message when the error body is empty', async () => {
    server.use(http.get(`${API_URL}/boom`, () => new HttpResponse(null, { status: 503 })));

    const error = await failure(api.get('/boom'));

    expect(error.status).toBe(503);
    expect(error.message).toBe('Unexpected server error.');
  });

  it('reports a connection problem with status 0 when there is no response', async () => {
    server.use(http.get(`${API_URL}/boom`, () => HttpResponse.error()));

    const error = await failure(api.get('/boom'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe('Could not connect to the server.');
  });

  it('lets successful responses through untouched', async () => {
    server.use(http.get(`${API_URL}/ok`, () => HttpResponse.json({ ok: true })));

    const response = await api.get('/ok');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
  });

  it('sends repeated query parameters without brackets', async () => {
    let url = '';
    server.use(
      http.get(`${API_URL}/echo`, ({ request }) => {
        url = request.url;
        return HttpResponse.json({});
      }),
    );

    await api.get('/echo', { params: { color: ['Black', 'White'], page: 0 } });

    expect(new URL(url).searchParams.getAll('color')).toEqual(['Black', 'White']);
    expect(url).not.toContain('[]');
  });
});

describe('httpClient cart token', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartTokenStore.setState({ token: null });
  });

  it('adds the cart token header to every cart request', async () => {
    let header: string | null = null;
    server.use(
      http.get(`${API_URL}/api/cart/v1`, ({ request }) => {
        header = request.headers.get('X-Cart-Token');
        return HttpResponse.json({});
      }),
    );

    await api.get('/api/cart/v1');

    expect(header).toBe(useCartTokenStore.getState().token);
    expect(header).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('adds the header to the item routes of the cart too', async () => {
    const headers: Array<string | null> = [];
    server.use(
      http.post(`${API_URL}/api/cart/v1/items`, ({ request }) => {
        headers.push(request.headers.get('X-Cart-Token'));
        return HttpResponse.json({});
      }),
      http.delete(`${API_URL}/api/cart/v1/items/3`, ({ request }) => {
        headers.push(request.headers.get('X-Cart-Token'));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await api.post('/api/cart/v1/items', {});
    await api.delete('/api/cart/v1/items/3');

    expect(headers[0]).not.toBeNull();
    expect(headers[1]).toBe(headers[0]);
  });

  it('reuses the same token on the next requests', async () => {
    const headers: Array<string | null> = [];
    server.use(
      http.get(`${API_URL}/api/cart/v1`, ({ request }) => {
        headers.push(request.headers.get('X-Cart-Token'));
        return HttpResponse.json({});
      }),
    );

    await api.get('/api/cart/v1');
    await api.get('/api/cart/v1');

    expect(headers[1]).toBe(headers[0]);
  });

  it('uses the token saved by a previous visit', async () => {
    useCartTokenStore.setState({ token: 'saved-token' });
    let header: string | null = null;
    server.use(
      http.get(`${API_URL}/api/cart/v1`, ({ request }) => {
        header = request.headers.get('X-Cart-Token');
        return HttpResponse.json({});
      }),
    );

    await api.get('/api/cart/v1');

    expect(header).toBe('saved-token');
  });

  it('does not send the cart token to other routes nor create one', async () => {
    let header: string | null = 'unset';
    server.use(
      http.get(`${API_URL}/api/product/v1`, ({ request }) => {
        header = request.headers.get('X-Cart-Token');
        return HttpResponse.json({});
      }),
    );

    await api.get('/api/product/v1');

    expect(header).toBeNull();
    expect(useCartTokenStore.getState().token).toBeNull();
  });
});
