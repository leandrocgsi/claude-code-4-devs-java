import { useCartStore } from '@/app/store/modules/cart/useCartStore';

export function useCartCount() {
  return useCartStore((state) => Object.values(state.quantities).reduce((sum, quantity) => sum + quantity, 0));
}
