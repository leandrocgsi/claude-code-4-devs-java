import { fireEvent, render, screen } from '@testing-library/react';
import { buildProduct } from '@/test/fixtures';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import { useWishlistStore } from '@/app/store/modules/global/useWishlistStore';
import { PLACEHOLDER_IMAGE } from '@/components/ui/atoms/ProductImage';
import ProductCard from '../ProductCard';
import ProductDetails from '../ProductDetails';

describe('ProductCard', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
    useWishlistStore.setState({ productIds: new Set() });
  });

  it('shows the name as a link to the product page, the category and the price', () => {
    render(<ProductCard product={buildProduct({ id: 7, name: 'Black Mug', category: 'Mug', price: 25 })} onQuickView={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Black Mug' })).toHaveAttribute('href', '/products/7');
    expect(screen.getByText('Mug')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?25,00/)).toBeInTheDocument();
  });

  it('shows the old price next to the price', () => {
    render(<ProductCard product={buildProduct({ price: 25, oldPrice: 30 })} onQuickView={vi.fn()} />);

    expect(screen.getByText(/R\$\s?25,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?30,00/)).toBeInTheDocument();
  });

  it('omits the stars when the product has no rating', () => {
    render(<ProductCard product={buildProduct({ rating: null, reviewCount: 0 })} onQuickView={vi.fn()} />);

    expect(screen.queryByLabelText(/Rated/)).not.toBeInTheDocument();
  });

  it('shows the stars when the product has a rating', () => {
    render(<ProductCard product={buildProduct({ rating: 4, reviewCount: 3 })} onQuickView={vi.fn()} />);

    expect(screen.getByLabelText('Rated 4 out of 5')).toBeInTheDocument();
  });

  it('shows the product image from the API', () => {
    render(<ProductCard product={buildProduct({ id: 2, name: 'Space Book' })} onQuickView={vi.fn()} />);

    expect(screen.getByAltText('Space Book')).toHaveAttribute('src', 'http://api.test/api/product/v1/2/image');
  });

  it('shows the placeholder when the product has no image', () => {
    render(<ProductCard product={buildProduct({ name: 'Plain', imageUrl: null })} onQuickView={vi.fn()} />);

    expect(screen.getByAltText('Plain')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('adds the product to the cart', () => {
    render(<ProductCard product={buildProduct({ id: 4 })} onQuickView={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(useCartStore.getState().quantities).toEqual({ 4: 2 });
  });

  it('marks a sold out product and disables the cart button', () => {
    render(<ProductCard product={buildProduct({ id: 3, quantity: 0 })} onQuickView={vi.fn()} />);

    expect(screen.getByText('Out of stock', { selector: 'span' })).toBeInTheDocument();
    const cartButton = screen.getByRole('button', { name: 'Out of stock' });
    expect(cartButton).toBeDisabled();
    fireEvent.click(cartButton);
    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('does not mark a product that has stock', () => {
    render(<ProductCard product={buildProduct({ quantity: 1 })} onQuickView={vi.fn()} />);

    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
  });

  it('toggles the wishlist', () => {
    render(<ProductCard product={buildProduct({ id: 9 })} onQuickView={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));
    expect(useWishlistStore.getState().has(9)).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Remove from wishlist' }));
    expect(useWishlistStore.getState().has(9)).toBe(false);
  });

  it('opens the quick view with the product', () => {
    const onQuickView = vi.fn();
    const product = buildProduct({ id: 5 });
    render(<ProductCard product={product} onQuickView={onQuickView} />);

    fireEvent.click(screen.getByRole('button', { name: 'Quick view' }));

    expect(onQuickView).toHaveBeenCalledWith(product);
  });

  it('keeps the compare button disabled because the feature does not exist', () => {
    render(<ProductCard product={buildProduct()} onQuickView={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Compare (coming soon)' })).toBeDisabled();
  });
});

describe('ProductDetails (quick view)', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('shows the description, the price and the stock', () => {
    render(<ProductDetails product={buildProduct({ description: 'Hot coffee', quantity: 4, price: 25, oldPrice: 30 })} />);

    expect(screen.getByText('Hot coffee')).toBeInTheDocument();
    expect(screen.getByText('4 in stock')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?30,00/)).toBeInTheDocument();
  });

  it('links to the full product page', () => {
    render(<ProductDetails product={buildProduct({ id: 8 })} />);

    expect(screen.getByRole('link', { name: 'View full details' })).toHaveAttribute('href', '/products/8');
  });

  it('adds the product to the cart', () => {
    render(<ProductDetails product={buildProduct({ id: 8 })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(useCartStore.getState().quantities).toEqual({ 8: 1 });
  });

  it('disables the button of a sold out product', () => {
    render(<ProductDetails product={buildProduct({ quantity: 0 })} />);

    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
    expect(screen.getAllByText('Out of stock').length).toBeGreaterThan(0);
  });

  it('omits the stars without rating', () => {
    render(<ProductDetails product={buildProduct({ rating: null })} />);

    expect(screen.queryByLabelText(/Rated/)).not.toBeInTheDocument();
  });
});
