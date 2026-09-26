import { useProductFiltersStore } from '@/app/store/modules/products/useProductFiltersStore';

export function useProductFilters() {
  const search = useProductFiltersStore((state) => state.search);
  const setSearch = useProductFiltersStore((state) => state.setSearch);
  return { search, setSearch };
}
