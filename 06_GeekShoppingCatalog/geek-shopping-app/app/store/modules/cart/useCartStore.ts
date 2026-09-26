import { create } from 'zustand';

interface CartStore {
  quantities: Record<number, number>;
  addItem: (productId: number, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
}

const INITIAL_MOCK_QUANTITIES: Record<number, number> = { 1: 1, 6: 2, 9: 1 };

export const useCartStore = create<CartStore>((set) => ({
  quantities: INITIAL_MOCK_QUANTITIES,
  addItem: (productId, quantity = 1) =>
    set((state) => ({
      quantities: { ...state.quantities, [productId]: (state.quantities[productId] ?? 0) + quantity },
    })),
  setQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        const next = { ...state.quantities };
        delete next[productId];
        return { quantities: next };
      }
      return { quantities: { ...state.quantities, [productId]: quantity } };
    }),
  removeItem: (productId) =>
    set((state) => {
      const next = { ...state.quantities };
      delete next[productId];
      return { quantities: next };
    }),
  clear: () => set({ quantities: {} }),
}));
