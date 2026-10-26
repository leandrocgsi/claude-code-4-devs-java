import { fireEvent, render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';
import PriceTag from '../PriceTag';
import ProductImage, { PLACEHOLDER_IMAGE } from '../ProductImage';
import RatingStars from '../RatingStars';
import Spinner from '../Spinner';

describe('RatingStars', () => {
  it('renders nothing when the product has no rating', () => {
    const { container } = render(<RatingStars rating={null} reviewCount={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the rating is undefined', () => {
    const { container } = render(<RatingStars />);

    expect(container).toBeEmptyDOMElement();
  });

  it('describes the rating for assistive technology', () => {
    render(<RatingStars rating={4.5} />);

    expect(screen.getByLabelText('Rated 4.5 out of 5')).toBeInTheDocument();
  });

  it('draws five stars', () => {
    const { container } = render(<RatingStars rating={3} />);

    expect(container.querySelectorAll('svg')).toHaveLength(5);
  });

  it('shows the number of reviews when there are some', () => {
    render(<RatingStars rating={4} reviewCount={12} />);

    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('hides the number of reviews when it is zero', () => {
    render(<RatingStars rating={4} reviewCount={0} />);

    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('renders a rating of zero instead of hiding it', () => {
    render(<RatingStars rating={0} />);

    expect(screen.getByLabelText('Rated 0 out of 5')).toBeInTheDocument();
  });
});

describe('PriceTag', () => {
  it('shows the price in reais', () => {
    render(<PriceTag price={25} />);

    expect(screen.getByText(/R\$\s?25,00/)).toBeInTheDocument();
  });

  it('shows the old price next to the price when there is one', () => {
    render(<PriceTag price={25} oldPrice={30} />);

    expect(screen.getByText(/R\$\s?25,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?30,00/)).toBeInTheDocument();
  });

  it('shows only one price when the old price is null', () => {
    render(<PriceTag price={25} oldPrice={null} />);

    expect(screen.getAllByText(/R\$/)).toHaveLength(1);
  });

  it('shows only one price when the old price is missing', () => {
    render(<PriceTag price={25} />);

    expect(screen.getAllByText(/R\$/)).toHaveLength(1);
  });
});

describe('ProductImage', () => {
  it('shows the given image with its alt text', () => {
    render(<ProductImage src="http://api.test/api/product/v1/1/image" alt="Black Mug" />);

    expect(screen.getByAltText('Black Mug')).toHaveAttribute('src', 'http://api.test/api/product/v1/1/image');
  });

  it.each([null, undefined, ''])('shows the placeholder when the src is %p', (src) => {
    render(<ProductImage src={src} alt="No picture" />);

    expect(screen.getByAltText('No picture')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('falls back to the placeholder when the image fails to load', () => {
    render(<ProductImage src="http://api.test/broken" alt="Broken" />);

    fireEvent.error(screen.getByAltText('Broken'));

    expect(screen.getByAltText('Broken')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });

  it('tries the new image again when the src changes after a failure', () => {
    const { rerender } = render(<ProductImage src="http://api.test/broken" alt="Item" />);
    fireEvent.error(screen.getByAltText('Item'));

    rerender(<ProductImage src="http://api.test/other" alt="Item" />);

    expect(screen.getByAltText('Item')).toHaveAttribute('src', 'http://api.test/other');
  });

  it('passes the other attributes to the img element', () => {
    render(<ProductImage src={null} alt="Styled" className="thumb" />);

    expect(screen.getByAltText('Styled')).toHaveClass('thumb');
  });
});

describe('Spinner', () => {
  it('announces the default label as a status', () => {
    render(<Spinner />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('announces a custom label', () => {
    render(<Spinner label="Loading products" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading products');
  });
});

describe('EmptyState', () => {
  it('shows only the title when nothing else is given', () => {
    render(<EmptyState title="No products found" />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the description and the action when they are given', () => {
    render(
      <EmptyState title="No products found" description="Try changing the filters.">
        <button type="button">Clear filters</button>
      </EmptyState>,
    );

    expect(screen.getByText('Try changing the filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});
