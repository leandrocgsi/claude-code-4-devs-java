import { create } from 'zustand';

interface ProductFiltersStore {
  search: string;
  setSearch: (search: string) => void;
}

export const useProductFiltersStore = create<ProductFiltersStore>((set) => ({
  search: '',
  setSearch: (search) => set({ search }),
}));
