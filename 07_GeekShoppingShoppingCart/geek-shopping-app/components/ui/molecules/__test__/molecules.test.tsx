import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImageCropper from '../ImageCropper';
import InlineAlert from '../InlineAlert';
import Pagination from '../Pagination';
import QuantityStepper from '../QuantityStepper';

const cropImageToJpeg = vi.fn();

vi.mock('@/app/core/utils/cropImage', () => ({
  cropImageToJpeg: (...args: unknown[]) => cropImageToJpeg(...args),
}));

vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete, aspect, zoom }: { onCropComplete: (area: unknown, pixels: unknown) => void; aspect: number; zoom: number }) => {
    return (
      <button
        type="button"
        data-testid="cropper"
        data-aspect={aspect}
        data-zoom={zoom}
        onClick={() => onCropComplete({}, { x: 1, y: 2, width: 30, height: 40 })}
      >
        select area
      </button>
    );
  },
}));

describe('InlineAlert', () => {
  it('uses the alert role for errors', () => {
    render(<InlineAlert tone="error">Something failed</InlineAlert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
  });

  it('is an error by default', () => {
    render(<InlineAlert>Something failed</InlineAlert>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it.each(['success', 'info'] as const)('uses the status role for the %s tone', (tone) => {
    render(<InlineAlert tone={tone}>Done</InlineAlert>);

    expect(screen.getByRole('status')).toHaveTextContent('Done');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it.each([0, 1])('renders nothing when there are %i pages', (totalPages) => {
    const { container } = render(<Pagination page={0} totalPages={totalPages} onPageChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('numbers the pages from 1 and marks the current one', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
  });

  it('disables Previous on the first page', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  it('goes to the previous, the next and a numbered page', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onPageChange.mock.calls).toEqual([[0], [2], [2]]);
  });

  it('shows at most five numbered pages centered on the current one', () => {
    render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />);

    const numbers = screen
      .getAllByRole('button')
      .map((button) => button.textContent)
      .filter((text) => /^\d+$/.test(text ?? ''));
    expect(numbers).toEqual(['4', '5', '6', '7', '8']);
  });

  it('keeps the window inside the range at the start and at the end', () => {
    const { rerender } = render(<Pagination page={0} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '6' })).not.toBeInTheDocument();

    rerender(<Pagination page={19} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '16' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '15' })).not.toBeInTheDocument();
  });

  it('honors a custom window size', () => {
    render(<Pagination page={0} totalPages={20} onPageChange={vi.fn()} windowSize={3} />);

    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '4' })).not.toBeInTheDocument();
  });
});

describe('QuantityStepper', () => {
  it('shows the value', () => {
    render(<QuantityStepper value={3} onChange={vi.fn()} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('asks for one more or one less', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));

    expect(onChange.mock.calls).toEqual([[4], [2]]);
  });

  it('disables decrease at the minimum, which is 1 by default', () => {
    render(<QuantityStepper value={1} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
  });

  it('honors a custom minimum', () => {
    render(<QuantityStepper value={0} min={0} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeEnabled();
  });

  it('disables increase at the maximum', () => {
    render(<QuantityStepper value={5} max={5} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('never disables increase when there is no maximum', () => {
    render(<QuantityStepper value={500} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeEnabled();
  });

  it('does not call onChange from a disabled button', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={5} max={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ImageCropper', () => {
  beforeEach(() => {
    cropImageToJpeg.mockReset();
  });

  function renderCropper(overrides: Partial<React.ComponentProps<typeof ImageCropper>> = {}) {
    const props = { imageUrl: 'blob:source', fileName: 'cover.png', onApply: vi.fn(), onCancel: vi.fn(), ...overrides };
    render(<ImageCropper {...props} />);
    return props;
  }

  it('says the result is saved as a JPEG', () => {
    renderCropper();

    expect(screen.getByText('The cropped image is saved as a JPEG.')).toBeInTheDocument();
  });

  it('keeps Apply disabled until an area is selected', () => {
    renderCropper();

    expect(screen.getByRole('button', { name: 'Apply crop' })).toBeDisabled();

    fireEvent.click(screen.getByTestId('cropper'));

    expect(screen.getByRole('button', { name: 'Apply crop' })).toBeEnabled();
  });

  it('turns the selected area into a JPEG file and hands it over', async () => {
    const jpeg = new File(['x'], 'cover.jpg', { type: 'image/jpeg' });
    cropImageToJpeg.mockResolvedValue(jpeg);
    const props = renderCropper();

    fireEvent.click(screen.getByTestId('cropper'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

    await waitFor(() => expect(props.onApply).toHaveBeenCalledWith(jpeg));
    expect(cropImageToJpeg).toHaveBeenCalledWith('blob:source', { x: 1, y: 2, width: 30, height: 40 }, 'cover.png');
  });

  it('shows the error and lets the user try again when the crop fails', async () => {
    cropImageToJpeg.mockRejectedValue(new Error('The image could not be converted.'));
    const props = renderCropper();

    fireEvent.click(screen.getByTestId('cropper'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The image could not be converted.');
    expect(props.onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Apply crop' })).toBeEnabled();
  });

  it('uses a generic message when the failure is not an Error', async () => {
    cropImageToJpeg.mockRejectedValue('boom');
    renderCropper();

    fireEvent.click(screen.getByTestId('cropper'));
    fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The image could not be cropped.');
  });

  it('cancels', () => {
    const props = renderCropper();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('starts square and changes the aspect ratio', () => {
    renderCropper();
    expect(screen.getByTestId('cropper')).toHaveAttribute('data-aspect', '1');

    fireEvent.change(screen.getByLabelText('Aspect ratio'), { target: { value: String(4 / 3) } });

    expect(Number(screen.getByTestId('cropper').getAttribute('data-aspect'))).toBeCloseTo(4 / 3);
  });

  it('exposes a zoom slider', () => {
    renderCropper();

    const zoom = screen.getByLabelText('Zoom');
    fireEvent.change(zoom, { target: { value: '2' } });

    expect(zoom).toHaveValue('2');
    expect(screen.getByTestId('cropper')).toHaveAttribute('data-zoom', '2');
  });
});
