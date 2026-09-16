import { create } from 'zustand';

interface WishlistStore {
  productIds: Set<number>;
  toggle: (productId: number) => void;
  has: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  productIds: new Set(),
  toggle: (productId) =>
    set((state) => {
      const next = new Set(state.productIds);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return { productIds: next };
    }),
  has: (productId) => get().productIds.has(productId),
}));
