import { act, renderHook } from '@testing-library/react';
import { PAGE_SIZE_OPTIONS, useProductSearchParams } from '../useProductSearchParams/useProductSearchParams';

const push = vi.fn();
let currentParams = new URLSearchParams();
let currentPath = '/products';

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentParams,
  useRouter: () => ({ push }),
  usePathname: () => currentPath,
}));

function setUrl(query: string, path = '/products') {
  currentParams = new URLSearchParams(query);
  currentPath = path;
}

function pushedParams(): URLSearchParams {
  const target = push.mock.calls.at(-1)?.[0] as string;
  return new URLSearchParams(target.split('?')[1] ?? '');
}

describe('useProductSearchParams', () => {
  beforeEach(() => {
    push.mockClear();
    setUrl('');
  });

  it('reads the defaults from an empty url', () => {
    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search).toEqual({
      page: 0,
      size: 12,
      direction: 'desc',
      sortBy: 'createdAt',
      q: '',
      category: '',
      minPrice: undefined,
      maxPrice: undefined,
      color: '',
      productSize: '',
    });
  });

  it('reads every parameter from the url', () => {
    setUrl('page=2&size=24&direction=asc&sortBy=price&q=mug&category=Mug&minPrice=10&maxPrice=99.5&color=Black&productSize=M');

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search).toEqual({
      page: 2,
      size: 24,
      direction: 'asc',
      sortBy: 'price',
      q: 'mug',
      category: 'Mug',
      minPrice: 10,
      maxPrice: 99.5,
      color: 'Black',
      productSize: 'M',
    });
  });

  it.each(['-1', '1.5', 'abc', ''])('falls back to page 0 for the invalid page "%s"', (page) => {
    setUrl(`page=${page}`);

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search.page).toBe(0);
  });

  it.each(['5', '100', 'abc'])('falls back to size 12 when the size "%s" is not an option', (size) => {
    setUrl(`size=${size}`);

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search.size).toBe(12);
  });

  it.each(PAGE_SIZE_OPTIONS)('accepts the page size option %i', (size) => {
    setUrl(`size=${size}`);

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search.size).toBe(size);
  });

  it('ignores an unknown sort field and an unknown direction', () => {
    setUrl('sortBy=color&direction=sideways');

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search.sortBy).toBe('createdAt');
    expect(result.current.search.direction).toBe('desc');
  });

  it.each(['name', 'price', 'createdAt', 'popularity', 'rating'])('accepts the sort field %s', (field) => {
    setUrl(`sortBy=${field}`);

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search.sortBy).toBe(field);
  });

  it('ignores prices that are not numbers', () => {
    setUrl('minPrice=abc&maxPrice=');

    const { result } = renderHook(() => useProductSearchParams());

    expect(result.current.search.minPrice).toBeUndefined();
    expect(result.current.search.maxPrice).toBeUndefined();
  });

  it('puts a changed filter in the url and drops the defaults', () => {
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ category: 'Mug' }));

    expect(push).toHaveBeenCalledWith('/products?category=Mug');
  });

  it('goes back to the bare path when everything is default', () => {
    setUrl('category=Mug');
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ category: '' }));

    expect(push).toHaveBeenCalledWith('/products');
  });

  it('resets the page to 0 when a filter changes', () => {
    setUrl('page=3&category=Mug');
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ color: 'Black' }));

    const params = pushedParams();
    expect(params.has('page')).toBe(false);
    expect(params.get('category')).toBe('Mug');
    expect(params.get('color')).toBe('Black');
  });

  it('resets the page to 0 when the sort changes', () => {
    setUrl('page=3');
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ sortBy: 'rating', direction: 'desc' }));

    const params = pushedParams();
    expect(params.has('page')).toBe(false);
    expect(params.get('sortBy')).toBe('rating');
  });

  it('keeps the page that was asked for explicitly', () => {
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ page: 4 }));

    expect(pushedParams().get('page')).toBe('4');
  });

  it('serializes the non-default size, direction and prices', () => {
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ size: 36, direction: 'asc', minPrice: 0, maxPrice: 199.99 }));

    const params = pushedParams();
    expect(params.get('size')).toBe('36');
    expect(params.get('direction')).toBe('asc');
    expect(params.get('minPrice')).toBe('0');
    expect(params.get('maxPrice')).toBe('199.99');
  });

  it('encodes the search text', () => {
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ q: 'mug & cup' }));

    expect(push).toHaveBeenCalledWith('/products?q=mug+%26+cup');
  });

  it('uses the current pathname', () => {
    setUrl('', '/other');
    const { result } = renderHook(() => useProductSearchParams());

    act(() => result.current.update({ q: 'x' }));

    expect(push).toHaveBeenCalledWith('/other?q=x');
  });
});
