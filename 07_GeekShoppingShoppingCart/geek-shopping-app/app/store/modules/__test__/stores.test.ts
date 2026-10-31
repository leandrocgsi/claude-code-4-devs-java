import { useCartTokenStore } from '../cart/useCartTokenStore';
import { useToastStore } from '../global/useToastStore';
import { useWishlistStore } from '../global/useWishlistStore';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TOKEN_STORAGE_KEY = 'geek-shopping-cart-token';

describe('useCartTokenStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartTokenStore.setState({ token: null });
  });

  it('starts without a token', () => {
    expect(useCartTokenStore.getState().token).toBeNull();
  });

  it('generates a UUID the first time a token is needed', () => {
    const token = useCartTokenStore.getState().ensureToken();

    expect(token).toMatch(UUID_PATTERN);
    expect(useCartTokenStore.getState().token).toBe(token);
  });

  it('keeps the same token on the next calls', () => {
    const first = useCartTokenStore.getState().ensureToken();
    const second = useCartTokenStore.getState().ensureToken();

    expect(second).toBe(first);
  });

  it('persists only the token in localStorage', () => {
    const token = useCartTokenStore.getState().ensureToken();

    const stored = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) as string);
    expect(stored.state).toEqual({ token });
    expect(stored.version).toBe(1);
  });

  it('still returns a token when localStorage refuses to save it', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is full');
    });

    try {
      const token = useCartTokenStore.getState().ensureToken();

      expect(token).toMatch(UUID_PATTERN);
      expect(useCartTokenStore.getState().token).toBe(token);
    } finally {
      setItem.mockRestore();
    }
  });

  it('starts without a token when localStorage refuses to read', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked');
    });

    try {
      await useCartTokenStore.persist.rehydrate();

      expect(useCartTokenStore.getState().ensureToken()).toMatch(UUID_PATTERN);
    } finally {
      getItem.mockRestore();
    }
  });

  it('rehydrates the token saved by a previous visit', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ state: { token: 'saved-token' }, version: 1 }));

    await useCartTokenStore.persist.rehydrate();

    expect(useCartTokenStore.getState().ensureToken()).toBe('saved-token');
  });
});

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('starts empty', () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('adds toasts with distinct ids, tone and message', () => {
    useToastStore.getState().show('success', 'Saved');
    useToastStore.getState().show('error', 'Failed');

    const toasts = useToastStore.getState().toasts;
    expect(toasts.map((toast) => [toast.tone, toast.message])).toEqual([
      ['success', 'Saved'],
      ['error', 'Failed'],
    ]);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('dismisses only the chosen toast', () => {
    useToastStore.getState().show('info', 'One');
    useToastStore.getState().show('info', 'Two');
    const [first] = useToastStore.getState().toasts;

    useToastStore.getState().dismiss(first.id);

    expect(useToastStore.getState().toasts.map((toast) => toast.message)).toEqual(['Two']);
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
