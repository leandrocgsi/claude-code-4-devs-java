import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildProduct } from '@/test/fixtures';
import { ProductInput } from '@/app/core/models/product';
import { MAX_IMAGE_SIZE_BYTES } from '@/app/core/utils/imageFile';
import { PLACEHOLDER_IMAGE } from '@/components/ui/atoms/ProductImage';
import ProductForm from '../ProductForm';

vi.mock('@/components/ui/molecules/ImageCropper', () => ({
  default: ({ onApply, onCancel, fileName }: { onApply: (file: File) => void; onCancel: () => void; fileName: string }) => (
    <div data-testid="cropper">
      <span>cropping {fileName}</span>
      <button type="button" onClick={() => onApply(new File(['cropped'], 'cropped.jpg', { type: 'image/jpeg' }))}>
        Apply crop
      </button>
      <button type="button" onClick={onCancel}>
        Cancel crop
      </button>
    </div>
  ),
}));

const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();

function renderForm(overrides: Partial<Omit<React.ComponentProps<typeof ProductForm>, 'onSubmit' | 'onCancel'>> = {}) {
  const onSubmit = vi.fn<(input: ProductInput, image: File | null) => void>();
  const onCancel = vi.fn();
  renderWithProviders(<ProductForm isSubmitting={false} {...overrides} onSubmit={onSubmit} onCancel={onCancel} />);
  return { onSubmit, onCancel };
}

function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValid() {
  fill('Name', 'Black Mug');
  fill('Description', 'A black mug');
  fill('Price', '25');
  fill('Category', 'Mug');
  fill('Quantity in stock', '10');
}

function chooseFile(file: File) {
  fireEvent.change(screen.getByLabelText('Product image'), { target: { files: [file] } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Create product|Save changes/ }));
}

function imageOf(type: string, size = 10, name = 'photo.jpg') {
  return new File([new Uint8Array(size)], name, { type });
}

