import { useCartStore } from '../cart/useCartStore';
import { useWishlistStore } from '../global/useWishlistStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ quantities: {} });
  });

  it('starts empty and without any pre-seeded product', () => {
    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('adds one unit by default', () => {
    useCartStore.getState().addItem(5);

    expect(useCartStore.getState().quantities).toEqual({ 5: 1 });
  });

  it('adds the given quantity', () => {
    useCartStore.getState().addItem(5, 3);

    expect(useCartStore.getState().quantities).toEqual({ 5: 3 });
  });

  it('sums the quantity of a product that is already in the cart', () => {
    useCartStore.getState().addItem(5, 2);
    useCartStore.getState().addItem(5, 4);

    expect(useCartStore.getState().quantities).toEqual({ 5: 6 });
  });

  it('keeps different products apart', () => {
    useCartStore.getState().addItem(1);
    useCartStore.getState().addItem(2, 2);

    expect(useCartStore.getState().quantities).toEqual({ 1: 1, 2: 2 });
  });

  it('replaces the quantity with setQuantity', () => {
    useCartStore.getState().addItem(5, 4);
    useCartStore.getState().setQuantity(5, 2);

    expect(useCartStore.getState().quantities).toEqual({ 5: 2 });
  });

  it('removes the product when the quantity is set to zero', () => {
    useCartStore.getState().addItem(5, 4);
    useCartStore.getState().setQuantity(5, 0);

    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('removes the product when the quantity is negative', () => {
    useCartStore.getState().addItem(5, 4);
    useCartStore.getState().setQuantity(5, -1);

    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('removes a single product and keeps the others', () => {
    useCartStore.getState().addItem(1);
    useCartStore.getState().addItem(2);
    useCartStore.getState().removeItem(1);

    expect(useCartStore.getState().quantities).toEqual({ 2: 1 });
  });

  it('ignores the removal of a product that is not in the cart', () => {
    useCartStore.getState().addItem(1);
    useCartStore.getState().removeItem(9);

    expect(useCartStore.getState().quantities).toEqual({ 1: 1 });
  });

  it('clears everything', () => {
    useCartStore.getState().addItem(1);
    useCartStore.getState().addItem(2);
    useCartStore.getState().clear();

    expect(useCartStore.getState().quantities).toEqual({});
  });

  it('never mutates the previous state object', () => {
    useCartStore.getState().addItem(1);
    const before = useCartStore.getState().quantities;
    useCartStore.getState().addItem(2);

    expect(before).toEqual({ 1: 1 });
  });
});

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
  });

  it('starts empty', () => {
    expect(useWishlistStore.getState().productIds.size).toBe(0);
  });

  it('adds a product when it is toggled on', () => {
    useWishlistStore.getState().toggle(3);

    expect(useWishlistStore.getState().has(3)).toBe(true);
  });

  it('removes the product when it is toggled twice', () => {
    useWishlistStore.getState().toggle(3);
    useWishlistStore.getState().toggle(3);

    expect(useWishlistStore.getState().has(3)).toBe(false);
    expect(useWishlistStore.getState().productIds.size).toBe(0);
  });

  it('keeps other products when one is toggled off', () => {
    useWishlistStore.getState().toggle(1);
    useWishlistStore.getState().toggle(2);
    useWishlistStore.getState().toggle(1);

    expect([...useWishlistStore.getState().productIds]).toEqual([2]);
  });

  it('replaces the set on every toggle so selectors see the change', () => {
    const before = useWishlistStore.getState().productIds;
    useWishlistStore.getState().toggle(1);

    expect(useWishlistStore.getState().productIds).not.toBe(before);
    expect(before.size).toBe(0);
  });
});
