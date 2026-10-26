import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { CATEGORIES, PRODUCTS_URL, buildProductResponse, halPage } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import { PLACEHOLDER_IMAGE } from '@/components/ui/atoms/ProductImage';
import Home from '../Home';

function sectionOf(title: string) {
  return screen.getByRole('heading', { name: title }).closest('section') as HTMLElement;
}

describe('Home', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('shows a loading state in each data section first', () => {
    renderWithProviders(<Home />);

    expect(screen.getByText('Loading categories')).toBeInTheDocument();
    expect(screen.getByText('Loading featured products')).toBeInTheDocument();
    expect(screen.getByText('Loading recent products')).toBeInTheDocument();
  });

  it('shows the categories from the API with their counts and links', async () => {
    renderWithProviders(<Home />);

    const categories = sectionOf('Categories');
    const mug = await within(categories).findByRole('link', { name: /Mug/ });
    expect(mug).toHaveAttribute('href', '/products?category=Mug');
    expect(within(mug).getByText('6 Products')).toBeInTheDocument();
    const book = within(categories).getByRole('link', { name: /Book/ });
    expect(book).toHaveAttribute('href', '/products?category=Book');
    expect(within(book).getByText('8 Products')).toBeInTheDocument();
  });

  it('encodes the category name in the link', async () => {
    server.use(
      http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json([{ name: 'Boneco de ação', productCount: 2, imageUrl: null }])),
    );

    renderWithProviders(<Home />);

    expect(await within(sectionOf('Categories')).findByRole('link', { name: /Boneco de ação/ })).toHaveAttribute('href', '/products?category=Boneco%20de%20a%C3%A7%C3%A3o');
  });

  it('shows the category image from the API and the placeholder when it has none', async () => {
    renderWithProviders(<Home />);

    const categories = sectionOf('Categories');
    await within(categories).findByRole('link', { name: /Mug/ });
    expect(within(categories).getByAltText('Mug')).toHaveAttribute('src', `http://api.test${CATEGORIES[0].imageUrl}`);
    expect(within(categories).getByAltText('Book')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('shows the featured products', async () => {
    renderWithProviders(<Home />);

    const featured = sectionOf('Featured Products');
    expect(await within(featured).findByRole('link', { name: 'Black Mug' })).toBeInTheDocument();
    expect(within(featured).queryByRole('link', { name: 'Space Book' })).not.toBeInTheDocument();
  });

  it('shows the recent products', async () => {
    renderWithProviders(<Home />);

    const recent = sectionOf('Recent Products');
    expect(await within(recent).findByRole('link', { name: 'Space Book' })).toBeInTheDocument();
    expect(within(recent).getByRole('link', { name: 'Black Mug' })).toBeInTheDocument();
  });

  it('requests eight products for each section', async () => {
    const sizes: Record<string, string | null> = {};
    server.use(
      http.get(`${PRODUCTS_URL}/featured`, ({ request }) => {
        sizes.featured = new URL(request.url).searchParams.get('size');
        return HttpResponse.json(halPage([]));
      }),
      http.get(`${PRODUCTS_URL}/recent`, ({ request }) => {
        sizes.recent = new URL(request.url).searchParams.get('size');
        return HttpResponse.json(halPage([]));
      }),
    );

    renderWithProviders(<Home />);

    await waitFor(() => expect(sizes).toEqual({ featured: '8', recent: '8' }));
  });

  it('marks the sold out product listed in the recent section (AC-10)', async () => {
    renderWithProviders(<Home />);

    const recent = sectionOf('Recent Products');
    await within(recent).findByRole('link', { name: 'Sold Out Hoodie' });
    expect(within(recent).getAllByText('Out of stock', { selector: 'span' })).toHaveLength(1);
    const disabledCart = within(recent).getByRole('button', { name: 'Out of stock' });
    expect(disabledCart).toBeDisabled();
    fireEvent.click(disabledCart);
    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('shows the stars only for the product that has a rating', async () => {
    renderWithProviders(<Home />);

    const recent = sectionOf('Recent Products');
    await within(recent).findByRole('link', { name: 'Space Book' });
    expect(within(recent).getAllByLabelText(/Rated/)).toHaveLength(1);
    expect(within(recent).getByLabelText('Rated 4.5 out of 5')).toBeInTheDocument();
  });

  it('uses the placeholder for a product without image', async () => {
    server.use(
      http.get(`${PRODUCTS_URL}/featured`, () =>
        HttpResponse.json(halPage([buildProductResponse({ id: 40, name: 'Imageless', imageUrl: null })])),
      ),
    );

    renderWithProviders(<Home />);

    expect(await within(sectionOf('Featured Products')).findByAltText('Imageless')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('shows the empty state of each empty section', async () => {
    server.use(
      http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json([])),
      http.get(`${PRODUCTS_URL}/featured`, () => HttpResponse.json(halPage([]))),
      http.get(`${PRODUCTS_URL}/recent`, () => HttpResponse.json(halPage([]))),
    );

    renderWithProviders(<Home />);

    expect(await screen.findByText('No categories yet')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('No products yet')).toHaveLength(2));
  });

  it('shows an error in the section that failed and keeps the others', async () => {
    server.use(http.get(`${PRODUCTS_URL}/categories`, () => HttpResponse.json({ message: 'down' }, { status: 500 })));

    renderWithProviders(<Home />);

    expect(await screen.findByText('The categories could not be loaded.')).toBeInTheDocument();
    expect(await within(sectionOf('Featured Products')).findByRole('link', { name: 'Black Mug' })).toBeInTheDocument();
    expect(screen.queryByText('The products could not be loaded.')).not.toBeInTheDocument();
  });

  it('shows an error in the product sections', async () => {
    server.use(
      http.get(`${PRODUCTS_URL}/featured`, () => HttpResponse.json({ message: 'down' }, { status: 500 })),
      http.get(`${PRODUCTS_URL}/recent`, () => HttpResponse.json({ message: 'down' }, { status: 500 })),
    );

    renderWithProviders(<Home />);

    await waitFor(() => expect(screen.getAllByText('The products could not be loaded.')).toHaveLength(2));
  });

  it('opens the quick view of a product and closes it', async () => {
    renderWithProviders(<Home />);
    const featured = sectionOf('Featured Products');
    await within(featured).findByRole('link', { name: 'Black Mug' });

    fireEvent.click(within(featured).getByRole('button', { name: 'Quick view' }));

    const dialog = screen.getByRole('dialog', { name: 'Black Mug' });
    expect(within(dialog).getByRole('link', { name: 'View full details' })).toHaveAttribute('href', '/products/1');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
