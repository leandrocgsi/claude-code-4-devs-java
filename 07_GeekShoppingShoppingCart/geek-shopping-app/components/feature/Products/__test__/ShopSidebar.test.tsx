import { fireEvent, render, screen } from '@testing-library/react';
import { FACETS } from '@/test/fixtures';
import ShopSidebar from '../ShopSidebar';

function renderSidebar(overrides: Partial<React.ComponentProps<typeof ShopSidebar>> = {}) {
  const props = {
    facets: FACETS,
    price: {},
    onPriceChange: vi.fn(),
    category: '',
    onCategoryChange: vi.fn(),
    color: '',
    onColorChange: vi.fn(),
    size: '',
    onSizeChange: vi.fn(),
    ...overrides,
  };
  render(<ShopSidebar {...props} />);
  return props;
}

describe('ShopSidebar', () => {
  it('renders only the "all" options while the facets are not loaded', () => {
    renderSidebar({ facets: undefined });

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByLabelText(/All Price/)).toBeChecked();
    expect(screen.getByLabelText(/All Category/)).toBeChecked();
    expect(screen.getByLabelText(/All Color/)).toBeChecked();
    expect(screen.getByLabelText(/All Size/)).toBeChecked();
  });

  it('shows the sum of the price range counts as the total of products', () => {
    renderSidebar();

    expect(screen.getByLabelText(/All Price/).closest('label')).toHaveTextContent('14');
  });

  it('shows each facet with its count', () => {
    renderSidebar();

    expect(screen.getByLabelText(/Mug/).closest('label')).toHaveTextContent('6');
    expect(screen.getByLabelText(/Book/).closest('label')).toHaveTextContent('8');
    expect(screen.getByLabelText(/Black/).closest('label')).toHaveTextContent('5');
    expect(screen.getByLabelText(/White/).closest('label')).toHaveTextContent('3');
  });

  it('labels the price ranges and the open last range', () => {
    renderSidebar();

    expect(screen.getByLabelText(/R\$\s?0,00 - R\$\s?100,00/)).toBeInTheDocument();
    expect(screen.getByLabelText(/R\$\s?100,00 - R\$\s?200,00/)).toBeInTheDocument();
    expect(screen.getByLabelText(/R\$\s?200,00\+/)).toBeInTheDocument();
  });

  it('checks the range that matches the selected prices', () => {
    renderSidebar({ price: { minPrice: 100, maxPrice: 199.99 } });

    expect(screen.getByLabelText(/R\$\s?100,00 - R\$\s?200,00/)).toBeChecked();
    expect(screen.getByLabelText(/All Price/)).not.toBeChecked();
  });

  it('checks the open range when only the minimum price is selected', () => {
    renderSidebar({ price: { minPrice: 200 } });

    expect(screen.getByLabelText(/R\$\s?200,00\+/)).toBeChecked();
  });

  it('checks the selected category, color and size', () => {
    renderSidebar({ category: 'Book', color: 'White', size: 'G' });

    expect(screen.getByLabelText(/Book/)).toBeChecked();
    expect(screen.getByLabelText(/White/)).toBeChecked();
    expect(screen.getByRole('radio', { name: /^G\s*2$/ })).toBeChecked();
    expect(screen.getByLabelText(/All Category/)).not.toBeChecked();
  });

  it('reports the selected price range with the cent below the next range', () => {
    const props = renderSidebar();

    fireEvent.click(screen.getByLabelText(/R\$\s?0,00 - R\$\s?100,00/));

    expect(props.onPriceChange).toHaveBeenCalledWith({ minPrice: 0, maxPrice: 99.99 });
  });

  it('reports the open range without a maximum', () => {
    const props = renderSidebar();

    fireEvent.click(screen.getByLabelText(/R\$\s?200,00\+/));

    expect(props.onPriceChange).toHaveBeenCalledWith({ minPrice: 200, maxPrice: undefined });
  });

  it('clears the price when All Price is chosen', () => {
    const props = renderSidebar({ price: { minPrice: 100, maxPrice: 199.99 } });

    fireEvent.click(screen.getByLabelText(/All Price/));

    expect(props.onPriceChange).toHaveBeenCalledWith({ minPrice: undefined, maxPrice: undefined });
  });

  it('reports the chosen category, color and size', () => {
    const props = renderSidebar();

    fireEvent.click(screen.getByLabelText(/Mug/));
    fireEvent.click(screen.getByLabelText(/Black/));
    fireEvent.click(screen.getByRole('radio', { name: /^M\s*4$/ }));

    expect(props.onCategoryChange).toHaveBeenCalledWith('Mug');
    expect(props.onColorChange).toHaveBeenCalledWith('Black');
    expect(props.onSizeChange).toHaveBeenCalledWith('M');
  });

  it('clears each filter with its "all" option', () => {
    const props = renderSidebar({ category: 'Mug', color: 'Black', size: 'M' });

    fireEvent.click(screen.getByLabelText(/All Category/));
    fireEvent.click(screen.getByLabelText(/All Color/));
    fireEvent.click(screen.getByLabelText(/All Size/));

    expect(props.onCategoryChange).toHaveBeenCalledWith('');
    expect(props.onColorChange).toHaveBeenCalledWith('');
    expect(props.onSizeChange).toHaveBeenCalledWith('');
  });
});
