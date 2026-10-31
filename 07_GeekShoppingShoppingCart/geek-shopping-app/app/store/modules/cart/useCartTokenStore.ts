import { create } from 'zustand';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';
import { generateUuid } from '@/app/core/utils/uuid';

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      return;
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      return;
    }
  },
};

interface CartTokenStore {
  token: string | null;
  ensureToken: () => string;
}

export const useCartTokenStore = create<CartTokenStore>()(
  persist(
    (set, get) => ({
      token: null,
      ensureToken: () => {
        const current = get().token;
        if (current) return current;
        const token = generateUuid();
        set({ token });
        return token;
      },
    }),
    {
      name: 'geek-shopping-cart-token',
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
