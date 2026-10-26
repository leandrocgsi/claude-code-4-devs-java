import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { PRODUCTS_URL, buildProductResponse, halPage } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PLACEHOLDER_IMAGE } from '@/components/ui/atoms/ProductImage';
import AdminProducts from '../AdminProducts';

const catalog = [
  buildProductResponse({ id: 1, name: 'Black Mug', category: 'Mug', price: 25, quantity: 10, featured: true }),
  buildProductResponse({ id: 3, name: 'Sold Out Hoodie', category: 'Hoodie', price: 150, quantity: 0, imageUrl: null }),
];

function serveList(items = catalog, options = {}) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(PRODUCTS_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(halPage(items, options));
    }),
  );
  return requests;
}

function rowOf(name: string) {
  return screen.getByText(name).closest('tr') as HTMLElement;
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Poster' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A poster' } });
  fireEvent.change(screen.getByLabelText('Price'), { target: { value: '19.9' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Poster' } });
  fireEvent.change(screen.getByLabelText('Quantity in stock'), { target: { value: '5' } });
}

describe('AdminProducts', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:preview') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  });

  describe('list', () => {
    it('shows the loading state first', () => {
      renderWithProviders(<AdminProducts />);

      expect(screen.getByRole('status')).toHaveTextContent('Loading products');
    });

    it('asks for the newest products first, ten per page', async () => {
      const requests = serveList();

      renderWithProviders(<AdminProducts />);

      await screen.findByText('Black Mug');
      expect(requests[0].get('size')).toBe('10');
      expect(requests[0].get('sortBy')).toBe('createdAt');
      expect(requests[0].get('direction')).toBe('desc');
      expect(requests[0].get('page')).toBe('0');
    });

    it('shows a row per product with name, category, price, stock and featured flag', async () => {
      serveList();

      renderWithProviders(<AdminProducts />);

      const mug = await screen.findByText('Black Mug').then(() => rowOf('Black Mug'));
      expect(within(mug).getByText('Mug')).toBeInTheDocument();
      expect(within(mug).getByText(/R\$\s?25,00/)).toBeInTheDocument();
      expect(within(mug).getByText('10')).toBeInTheDocument();
      expect(within(mug).getByText('Yes')).toBeInTheDocument();
      const hoodie = rowOf('Sold Out Hoodie');
      expect(within(hoodie).getByText('Out of stock')).toBeInTheDocument();
      expect(within(hoodie).getByText('—')).toBeInTheDocument();
    });

    it('shows a thumbnail from the API and the placeholder when there is no image', async () => {
      serveList();

      renderWithProviders(<AdminProducts />);

      await screen.findByText('Black Mug');
      expect(within(rowOf('Black Mug')).getByAltText('Black Mug')).toHaveAttribute('src', 'http://api.test/api/product/v1/1/image');
      expect(within(rowOf('Sold Out Hoodie')).getByAltText('Sold Out Hoodie')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
    });

    it('shows the empty state with a way to create the first product', async () => {
      serveList([]);

      renderWithProviders(<AdminProducts />);

      expect(await screen.findByText('No products yet')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'New product' })).toHaveLength(2);
    });

    it('shows the error state and recovers when the user tries again', async () => {
      let fail = true;
      server.use(
        http.get(PRODUCTS_URL, () =>
          fail ? HttpResponse.json({ message: 'The server is down.' }, { status: 500 }) : HttpResponse.json(halPage(catalog)),
        ),
      );

      renderWithProviders(<AdminProducts />);

      expect(await screen.findByRole('alert')).toHaveTextContent('The server is down.');
      fail = false;
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByText('Black Mug')).toBeInTheDocument();
    });

    it('paginates', async () => {
      const requests = serveList(catalog, { number: 0, size: 10, totalElements: 25, totalPages: 3 });
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      await waitFor(() => expect(requests.at(-1)?.get('page')).toBe('1'));
    });
  });

  describe('create (AC-14)', () => {
    it('opens the form in a modal and closes it with Cancel', async () => {
      serveList();
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      const dialog = screen.getByRole('dialog', { name: 'New product' });
      expect(within(dialog).getByRole('button', { name: 'Create product' })).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('sends the product and the image as multipart, then closes, reloads the first page and confirms', async () => {
      const requests = serveList();
      let received: { product?: unknown; imageType?: string; imageSize?: number } = {};
      server.use(
        http.post(PRODUCTS_URL, async ({ request }) => {
          const form = await request.formData();
          const image = form.get('image') as File;
          received = {
            product: JSON.parse(await (form.get('product') as Blob).text()),
            imageType: image.type,
            imageSize: image.size,
          };
          return HttpResponse.json(buildProductResponse({ id: 20, name: 'New Poster' }), { status: 201 });
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      fillValidForm();
      fireEvent.change(screen.getByLabelText('Product image'), {
        target: { files: [new File([new Uint8Array(7)], 'poster.jpg', { type: 'image/jpeg' })] },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

      expect(await screen.findByText('Product created.')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(received.product).toEqual({
        name: 'New Poster',
        description: 'A poster',
        price: 19.9,
        oldPrice: null,
        category: 'Poster',
        quantity: 5,
        color: null,
        size: null,
        featured: false,
      });
      expect(received.imageType).toBe('image/jpeg');
      expect(received.imageSize).toBe(7);
      await waitFor(() => expect(requests.length).toBeGreaterThanOrEqual(2));
    });

    it('creates a product without an image', async () => {
      serveList();
      let hasImage: boolean | undefined;
      server.use(
        http.post(PRODUCTS_URL, async ({ request }) => {
          hasImage = (await request.formData()).has('image');
          return HttpResponse.json(buildProductResponse({ id: 21, imageUrl: null }), { status: 201 });
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

      expect(await screen.findByText('Product created.')).toBeInTheDocument();
      expect(hasImage).toBe(false);
    });

    it('does not call the API when the form is invalid', async () => {
      serveList();
      let posts = 0;
      server.use(
        http.post(PRODUCTS_URL, () => {
          posts += 1;
          return HttpResponse.json(buildProductResponse(), { status: 201 });
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

      expect(screen.getByText('The name is required.')).toBeInTheDocument();
      expect(posts).toBe(0);
    });

    it('keeps the form open and shows the errors by field when the server answers 400', async () => {
      serveList();
      server.use(
        http.post(PRODUCTS_URL, () =>
          HttpResponse.json(
            { detail: 'Validation failed', errors: { name: 'a product with this name already exists', image: 'The image must be at most 5 MB.' } },
            { status: 400 },
          ),
        ),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

      expect(await screen.findByText('a product with this name already exists')).toBeInTheDocument();
      expect(screen.getByText('The image must be at most 5 MB.')).toBeInTheDocument();
      expect(screen.getByText('Please fix the highlighted fields.')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'New product' })).toBeInTheDocument();
      expect(screen.queryByText('Product created.')).not.toBeInTheDocument();
    });

    it('shows the server message when the error has no fields', async () => {
      serveList();
      server.use(http.post(PRODUCTS_URL, () => HttpResponse.json({ message: 'Unexpected failure while saving.' }, { status: 500 })));
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

      expect(await screen.findByText('Unexpected failure while saving.')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('forgets the previous error when the form is opened again', async () => {
      serveList();
      server.use(http.post(PRODUCTS_URL, () => HttpResponse.json({ message: 'Unexpected failure while saving.' }, { status: 500 })));
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');
      fireEvent.click(screen.getByRole('button', { name: 'New product' }));
      fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: 'Create product' }));
      await screen.findByText('Unexpected failure while saving.');

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      fireEvent.click(screen.getByRole('button', { name: 'New product' }));

      expect(screen.queryByText('Unexpected failure while saving.')).not.toBeInTheDocument();
    });
  });

  describe('edit', () => {
    it('opens the form filled with the product', async () => {
      serveList();
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Edit' }));

      const dialog = screen.getByRole('dialog', { name: 'Edit product' });
      expect(within(dialog).getByLabelText('Name')).toHaveValue('Black Mug');
      expect(within(dialog).getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('puts the product id in the product part and keeps the image when none is chosen', async () => {
      serveList();
      let received: { method?: string; product?: Record<string, unknown>; hasImage?: boolean } = {};
      server.use(
        http.put(PRODUCTS_URL, async ({ request }) => {
          const form = await request.formData();
          received = {
            method: request.method,
            product: JSON.parse(await (form.get('product') as Blob).text()),
            hasImage: form.has('image'),
          };
          return HttpResponse.json(buildProductResponse({ id: 1, name: 'Renamed Mug' }));
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Edit' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed Mug' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('Product updated.')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(received.method).toBe('PUT');
      expect(received.product).toMatchObject({ id: 1, name: 'Renamed Mug' });
      expect(received.hasImage).toBe(false);
    });

    it('sends the new image when one is chosen', async () => {
      serveList();
      let imageType: string | undefined;
      server.use(
        http.put(PRODUCTS_URL, async ({ request }) => {
          imageType = ((await request.formData()).get('image') as File).type;
          return HttpResponse.json(buildProductResponse({ id: 1 }));
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Edit' }));
      fireEvent.change(screen.getByLabelText('Product image'), { target: { files: [new File(['x'], 'n.png', { type: 'image/png' })] } });
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      await screen.findByText('Product updated.');
      expect(imageType).toBe('image/png');
    });

    it('shows the 404 message when the product no longer exists', async () => {
      serveList();
      server.use(http.put(PRODUCTS_URL, () => HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 })));
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Edit' }));
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('No records found for this ID!')).toBeInTheDocument();
    });
  });

  describe('delete', () => {
    it('asks for confirmation naming the product, and cancelling deletes nothing', async () => {
      serveList();
      let deletes = 0;
      server.use(
        http.delete(`${PRODUCTS_URL}/:id`, () => {
          deletes += 1;
          return new HttpResponse(null, { status: 204 });
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Delete' }));
      const dialog = screen.getByRole('dialog', { name: 'Delete product' });
      expect(dialog).toHaveTextContent('Delete Black Mug? This cannot be undone.');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(deletes).toBe(0);
    });

    it('deletes the product, closes the dialog and confirms', async () => {
      serveList();
      let deleted: string | undefined;
      server.use(
        http.delete(`${PRODUCTS_URL}/:id`, ({ params }) => {
          deleted = String(params.id);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Delete' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

      expect(await screen.findByText('Product deleted.')).toBeInTheDocument();
      expect(deleted).toBe('1');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps the dialog open and shows the error when the deletion fails', async () => {
      serveList();
      server.use(http.delete(`${PRODUCTS_URL}/:id`, () => HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 })));
      renderWithProviders(<AdminProducts />);
      await screen.findByText('Black Mug');

      fireEvent.click(within(rowOf('Black Mug')).getByRole('button', { name: 'Delete' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

      expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('No records found for this ID!');
      expect(screen.queryByText('Product deleted.')).not.toBeInTheDocument();
    });
  });
});
