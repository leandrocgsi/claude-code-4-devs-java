import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { PRODUCTS_URL, buildProductResponse } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import { PLACEHOLDER_IMAGE } from '@/components/ui/atoms/ProductImage';
import ProductDetail from '../ProductDetail';

function serve(overrides: Parameters<typeof buildProductResponse>[0] = {}) {
  server.use(http.get(`${PRODUCTS_URL}/1`, () => HttpResponse.json(buildProductResponse({ id: 1, name: 'Black Mug', ...overrides }))));
}

describe('ProductDetail', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('shows the loading state first', () => {
    serve();

    renderWithProviders(<ProductDetail id={1} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading product');
  });

  it('shows the product', async () => {
    serve({ description: 'Hot coffee', category: 'Mug', price: 25, oldPrice: 30, quantity: 4, color: 'Black', size: 'M' });

    renderWithProviders(<ProductDetail id={1} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Black Mug' })).toBeInTheDocument();
    expect(screen.getByText('Hot coffee')).toBeInTheDocument();
    expect(screen.getByText('Mug')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?25,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?30,00/)).toBeInTheDocument();
    expect(screen.getByText('4 in stock')).toBeInTheDocument();
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: /Loading/ })).not.toBeInTheDocument();
  });

  it('omits color and size when the product has none', async () => {
    serve({ color: null, size: null });

    renderWithProviders(<ProductDetail id={1} />);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
    expect(screen.queryByText('Size')).not.toBeInTheDocument();
  });

  it('omits the stars when the product has no rating', async () => {
    serve({ rating: null });

    renderWithProviders(<ProductDetail id={1} />);

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByLabelText(/Rated/)).not.toBeInTheDocument();
  });

  it('shows the stars when the product has a rating', async () => {
    serve({ rating: 4.5, reviewCount: 8 });

    renderWithProviders(<ProductDetail id={1} />);

    expect(await screen.findByLabelText('Rated 4.5 out of 5')).toBeInTheDocument();
  });

  it('shows the placeholder when the product has no image', async () => {
    serve({ imageUrl: null });

    renderWithProviders(<ProductDetail id={1} />);

    expect(await screen.findByAltText('Black Mug')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('shows the not found state for a product that does not exist', async () => {
    renderWithProviders(<ProductDetail id={99} />);

    expect(await screen.findByText('Product not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the shop' })).toHaveAttribute('href', '/products');
  });

  it.each([0, -3, Number.NaN])('shows the not found state without calling the API for the id %s', async (id) => {
    let calls = 0;
    server.use(
      http.get(`${PRODUCTS_URL}/:id`, () => {
        calls += 1;
        return HttpResponse.json(buildProductResponse());
      }),
    );

    renderWithProviders(<ProductDetail id={id} />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Product not found')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('shows the error state and recovers when the user tries again', async () => {
    let fail = true;
    server.use(
      http.get(`${PRODUCTS_URL}/1`, () =>
        fail ? HttpResponse.json({ message: 'The server is down.' }, { status: 500 }) : HttpResponse.json(buildProductResponse({ id: 1, name: 'Black Mug' })),
      ),
    );

    renderWithProviders(<ProductDetail id={1} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server is down.');
    expect(screen.queryByText('Product not found')).not.toBeInTheDocument();

    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Black Mug' })).toBeInTheDocument();
  });

  it('adds the chosen quantity to the cart and confirms', async () => {
    serve({ quantity: 10 });
    renderWithProviders(<ProductDetail id={1} />);
    await screen.findByRole('heading', { level: 1 });

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().quantities).toEqual({ 1: 3 });
    expect(screen.getByRole('status')).toHaveTextContent('Added to your cart.');
    expect(screen.getByRole('link', { name: 'View cart' })).toHaveAttribute('href', '/cart');
  });

  it('does not let the quantity go above the stock', async () => {
    serve({ quantity: 2 });
    renderWithProviders(<ProductDetail id={1} />);
    await screen.findByRole('heading', { level: 1 });

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('does not confirm anything before adding', async () => {
    serve();
    renderWithProviders(<ProductDetail id={1} />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByText(/Added to your cart/)).not.toBeInTheDocument();
  });

  it('marks a sold out product, hides the stepper and disables the button', async () => {
    serve({ quantity: 0 });
    renderWithProviders(<ProductDetail id={1} />);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getAllByText('Out of stock').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Increase quantity' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Out of stock' }));
    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('puts the product name in the breadcrumb', async () => {
    serve();
    renderWithProviders(<ProductDetail id={1} />);

    await waitFor(() => expect(screen.getAllByText('Black Mug').length).toBeGreaterThanOrEqual(2));
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/products');
  });
});
