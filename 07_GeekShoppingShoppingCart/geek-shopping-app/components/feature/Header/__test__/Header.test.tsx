import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { PRODUCTS_URL, buildCartItemResponse, buildProductResponse } from '@/test/fixtures';
import { serveCart } from '@/test/msw/serveCart';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartTokenStore } from '@/app/store/modules/cart/useCartTokenStore';
import { useWishlistStore } from '@/app/store/modules/global/useWishlistStore';
import { useAddToCart } from '@/hooks/useAddToCart/useAddToCart';
import Header from '../Header';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/products',
}));

describe('Header', () => {
  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
    useCartTokenStore.setState({ token: null });
    useWishlistStore.setState({ productIds: new Set() });
  });

  it('opens the categories menu with the categories of the API (RN-16)', async () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /Categories/ }));

    const mug = await screen.findByRole('link', { name: 'Mug' });
    expect(mug).toHaveAttribute('href', '/products?category=Mug');
    expect(screen.getByRole('link', { name: 'Book' })).toHaveAttribute('href', '/products?category=Book');
  });

  it('shows only the categories of the API, with nothing invented', async () => {
    server.use(http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json([{ name: 'Acessório', productCount: 1, imageUrl: null }])));
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /Categories/ }));

    expect(await screen.findByRole('link', { name: 'Acessório' })).toHaveAttribute('href', '/products?category=Acess%C3%B3rio');
    expect(screen.queryByRole('link', { name: 'Mug' })).not.toBeInTheDocument();
  });

  it('shows an empty menu when the categories cannot be loaded', async () => {
    let requested = false;
    server.use(
      http.get(`${PRODUCTS_URL}/categories`, () => {
        requested = true;
        return HttpResponse.json({ message: 'down' }, { status: 500 });
      }),
    );
    renderWithProviders(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /Categories/ }));

    await waitFor(() => expect(requested).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/products?category='))).toEqual([]);
    expect(screen.getByRole('button', { name: /Categories/ })).toBeInTheDocument();
  });

  it('closes the menu when a category is chosen', async () => {
    renderWithProviders(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /Categories/ }));

    fireEvent.click(await screen.findByRole('link', { name: 'Mug' }));

    expect(screen.queryByRole('link', { name: 'Mug' })).not.toBeInTheDocument();
  });

  it('keeps the menu closed until the toggle is clicked', () => {
    renderWithProviders(<Header />);

    expect(screen.queryByRole('link', { name: 'Mug' })).not.toBeInTheDocument();
  });

  it('searches by the typed term', () => {
    renderWithProviders(<Header />);

    fireEvent.change(screen.getByPlaceholderText('Search for products'), { target: { value: ' black mug ' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/products?q=black%20mug');
  });

  it('encodes special characters of the search term', () => {
    renderWithProviders(<Header />);

    fireEvent.change(screen.getByPlaceholderText('Search for products'), { target: { value: 'a&b' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/products?q=a%26b');
  });

  it('goes to the whole shop when the search is empty', () => {
    renderWithProviders(<Header />);

    fireEvent.change(screen.getByPlaceholderText('Search for products'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(push).toHaveBeenCalledWith('/products');
  });

  it('shows no cart badge when the cart is empty', () => {
    renderWithProviders(<Header />);

    expect(screen.getByRole('link', { name: '0 items in cart' })).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: '0 items in cart' })).queryByText(/\d/)).not.toBeInTheDocument();
  });

  it('shows the total number of units in the cart', async () => {
    serveCart([buildCartItemResponse({ id: 1, quantity: 2 }), buildCartItemResponse({ id: 2, quantity: 3 })]);

    renderWithProviders(<Header />);

    const cart = await screen.findByRole('link', { name: '5 items in cart' });
    expect(cart).toHaveAttribute('href', '/cart');
    expect(within(cart).getByText('5')).toBeInTheDocument();
  });

  it('updates the cart badge when a product is added', async () => {
    serveCart([], [buildProductResponse({ id: 1 })]);
    function AddTwo() {
      const { addItem } = useAddToCart();
      return (
        <button type="button" onClick={() => addItem(1, 2)}>
          add two
        </button>
      );
    }
    renderWithProviders(
      <>
        <Header />
        <AddTwo />
      </>,
    );
    expect(screen.getByRole('link', { name: '0 items in cart' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'add two' }));

    await waitFor(() => expect(screen.getByRole('link', { name: '2 items in cart' })).toBeInTheDocument());
  });

  it('shows the number of wishlisted products', () => {
    useWishlistStore.setState({ productIds: new Set([1, 2]) });

    renderWithProviders(<Header />);

    expect(screen.getByRole('link', { name: '2 products in wishlist' })).toBeInTheDocument();
  });

  it('has the main navigation links', () => {
    renderWithProviders(<Header />);

    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Shop Cart' })).toHaveAttribute('href', '/cart');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });
});