describe('ProductForm', () => {
  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectURL });
  });

  describe('validation by field (RN-2)', () => {
    it('submits nothing and shows an error for each required field of an empty form', () => {
      const props = renderForm();
      fill('Quantity in stock', '');

      submit();

      expect(props.onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('The name is required.')).toBeInTheDocument();
      expect(screen.getByText('The description is required.')).toBeInTheDocument();
      expect(screen.getByText('The price must be greater than zero.')).toBeInTheDocument();
      expect(screen.getByText('The category is required.')).toBeInTheDocument();
      expect(screen.getByText('The quantity must be zero or a positive whole number.')).toBeInTheDocument();
    });

    it('rejects a name with only blanks', () => {
      const props = renderForm();
      fillValid();
      fill('Name', '   ');

      submit();

      expect(screen.getByText('The name is required.')).toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('limits the name to 150 characters', () => {
      renderForm();

      expect(screen.getByLabelText('Name')).toHaveAttribute('maxlength', '150');
    });

    it('limits the description to 255 characters, the category to 100, the color to 50 and the size to 20', () => {
      renderForm();

      expect(screen.getByLabelText('Description')).toHaveAttribute('maxlength', '255');
      expect(screen.getByLabelText('Category')).toHaveAttribute('maxlength', '100');
      expect(screen.getByLabelText('Color (optional)')).toHaveAttribute('maxlength', '50');
      expect(screen.getByLabelText('Size (optional)')).toHaveAttribute('maxlength', '20');
    });

    it.each(['0', '-1', 'abc'])('rejects the price "%s"', (price) => {
      const props = renderForm();
      fillValid();
      fill('Price', price);

      submit();

      expect(screen.getByText('The price must be greater than zero.')).toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('rejects a price of one billion or more', () => {
      renderForm();
      fillValid();
      fill('Price', '1000000000');

      submit();

      expect(screen.getByText('The price must be below 1,000,000,000.')).toBeInTheDocument();
    });

    it('accepts the highest price below one billion', () => {
      const props = renderForm();
      fillValid();
      fill('Price', '999999999.99');

      submit();

      expect(props.onSubmit).toHaveBeenCalled();
    });

    it.each(['25', '10'])('rejects an old price of %s when the price is 25', (oldPrice) => {
      const props = renderForm();
      fillValid();
      fill('Old price (optional)', oldPrice);

      submit();

      expect(screen.getByText('The old price must be greater than the price.')).toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('accepts an old price greater than the price', () => {
      const props = renderForm();
      fillValid();
      fill('Old price (optional)', '25.01');

      submit();

      expect(props.onSubmit).toHaveBeenCalled();
    });

    it('rejects an old price of zero or less', () => {
      renderForm();
      fillValid();
      fill('Old price (optional)', '0');

      submit();

      expect(screen.getByText('The old price must be greater than zero.')).toBeInTheDocument();
    });

    it('rejects an old price of one billion or more', () => {
      renderForm();
      fillValid();
      fill('Old price (optional)', '1000000000');

      submit();

      expect(screen.getByText('The old price must be below 1,000,000,000.')).toBeInTheDocument();
    });

    it.each(['-1', '1.5', 'abc', ''])('rejects the quantity "%s"', (quantity) => {
      const props = renderForm();
      fillValid();
      fill('Quantity in stock', quantity);

      submit();

      expect(screen.getByText('The quantity must be zero or a positive whole number.')).toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('accepts a quantity of zero', () => {
      const props = renderForm();
      fillValid();
      fill('Quantity in stock', '0');

      submit();

      expect(props.onSubmit).toHaveBeenCalled();
    });

    it('clears the errors once the fields are fixed', () => {
      const props = renderForm();
      submit();
      expect(screen.getByText('The name is required.')).toBeInTheDocument();

      fillValid();
      submit();

      expect(screen.queryByText('The name is required.')).not.toBeInTheDocument();
      expect(props.onSubmit).toHaveBeenCalled();
    });

    it('shows the per-field errors that come from the server', () => {
      renderForm({
        serverErrors: { name: 'must not be blank', price: 'must be greater than 0', oldPrice: 'must be greater than the price', image: 'Unsupported image type' },
      });

      expect(screen.getByText('must not be blank')).toBeInTheDocument();
      expect(screen.getByText('must be greater than 0')).toBeInTheDocument();
      expect(screen.getByText('must be greater than the price')).toBeInTheDocument();
      expect(screen.getByText('Unsupported image type')).toBeInTheDocument();
    });

    it('prefers its own error over the server one for the same field', () => {
      renderForm({ serverErrors: { name: 'server says no' } });

      submit();

      expect(screen.getByText('The name is required.')).toBeInTheDocument();
      expect(screen.queryByText('server says no')).not.toBeInTheDocument();
    });

    it('shows the form level error', () => {
      renderForm({ formError: 'Please fix the highlighted fields.' });

      expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.');
    });
  });

  describe('submission', () => {
    it('sends the trimmed values with the optional fields as null', () => {
      const props = renderForm();
      fill('Name', '  Black Mug ');
      fill('Description', ' A black mug ');
      fill('Price', '25.5');
      fill('Category', ' Mug ');
      fill('Quantity in stock', '10');

      submit();

      expect(props.onSubmit).toHaveBeenCalledWith(
        {
          id: undefined,
          name: 'Black Mug',
          description: 'A black mug',
          price: 25.5,
          oldPrice: null,
          category: 'Mug',
          quantity: 10,
          color: null,
          size: null,
          featured: false,
        },
        null,
      );
    });

    it('sends the optional fields when they are filled', () => {
      const props = renderForm();
      fillValid();
      fill('Old price (optional)', '30');
      fill('Color (optional)', ' Black ');
      fill('Size (optional)', 'M');
      fireEvent.click(screen.getByLabelText('Featured product'));

      submit();

      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ oldPrice: 30, color: 'Black', size: 'M', featured: true }),
        null,
      );
    });

    it('does not send the server fields', () => {
      const props = renderForm();
      fillValid();

      submit();

      const sent = props.onSubmit.mock.calls[0][0];
      expect(Object.keys(sent).sort()).toEqual(
        ['category', 'color', 'description', 'featured', 'id', 'name', 'oldPrice', 'price', 'quantity', 'size'].sort(),
      );
    });

    it('disables the buttons and says it is saving while submitting', () => {
      renderForm({ isSubmitting: true });

      expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('cancels', () => {
      const props = renderForm();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(props.onCancel).toHaveBeenCalledTimes(1);
    });

    it('suggests the categories that already exist', async () => {
      renderForm();

      await waitFor(() => expect(document.querySelectorAll('#product-category-options option')).toHaveLength(2));
      expect(document.querySelector('#product-category-options option[value="Mug"]')).not.toBeNull();
    });
  });

  describe('editing', () => {
    const product = buildProduct({
      id: 12,
      name: 'Space Book',
      description: 'A book',
      price: 40,
      oldPrice: 50,
      category: 'Book',
      quantity: 3,
      color: 'Blue',
      size: 'L',
      featured: true,
    });

    it('starts filled with the product', () => {
      renderForm({ product });

      expect(screen.getByLabelText('Name')).toHaveValue('Space Book');
      expect(screen.getByLabelText('Price')).toHaveValue(40);
      expect(screen.getByLabelText('Old price (optional)')).toHaveValue(50);
      expect(screen.getByLabelText('Quantity in stock')).toHaveValue(3);
      expect(screen.getByLabelText('Color (optional)')).toHaveValue('Blue');
      expect(screen.getByLabelText('Featured product')).toBeChecked();
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('sends the id of the product and no image when none was chosen', () => {
      const props = renderForm({ product });

      submit();

      expect(props.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 12, name: 'Space Book' }), null);
    });

    it('shows the current image and explains that choosing a file replaces it', () => {
      renderForm({ product });

      expect(screen.getByAltText('Product image preview')).toHaveAttribute('src', 'http://api.test/api/product/v1/12/image');
      expect(screen.getByText('Choose a file only if you want to replace the current image.')).toBeInTheDocument();
    });

    it('shows no hint when creating', () => {
      renderForm();

      expect(screen.queryByText(/replace the current image/)).not.toBeInTheDocument();
    });

    it('leaves the old price empty when the product has none', () => {
      renderForm({ product: buildProduct({ oldPrice: null }) });

      expect(screen.getByLabelText('Old price (optional)')).toHaveValue(null);
    });
  });

  describe('image (RN-4, RN-6)', () => {
    it('shows the placeholder before any file is chosen', () => {
      renderForm();

      expect(screen.getByAltText('Product image preview')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
    });

    it('accepts only the image types of the contract in the file picker', () => {
      renderForm();

      expect(screen.getByLabelText('Product image')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/gif');
    });

    it('previews the chosen file and sends it', () => {
      const props = renderForm();
      fillValid();
      const file = imageOf('image/png', 10, 'photo.png');

      chooseFile(file);

      expect(createObjectURL).toHaveBeenCalledWith(file);
      expect(screen.getByAltText('Product image preview')).toHaveAttribute('src', 'blob:preview');
      submit();
      expect(props.onSubmit).toHaveBeenCalledWith(expect.anything(), file);
    });

    it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])('accepts %s', (type) => {
      renderForm();

      chooseFile(imageOf(type));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByAltText('Product image preview')).toHaveAttribute('src', 'blob:preview');
    });

    it('rejects a file that is not an accepted image type before sending', () => {
      const props = renderForm();
      fillValid();

      chooseFile(imageOf('application/pdf', 10, 'doc.pdf'));

      expect(screen.getByText('Use a JPEG, PNG, WebP or GIF image.')).toBeInTheDocument();
      expect(createObjectURL).not.toHaveBeenCalled();
      submit();
      expect(props.onSubmit).toHaveBeenCalledWith(expect.anything(), null);
    });

    it('rejects a file larger than 5 MB before sending', () => {
      renderForm();

      chooseFile(imageOf('image/jpeg', MAX_IMAGE_SIZE_BYTES + 1));

      expect(screen.getByText('The image must be at most 5 MB.')).toBeInTheDocument();
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    it('accepts a file of exactly 5 MB', () => {
      renderForm();

      chooseFile(imageOf('image/jpeg', MAX_IMAGE_SIZE_BYTES));

      expect(screen.queryByText('The image must be at most 5 MB.')).not.toBeInTheDocument();
      expect(createObjectURL).toHaveBeenCalled();
    });

    it('clears the image error when a valid file is chosen next', () => {
      renderForm();
      chooseFile(imageOf('application/pdf'));
      expect(screen.getByText('Use a JPEG, PNG, WebP or GIF image.')).toBeInTheDocument();

      chooseFile(imageOf('image/jpeg'));

      expect(screen.queryByText('Use a JPEG, PNG, WebP or GIF image.')).not.toBeInTheDocument();
    });

    it('removes the selection and goes back to the placeholder', () => {
      const props = renderForm();
      fillValid();
      chooseFile(imageOf('image/jpeg'));

      fireEvent.click(screen.getByRole('button', { name: 'Remove selection' }));

      expect(screen.getByAltText('Product image preview')).toHaveAttribute('src', PLACEHOLDER_IMAGE);
      expect(screen.queryByRole('button', { name: 'Remove selection' })).not.toBeInTheDocument();
      submit();
      expect(props.onSubmit).toHaveBeenCalledWith(expect.anything(), null);
    });

    it('offers the crop only after a file is chosen', () => {
      renderForm();
      expect(screen.queryByRole('button', { name: 'Crop image' })).not.toBeInTheDocument();

      chooseFile(imageOf('image/png', 10, 'photo.png'));

      expect(screen.getByRole('button', { name: 'Crop image' })).toBeInTheDocument();
    });

    it('opens the cropper, replaces the file by the cropped JPEG and sends it', () => {
      const props = renderForm();
      fillValid();
      chooseFile(imageOf('image/png', 10, 'photo.png'));

      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));
      expect(screen.getByText('cropping photo.png')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Apply crop' }));

      expect(screen.queryByTestId('cropper')).not.toBeInTheDocument();
      submit();
      const sentImage = props.onSubmit.mock.calls[0][1] as File;
      expect(sentImage.name).toBe('cropped.jpg');
      expect(sentImage.type).toBe('image/jpeg');
    });

    it('keeps the original file when the crop is cancelled', () => {
      const props = renderForm();
      fillValid();
      const original = imageOf('image/png', 10, 'photo.png');
      chooseFile(original);

      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel crop' }));

      expect(screen.queryByTestId('cropper')).not.toBeInTheDocument();
      submit();
      expect(props.onSubmit).toHaveBeenCalledWith(expect.anything(), original);
    });

    it('does not allow saving while the cropper is open', () => {
      renderForm();
      chooseFile(imageOf('image/png'));

      fireEvent.click(screen.getByRole('button', { name: 'Crop image' }));

      expect(screen.getByRole('button', { name: 'Create product' })).toBeDisabled();
    });

    it('releases the preview url when the form goes away', () => {
      const { unmount } = (() => {
        const result = renderWithProviders(<ProductForm isSubmitting={false} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        return result;
      })();
      chooseFile(imageOf('image/jpeg'));

      unmount();

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    });
  });
});
