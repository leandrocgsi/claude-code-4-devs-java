import { ApiError } from '@/app/core/api/httpClient';
import { toApiUrl } from '../apiUrl';
import { formatPrice } from '../currency';
import { cropImageToJpeg, toJpegFileName } from '../cropImage';
import { getErrorMessage } from '../errorMessage';
import { MAX_IMAGE_SIZE_BYTES, validateImageFile } from '../imageFile';
import { generateUuid } from '../uuid';

function fileOf(type: string, size: number, name = 'file') {
  return new File([new Uint8Array(size)], name, { type });
}

describe('toApiUrl', () => {
  it('prefixes the path with the API base url', () => {
    expect(toApiUrl('/api/product/v1/1/image')).toBe('http://api.test/api/product/v1/1/image');
  });
});

describe('formatPrice', () => {
  it('formats in Brazilian reais', () => {
    expect(formatPrice(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });

  it('formats zero', () => {
    expect(formatPrice(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
  });
});

describe('validateImageFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])('accepts %s', (type) => {
    expect(validateImageFile(fileOf(type, 100))).toBeNull();
  });

  it.each(['application/pdf', 'text/plain', 'image/svg+xml', 'image/bmp', ''])('rejects the type "%s"', (type) => {
    expect(validateImageFile(fileOf(type, 100))).toBe('Use a JPEG, PNG, WebP or GIF image.');
  });

  it('accepts a file of exactly 5 MB', () => {
    expect(validateImageFile(fileOf('image/jpeg', MAX_IMAGE_SIZE_BYTES))).toBeNull();
  });

  it('rejects a file one byte over 5 MB', () => {
    expect(validateImageFile(fileOf('image/jpeg', MAX_IMAGE_SIZE_BYTES + 1))).toBe('The image must be at most 5 MB.');
  });

  it('checks the type before the size', () => {
    expect(validateImageFile(fileOf('application/pdf', MAX_IMAGE_SIZE_BYTES + 1))).toBe('Use a JPEG, PNG, WebP or GIF image.');
  });
});

describe('toJpegFileName', () => {
  it.each([
    ['photo.png', 'photo.jpg'],
    ['photo.jpeg', 'photo.jpg'],
    ['my.photo.webp', 'my.photo.jpg'],
    ['photo', 'photo.jpg'],
    ['.png', 'image.jpg'],
    ['', 'image.jpg'],
  ])('turns "%s" into "%s"', (input, expected) => {
    expect(toJpegFileName(input)).toBe(expected);
  });
});

describe('cropImageToJpeg', () => {
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  let toBlobResult: Blob | null;
  let context: unknown;

  beforeEach(() => {
    drawImage.mockClear();
    fillRect.mockClear();
    toBlobResult = new Blob(['jpeg-bytes'], { type: 'image/jpeg' });
    context = { drawImage, fillRect, fillStyle: '' };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type, quality) {
      toBlobRequest = { type, quality };
      callback(toBlobResult);
    });
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => (imageFails ? this.onerror?.() : this.onload?.()));
        }
      },
    );
    imageFails = false;
    toBlobRequest = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  let imageFails = false;
  let toBlobRequest: { type?: string; quality?: number } = {};

  it('returns a JPEG file named after the original with the extension replaced', async () => {
    const file = await cropImageToJpeg('blob:source', { x: 10, y: 20, width: 300, height: 200 }, 'cover.png');

    expect(file.name).toBe('cover.jpg');
    expect(file.type).toBe('image/jpeg');
    expect(file.size).toBe(toBlobResult!.size);
  });

  it('asks the canvas for a JPEG and draws the selected area', async () => {
    await cropImageToJpeg('blob:source', { x: 10.4, y: 20, width: 300.6, height: 200 }, 'a.png');

    expect(toBlobRequest.type).toBe('image/jpeg');
    expect(toBlobRequest.quality).toBe(0.9);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 10.4, 20, 300.6, 200, 0, 0, 301, 200);
  });

  it('paints a white background before drawing', async () => {
    await cropImageToJpeg('blob:source', { x: 0, y: 0, width: 50, height: 50 }, 'a.png');

    expect(fillRect).toHaveBeenCalledWith(0, 0, 50, 50);
    expect((context as { fillStyle: string }).fillStyle).toBe('#ffffff');
  });

  it('rejects when the image cannot be loaded', async () => {
    imageFails = true;

    await expect(cropImageToJpeg('blob:broken', { x: 0, y: 0, width: 10, height: 10 }, 'a.png')).rejects.toThrow(
      'The image could not be loaded.',
    );
  });

  it('rejects when the canvas has no 2d context', async () => {
    context = null;

    await expect(cropImageToJpeg('blob:source', { x: 0, y: 0, width: 10, height: 10 }, 'a.png')).rejects.toThrow(
      'Image editing is not supported by this browser.',
    );
  });

  it('rejects when the canvas cannot produce a blob', async () => {
    toBlobResult = null;

    await expect(cropImageToJpeg('blob:source', { x: 0, y: 0, width: 10, height: 10 }, 'a.png')).rejects.toThrow(
      'The image could not be converted.',
    );
  });

  it('never creates a canvas smaller than one pixel', async () => {
    await cropImageToJpeg('blob:source', { x: 0, y: 0, width: 0, height: 0.2 }, 'a.png');

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 0, 0.2, 0, 0, 1, 1);
  });
});

describe('generateUuid', () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a version 4 UUID', () => {
    expect(generateUuid()).toMatch(UUID_V4);
  });

  it('returns a different value on every call', () => {
    expect(generateUuid()).not.toBe(generateUuid());
  });

  it('builds a valid UUID when randomUUID is not available', () => {
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(255) });

    expect(generateUuid()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('sets the version and variant bits of the fallback', () => {
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(0) });

    expect(generateUuid()).toBe('00000000-0000-4000-8000-000000000000');
  });
});

describe('getErrorMessage', () => {
  it('prefers the message of the first field error of the API', () => {
    const error = new ApiError('Validation failed', 400, { quantity: 'Only 2 units are available' });

    expect(getErrorMessage(error)).toBe('Only 2 units are available');
  });

  it('falls back to the message of the API error without fields', () => {
    expect(getErrorMessage(new ApiError('No records found for this ID!', 404))).toBe('No records found for this ID!');
  });

  it('falls back to the message when the field map is empty', () => {
    expect(getErrorMessage(new ApiError('Validation failed', 400, {}))).toBe('Validation failed');
  });

  it('uses the message of a generic error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('uses a default message for anything else', () => {
    expect(getErrorMessage('oops')).toBe('Unexpected error.');
    expect(getErrorMessage(null)).toBe('Unexpected error.');
  });
});
