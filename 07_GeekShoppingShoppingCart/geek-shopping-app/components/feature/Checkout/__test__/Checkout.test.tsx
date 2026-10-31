import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { CART_URL, buildCartItemResponse } from '@/test/fixtures';
import { serveCart } from '@/test/msw/serveCart';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartTokenStore } from '@/app/store/modules/cart/useCartTokenStore';
import { useToastStore } from '@/app/store/modules/global/useToastStore';
import Checkout from '../Checkout';

function placeOrder() {
  const form = screen.getByRole('button', { name: 'Place Order' }).closest('form') as HTMLFormElement;
  fireEvent.submit(form);
}

describe('Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartTokenStore.setState({ token: null });
    useToastStore.setState({ toasts: [] });
  });

  it('shows the loading state while the cart is fetched', () => {
    serveCart([buildCartItemResponse({ id: 1 })]);

    renderWithProviders(<Checkout />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your cart');
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
  });

  it('shows the empty cart with a link to the shop', async () => {
    serveCart();

    renderWithProviders(<Checkout />);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Shop' })).toHaveAttribute('href', '/products');
    expect(screen.queryByRole('button', { name: 'Place Order' })).not.toBeInTheDocument();
    expect(screen.queryByText('Shipping')).not.toBeInTheDocument();
  });

  it('summarizes the lines of the cart with the shipping and the total of the server', async () => {
    serveCart([
      buildCartItemResponse({ id: 1, name: 'Black Mug', unitPrice: 25, quantity: 2 }),
      buildCartItemResponse({ id: 2, name: 'Space Book', unitPrice: 40, quantity: 1 }),
    ]);

    renderWithProviders(<Checkout />);

    const mugRow = (await screen.findByText('Black Mug × 2')).closest('div') as HTMLElement;
    expect(within(mugRow).getByText(/R\$\s?50,00/)).toBeInTheDocument();
    const bookRow = screen.getByText('Space Book × 1').closest('div') as HTMLElement;
    expect(within(bookRow).getByText(/R\$\s?40,00/)).toBeInTheDocument();
    expect(screen.getByText('Subtotal').closest('div')).toHaveTextContent(/R\$\s?90,00/);
    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?10,00/);
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?100,00/);
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

    renderWithProviders(<Checkout />);
    await screen.findByText('Black Mug × 1');

    expect(screen.getByText('Shipping').closest('div')).toHaveTextContent(/R\$\s?12,34/);
    expect(screen.getByText('Total', { selector: 'span' }).closest('div')).toHaveTextContent(/R\$\s?99,99/);
  });

  it('shows the error state of the cart as an empty checkout instead of crashing', async () => {
    server.use(http.get(CART_URL, () => HttpResponse.json({ message: 'down' }, { status: 500 })));

    renderWithProviders(<Checkout />);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('reveals the shipping address fields when asked to ship to a different address', async () => {
    serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' })]);
    renderWithProviders(<Checkout />);
    await screen.findByText('Black Mug × 1');
    expect(screen.queryByRole('heading', { name: 'Shipping Address' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Ship to different address'));

    expect(screen.getByRole('heading', { name: 'Shipping Address' })).toBeInTheDocument();
  });

  it('places the demo order by clearing the cart on the server', async () => {
    const cart = serveCart([buildCartItemResponse({ id: 1, name: 'Black Mug' })]);
    renderWithProviders(<Checkout />);
    await screen.findByText('Black Mug × 1');

    placeOrder();

    expect(await screen.findByText('Order placed!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products');
    await waitFor(() => expect(cart.writes()).toHaveLength(1));
    expect(cart.writes()[0]).toMatchObject({ method: 'DELETE', path: '/api/cart/v1' });
    expect(cart.items()).toEqual([]);
  });

  it('tells the user when clearing the cart fails after the demo order', async () => {
    server.use(
      http.get(CART_URL, () =>
        HttpResponse.json({ items: [buildCartItemResponse({ id: 1, name: 'Black Mug' })], itemCount: 1, subtotal: 25, total: 25 }),
      ),
      http.delete(CART_URL, () => HttpResponse.json({ message: 'down' }, { status: 500 })),
    );
    renderWithProviders(<Checkout />);
    await screen.findByText('Black Mug × 1');

    placeOrder();

    await waitFor(() => expect(useToastStore.getState().toasts).toHaveLength(1));
    expect(useToastStore.getState().toasts[0]).toMatchObject({ tone: 'error', message: 'down' });
  });
});
