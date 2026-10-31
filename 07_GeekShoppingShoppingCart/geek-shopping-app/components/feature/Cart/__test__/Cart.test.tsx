import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { CART_URL, buildCartItemResponse, buildCartResponse } from '@/test/fixtures';
import { serveCart } from '@/test/msw/serveCart';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartTokenStore } from '@/app/store/modules/cart/useCartTokenStore';
import { useToastStore } from '@/app/store/modules/global/useToastStore';
import Cart from '../Cart';

describe('Cart', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartTokenStore.setState({ token: null });
    useToastStore.setState({ toasts: [] });
  });

  it('shows the loading state while the cart is fetched', () => {
    serveCart([buildCartItemResponse({ id: 1 })]);

    renderWithProviders(<Cart />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your cart');
  });

  it('shows the empty cart with a link to the shop', async () => {
    serveCart();

    renderWithProviders(<Cart />);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the lines and the totals computed by the server', async () => {
    serveCart([
      buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 2, color: 'Black', size: 'M' }),
      buildCartItemResponse({ id: 2, name: 'Space Book', unitPrice: 40, quantity: 1 }),
    ]);

    renderWithProviders(<Cart />);

    const mugRow = (await screen.findByText('Black Mug')).closest('tr') as HTMLElement;
    expect(within(mugRow).getByText(/R\$\s?25,00/)).toBeInTheDocument();
    expect(within(mugRow).getByText(/R\$\s?50,00/)).toBeInTheDocument();
    expect(within(mugRow).getByText('2')).toBeInTheDocument();
    expect(within(mugRow).getByText('Black / M')).toBeInTheDocument();
    const bookRow = screen.getByText('Space Book').closest('tr') as HTMLElement;
    expect(within(bookRow).queryByText(/\//)).not.toBeInTheDocument();

    const summary = screen.getByText('Subtotal').closest('div') as HTMLElement;
    expect(within(summary).getByText(/R\$\s?90,00/)).toBeInTheDocument();
    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?10,00/);
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?100,00/);
    expect(screen.getByRole('link', { name: 'Proceed To Checkout' })).toHaveAttribute('href', '/checkout');
  });

  it('shows the shipping between the subtotal and the total and has no coupon', async () => {
    serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' })]);

    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    const labels = ['Subtotal', 'Shipping', 'Total'].map((label) => screen.getByText(label, { selector: 'span' }));
    const rows = labels.map((label) => label.closest('div') as HTMLElement);
    expect(rows[0].compareDocumentPosition(rows[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rows[1].compareDocumentPosition(rows[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByPlaceholderText('Coupon Code')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply Coupon' })).not.toBeInTheDocument();
  });

  it('shows the shipping and the total of the server even when the total differs from the local sum', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json({
          items: [buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 1 })],
          itemCount: 1,
          subtotal: 25,
          shipping: 12.34,
          total: 99.99,
        }),
      ),
    );

    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?12,34/);
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?99,99/);
  });

  it('shows the shipping as zero when the server charges none', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json(buildCartResponse([buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 1 })], 0)),
      ),
    );

    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?0,00/);
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?25,00/);
  });

  it('shows the new shipping and total after the quantity of a line changes', async () => {
    let shipping = 10;
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json(buildCartResponse([buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: shipping === 10 ? 1 : 2 })], shipping)),
      ),
      http.put(`${CART_URL}/items/1`, () => {
        shipping = 15;
        return HttpResponse.json(buildCartResponse([buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 2 })], shipping));
      }),
    );
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?35,00/);

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

    await waitFor(() =>
      expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?65,00/),
    );
    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?15,00/);
  });

  it('shows no summary and no shipping while loading, when empty and on error', async () => {
    serveCart();
    const { unmount } = renderWithProviders(<Cart />);
    expect(screen.queryByText('Shipping')).not.toBeInTheDocument();
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByText('Shipping')).not.toBeInTheDocument();
    expect(screen.queryByText('Cart Summary')).not.toBeInTheDocument();
    unmount();

    server.use(http.get(CART_URL, () => HttpResponse.json({ message: 'down' }, { status: 500 })));
    renderWithProviders(<Cart />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your cart.');
    expect(screen.queryByText('Shipping')).not.toBeInTheDocument();
    expect(screen.queryByText('Cart Summary')).not.toBeInTheDocument();
  });

  it('increases and decreases the quantity of a line through the API', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 2 })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    const row = screen.getByText('Black Mug').closest('tr') as HTMLElement;
    await waitFor(() => expect(within(row).getByText(/R\$\s?75,00/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    await waitFor(() => expect(within(row).getByText(/R\$\s?50,00/)).toBeInTheDocument());

    expect(cart.writes().map((call) => [call.method, call.path, call.body])).toEqual([
      ['PUT', '/api/cart/v1/items/1', { quantity: 3 }],
      ['PUT', '/api/cart/v1/items/1', { quantity: 2 }],
    ]);
  });

  it('disables increase when the line reaches the stock', async () => {
    serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug', quantity: 2, stock: 2 })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('disables decrease at one unit so the line is removed with the remove button', async () => {
    serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug', quantity: 1 })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
  });

  it('shows inline the error of the API when the quantity is refused', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json({ items: [buildCartItemResponse({ id: 1, name: 'Black Mug', quantity: 1, stock: 5 })], itemCount: 1, subtotal: 25, total: 25 }),
      ),
      http.put(`${CART_URL}/items/1`, () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Bad Request', status: 400, detail: 'Validation failed', errors: { quantity: 'Only 1 units are available' } },
          { status: 400 },
        ),
      ),
    );
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only 1 units are available');
    expect(screen.getByText('Black Mug')).toBeInTheDocument();
  });

  it('removes a line with the remove button', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' }), buildCartItemResponse({ id: 2, name: 'Space Book' })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Black Mug' }));

    await waitFor(() => expect(screen.queryByText('Black Mug')).not.toBeInTheDocument());
    expect(screen.getByText('Space Book')).toBeInTheDocument();
    expect(cart.writes()).toMatchObject([{ method: 'DELETE', path: '/api/cart/v1/items/1' }]);
  });

  it('shows the empty cart after the last line is removed', async () => {
    serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Black Mug' }));

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('clears the whole cart', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' }), buildCartItemResponse({ id: 2, name: 'Space Book' })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Clear cart' }));

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(cart.writes()).toMatchObject([{ method: 'DELETE', path: '/api/cart/v1' }]);
  });

  it('tells the user when removing a line fails', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json({ items: [buildCartItemResponse({ id: 1, name: 'Black Mug' })], itemCount: 1, subtotal: 25, total: 25 }),
      ),
      http.delete(`${CART_URL}/items/1`, () => HttpResponse.json({ message: 'down' }, { status: 500 })),
    );
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Black Mug' }));

    await waitFor(() => expect(useToastStore.getState().toasts).toHaveLength(1));
    expect(useToastStore.getState().toasts[0]).toMatchObject({ tone: 'error', message: 'down' });
    expect(screen.getByText('Black Mug')).toBeInTheDocument();
  });

  it('sends the token of the browser in every request', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' })]);
    renderWithProviders(<Cart />);
    await screen.findByText('Black Mug');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Black Mug' }));
    await waitFor(() => expect(cart.writes()).toHaveLength(1));

    const token = useCartTokenStore.getState().token;
    expect(token).not.toBeNull();
    expect(cart.calls.every((call) => call.token === token)).toBe(true);
  });

  it('shows the error state and recovers when the user tries again', async () => {
    let fail = true;
    server.use(
      http.get(CART_URL, () =>
        fail
          ? HttpResponse.json({ message: 'down' }, { status: 500 })
          : HttpResponse.json({ items: [buildCartItemResponse({ id: 1, name: 'Black Mug' })], itemCount: 1, subtotal: 25, total: 25 }),
      ),
    );
    renderWithProviders(<Cart />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your cart.');
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();

    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Black Mug')).toBeInTheDocument();
  });
});
