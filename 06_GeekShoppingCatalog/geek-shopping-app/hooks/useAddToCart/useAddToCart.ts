import { useCartStore } from '@/app/store/modules/cart/useCartStore';

export function useAddToCart() {
  return useCartStore((state) => state.addItem);
}
