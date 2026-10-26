import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { FACETS, PRODUCTS_URL, buildProductResponse, halPage } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import Products from '../Products';

const push = vi.fn();
let currentParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentParams,
  useRouter: () => ({ push }),
  usePathname: () => '/products',
}));

function setUrl(query: string) {
  currentParams = new URLSearchParams(query);
}

function lastPushed(): URLSearchParams {
  const target = push.mock.calls.at(-1)?.[0] as string;
  return new URLSearchParams(target.split('?')[1] ?? '');
}

function captureListRequests() {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(PRODUCTS_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(
        halPage([buildProductResponse({ id: 1, name: 'Black Mug' }), buildProductResponse({ id: 3, name: 'Sold Out Hoodie', quantity: 0 })]),
      );
    }),
  );
  return requests;
}

describe('Products', () => {
  beforeEach(() => {
    push.mockClear();
    setUrl('');
    useCartStore.setState({ quantities: {} });
  });

  it('shows the loading state first', () => {
    renderWithProviders(<Products />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading products');
  });

  it('lists the products of the API in a grid', async () => {
    renderWithProviders(<Products />);

    expect(await screen.findByRole('link', { name: 'Black Mug' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Space Book' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists the sold out product marked as out of stock with the cart disabled (AC-10)', async () => {
    renderWithProviders(<Products />);

    await screen.findByRole('link', { name: 'Sold Out Hoodie' });
    expect(screen.getByText('Out of stock', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('sends the defaults to the server when the url is empty', async () => {
    const requests = captureListRequests();

    renderWithProviders(<Products />);

    await screen.findByRole('link', { name: 'Black Mug' });
    expect(requests[0].get('page')).toBe('0');
    expect(requests[0].get('size')).toBe('12');
    expect(requests[0].get('sortBy')).toBe('createdAt');
    expect(requests[0].get('direction')).toBe('desc');
    expect(requests[0].has('q')).toBe(false);
  });

  it('sends every filter, the sort and the page found in the url to the server (AC-12)', async () => {
    setUrl('page=1&size=24&sortBy=price&direction=asc&q=mug&category=Mug&minPrice=100&maxPrice=199.99&color=Black&productSize=M');
    const requests = captureListRequests();

    renderWithProviders(<Products />);

    await screen.findByRole('link', { name: 'Black Mug' });
    const params = requests[0];
    expect(params.get('page')).toBe('1');
    expect(params.get('size')).toBe('24');
    expect(params.get('sortBy')).toBe('price');
    expect(params.get('direction')).toBe('asc');
    expect(params.get('q')).toBe('mug');
    expect(params.get('category')).toBe('Mug');
    expect(params.get('minPrice')).toBe('100');
    expect(params.get('maxPrice')).toBe('199.99');
    expect(params.getAll('color')).toEqual(['Black']);
    expect(params.getAll('productSize')).toEqual(['M']);
  });

  it('asks the facets with the same filters', async () => {
    setUrl('category=Mug&color=Black');
    let facetParams = new URLSearchParams();
    server.use(
      http.get(`${PRODUCTS_URL}/facets`, ({ request }) => {
        facetParams = new URL(request.url).searchParams;
        return HttpResponse.json(FACETS);
      }),
    );

    renderWithProviders(<Products />);

    await waitFor(() => expect(facetParams.get('category')).toBe('Mug'));
    expect(facetParams.getAll('color')).toEqual(['Black']);
    expect(facetParams.has('page')).toBe(false);
  });

  it('shows the facets in the sidebar with their counts', async () => {
    renderWithProviders(<Products />);

    const sidebar = await screen.findByRole('complementary');
    await within(sidebar).findByLabelText(/Black/);
    expect(within(sidebar).getByLabelText(/Mug/)).toBeInTheDocument();
    expect(within(sidebar).getByLabelText(/Book/)).toBeInTheDocument();
    expect(within(sidebar).getByLabelText(/White/)).toBeInTheDocument();
  });

  it('shows the toolbar selected as the url says', () => {
    setUrl('sortBy=popularity&direction=desc&size=36');

    renderWithProviders(<Products />);

    expect(document.getElementById('product-sort')).toHaveValue('popularity:desc');
    expect(document.getElementById('product-size')).toHaveValue('36');
  });

  it('turns Best Rating into sortBy=rating and goes back to the first page', () => {
    setUrl('page=3');
    renderWithProviders(<Products />);

    fireEvent.change(document.getElementById('product-sort') as HTMLSelectElement, { target: { value: 'rating:desc' } });

    const params = lastPushed();
    expect(params.get('sortBy')).toBe('rating');
    expect(params.has('page')).toBe(false);
  });

  it('turns a price sort into sortBy and direction', () => {
    renderWithProviders(<Products />);

    fireEvent.change(document.getElementById('product-sort') as HTMLSelectElement, { target: { value: 'price:asc' } });

    const params = lastPushed();
    expect(params.get('sortBy')).toBe('price');
    expect(params.get('direction')).toBe('asc');
  });

  it('changes the page size and goes back to the first page', () => {
    setUrl('page=2');
    renderWithProviders(<Products />);

    fireEvent.change(document.getElementById('product-size') as HTMLSelectElement, { target: { value: '24' } });

    const params = lastPushed();
    expect(params.get('size')).toBe('24');
    expect(params.has('page')).toBe(false);
  });

  it('changes the category from the sidebar and resets the page', async () => {
    setUrl('page=2');
    renderWithProviders(<Products />);
    const sidebar = await screen.findByRole('complementary');

    fireEvent.click(await within(sidebar).findByLabelText(/Book/));

    const params = lastPushed();
    expect(params.get('category')).toBe('Book');
    expect(params.has('page')).toBe(false);
  });

  it('changes the color and the size from the sidebar', async () => {
    renderWithProviders(<Products />);
    const sidebar = await screen.findByRole('complementary');

    fireEvent.click(await within(sidebar).findByLabelText(/White/));
    expect(lastPushed().get('color')).toBe('White');

    push.mockClear();
    fireEvent.click(within(sidebar).getByRole('radio', { name: /^M\s*4$/ }));
    expect(lastPushed().get('productSize')).toBe('M');
  });

  it('changes the price range from the sidebar, with the upper bound one cent below the next range', async () => {
    renderWithProviders(<Products />);
    const sidebar = await screen.findByRole('complementary');

    fireEvent.click(await within(sidebar).findByLabelText(/R\$\s?100,00 - R\$\s?200,00/));

    const params = lastPushed();
    expect(params.get('minPrice')).toBe('100');
    expect(params.get('maxPrice')).toBe('199.99');
  });

  it('leaves the upper bound open on the last price range', async () => {
    renderWithProviders(<Products />);
    const sidebar = await screen.findByRole('complementary');

    fireEvent.click(await within(sidebar).findByLabelText(/R\$\s?200,00\+/));

    const params = lastPushed();
    expect(params.get('minPrice')).toBe('200');
    expect(params.has('maxPrice')).toBe(false);
  });

  it('goes to another page through the pagination', async () => {
    server.use(
      http.get(PRODUCTS_URL, () =>
        HttpResponse.json(halPage([buildProductResponse({ id: 1 })], { number: 0, size: 12, totalElements: 30, totalPages: 3 })),
      ),
    );
    renderWithProviders(<Products />);
    await screen.findByRole('link', { name: 'Product 1' });

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(lastPushed().get('page')).toBe('1');
  });

  it('hides the pagination when everything fits in one page', async () => {
    renderWithProviders(<Products />);
    await screen.findByRole('link', { name: 'Black Mug' });

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows the empty state and clears the filters from it', async () => {
    setUrl('category=Mug&color=Black&q=zzz&minPrice=10');
    server.use(http.get(PRODUCTS_URL, () => HttpResponse.json(halPage([]))));
    renderWithProviders(<Products />);

    expect(await screen.findByText('No products found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(push).toHaveBeenCalledWith('/products');
  });

  it('shows the error state with the server message and recovers when the user tries again', async () => {
    let fail = true;
    server.use(
      http.get(PRODUCTS_URL, () =>
        fail ? HttpResponse.json({ detail: 'sortBy is invalid' }, { status: 400 }) : HttpResponse.json(halPage([buildProductResponse({ id: 1, name: 'Black Mug' })])),
      ),
    );
    renderWithProviders(<Products />);

    expect(await screen.findByRole('alert')).toHaveTextContent('sortBy is invalid');
    expect(screen.queryByText('No products found')).not.toBeInTheDocument();

    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Black Mug' })).toBeInTheDocument();
  });

  it('shows the search term and clears only the search', async () => {
    setUrl('q=mug&category=Mug');
    renderWithProviders(<Products />);

    expect(screen.getByText(/Results for/)).toHaveTextContent('Results for “mug”');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    const params = lastPushed();
    expect(params.has('q')).toBe(false);
    expect(params.get('category')).toBe('Mug');
    await screen.findByRole('link', { name: 'Black Mug' });
  });

  it('does not show the search line without a term', async () => {
    renderWithProviders(<Products />);
    await screen.findByRole('link', { name: 'Black Mug' });

    expect(screen.queryByText(/Results for/)).not.toBeInTheDocument();
  });

  it('switches to the list view and back', async () => {
    renderWithProviders(<Products />);
    await screen.findByRole('link', { name: 'Black Mug' });

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    const table = screen.getByRole('table');
    expect(within(table).getByText('Black Mug')).toBeInTheDocument();
    expect(within(table).getByText('Quantity')).toBeInTheDocument();
    expect(within(table).getByText('Out of stock')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Black Mug' })).toBeInTheDocument();
  });

  it('opens the quick view from the list view', async () => {
    renderWithProviders(<Products />);
    await screen.findByRole('link', { name: 'Black Mug' });
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    fireEvent.click(within(screen.getByRole('table')).getAllByRole('button', { name: 'Details' })[0]);

    expect(screen.getByRole('dialog', { name: 'Black Mug' })).toBeInTheDocument();
  });

  it('adds a product to the cart from the quick view of the grid', async () => {
    renderWithProviders(<Products />);
    await screen.findByRole('link', { name: 'Black Mug' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Quick view' })[0]);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().quantities).toEqual({ 1: 1 });
  });
});
