import { toPageResponse } from '../hal';

const identity = <T>(item: T) => item;

describe('toPageResponse', () => {
  it('maps the embedded items and the page metadata', () => {
    const result = toPageResponse(
      {
        _embedded: { products: [{ id: 1 }, { id: 2 }] },
        page: { size: 2, number: 1, totalElements: 6, totalPages: 3 },
      },
      identity,
    );

    expect(result.content).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.totalElements).toBe(6);
    expect(result.totalPages).toBe(3);
    expect(result.size).toBe(2);
    expect(result.number).toBe(1);
    expect(result.empty).toBe(false);
  });

  it('reads the items whatever the collection relation is called', () => {
    const result = toPageResponse({ _embedded: { people: [{ id: 7 }] } }, identity);

    expect(result.content).toEqual([{ id: 7 }]);
  });

  it('applies the mapper to every item', () => {
    const result = toPageResponse({ _embedded: { products: [{ id: 1 }, { id: 2 }] } }, (item: { id: number }) => item.id * 10);

    expect(result.content).toEqual([10, 20]);
  });

  it('marks the first page as first and not last when there are more pages', () => {
    const result = toPageResponse(
      { _embedded: { products: [{ id: 1 }] }, page: { size: 1, number: 0, totalElements: 3, totalPages: 3 } },
      identity,
    );

    expect(result.first).toBe(true);
    expect(result.last).toBe(false);
  });

  it('marks a middle page as neither first nor last', () => {
    const result = toPageResponse(
      { _embedded: { products: [{ id: 2 }] }, page: { size: 1, number: 1, totalElements: 3, totalPages: 3 } },
      identity,
    );

    expect(result.first).toBe(false);
    expect(result.last).toBe(false);
  });

  it('marks the last page as last', () => {
    const result = toPageResponse(
      { _embedded: { products: [{ id: 3 }] }, page: { size: 1, number: 2, totalElements: 3, totalPages: 3 } },
      identity,
    );

    expect(result.first).toBe(false);
    expect(result.last).toBe(true);
  });

  it('marks a single page as both first and last', () => {
    const result = toPageResponse(
      { _embedded: { products: [{ id: 1 }] }, page: { size: 12, number: 0, totalElements: 1, totalPages: 1 } },
      identity,
    );

    expect(result.first).toBe(true);
    expect(result.last).toBe(true);
  });

  it('handles an empty page that has no _embedded', () => {
    const result = toPageResponse({ page: { size: 12, number: 0, totalElements: 0, totalPages: 0 } }, identity);

    expect(result.content).toEqual([]);
    expect(result.empty).toBe(true);
    expect(result.totalElements).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.first).toBe(true);
    expect(result.last).toBe(true);
  });

  it('derives the page metadata from the items when the page object is missing', () => {
    const result = toPageResponse({ _embedded: { products: [{ id: 1 }, { id: 2 }] } }, identity);

    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.size).toBe(2);
    expect(result.number).toBe(0);
    expect(result.last).toBe(true);
  });

  it('returns an empty first and last page for a body with nothing at all', () => {
    const result = toPageResponse({}, identity);

    expect(result.content).toEqual([]);
    expect(result.empty).toBe(true);
    expect(result.totalPages).toBe(0);
    expect(result.first).toBe(true);
    expect(result.last).toBe(true);
  });
});
