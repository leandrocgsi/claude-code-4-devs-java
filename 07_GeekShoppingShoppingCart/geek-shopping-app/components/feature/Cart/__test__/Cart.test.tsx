import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { PRODUCTS_URL, buildProductResponse } from '@/test/fixtures';
import { serveProductsById } from '@/test/msw/serveProductsById';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import Cart from '../Cart';

describe('Cart', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('shows the empty cart without calling the API (RN-19)', async () => {
    const requested = serveProductsById([]);

    renderWithProviders(<Cart />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products');
    expect(requested).toEqual([]);
  });

  it('shows the loading state while the products are resolved', () => {
    serveProductsById([buildProductResponse({ id: 1 })]);
    useCartStore.setState({ quantities: { 1: 1 } });

    renderWithProviders(<Cart />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your cart');
  });

  it('resolves each line through the API and shows the totals', async () => {
    const requested = serveProductsById([
      buildProductResponse({ id: 1, name: 'Black Mug', price: 25, quantity: 10 }),
      buildProductResponse({ id: 2, name: 'Space Book', price: 40, quantity: 10 }),
    ]);
    useCartStore.setState({ quantities: { 1: 2, 2: 1 } });

    renderWithProviders(<Cart />);

    const mugRow = (await screen.findByText('Black Mug')).closest('tr') as HTMLElement;
    expect(within(mugRow).getByText(/R\$\s?25,00/)).toBeInTheDocument();
    expect(within(mugRow).getByText(/R\$\s?50,00/)).toBeInTheDocument();
    expect(within(mugRow).getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Space Book')).toBeInTheDocument();
    expect([...new Set(requested)].sort()).toEqual([1, 2]);

    const summary = screen.getByText('Subtotal').closest('div') as HTMLElement;
    expect(within(summary).getByText(/R\$\s?90,00/)).toBeInTheDocument();
    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?10,00/);
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?100,00/);
    expect(screen.getByRole('link', { name: 'Proceed To Checkout' })).toHaveAttribute('href', '/checkout');
  });

  it('increases and decreases the quantity of a line', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug', price: 25, quantity: 10 })]);
    useCartStore.setState({ quantities: { 1: 2 } });
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(useCartStore.getState().quantities).toEqual({ 1: 3 });
    const row = screen.getByText('Black Mug').closest('tr') as HTMLElement;
    await waitFor(() => expect(within(row).getByText(/R\$\s?75,00/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(useCartStore.getState().quantities).toEqual({ 1: 2 });
  });

  it('removes the line when the quantity goes down to zero', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug', quantity: 10 })]);
    useCartStore.setState({ quantities: { 1: 1 } });
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));

    expect(useCartStore.getState().quantities).toEqual({});
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('disables increase when the line reaches the stock', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug', quantity: 2 })]);
    useCartStore.setState({ quantities: { 1: 5 } });
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
    expect(within(screen.getByText('Black Mug').closest('tr') as HTMLElement).getByText('2')).toBeInTheDocument();
  });

  it('removes a line with the remove button', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug' }), buildProductResponse({ id: 2, name: 'Space Book' })]);
    useCartStore.setState({ quantities: { 1: 1, 2: 1 } });
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Black Mug' }));

    expect(useCartStore.getState().quantities).toEqual({ 2: 1 });
    await waitFor(() => expect(screen.queryByText('Black Mug')).not.toBeInTheDocument());
    expect(screen.getByText('Space Book')).toBeInTheDocument();
  });

  it('drops from the cart a product that was removed from the catalog', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug' })]);
    useCartStore.setState({ quantities: { 1: 1, 99: 1 } });

    renderWithProviders(<Cart />);

    await screen.findByText('Black Mug');
    await waitFor(() => expect(useCartStore.getState().quantities).toEqual({ 1: 1 }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error state and recovers when the user tries again', async () => {
    let fail = true;
    server.use(
      http.get(`${PRODUCTS_URL}/1`, () =>
        fail ? HttpResponse.json({ message: 'down' }, { status: 500 }) : HttpResponse.json(buildProductResponse({ id: 1, name: 'Black Mug' })),
      ),
    );
    useCartStore.setState({ quantities: { 1: 1 } });
    renderWithProviders(<Cart />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load some products of your cart.');
    expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument();

    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Black Mug')).toBeInTheDocument();
  });

  it('says coupons are not available yet when one is applied', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug' })]);
    useCartStore.setState({ quantities: { 1: 1 } });
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.change(screen.getByPlaceholderText('Coupon Code'), { target: { value: 'SAVE10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Coupon' }));

    expect(screen.getByText('Coupons are not available yet.')).toBeInTheDocument();
  });

  it('ignores an empty coupon', async () => {
    serveProductsById([buildProductResponse({ id: 1, name: 'Black Mug' })]);
    useCartStore.setState({ quantities: { 1: 1 } });
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Apply Coupon' }));

    expect(screen.queryByText('Coupons are not available yet.')).not.toBeInTheDocument();
  });
});
