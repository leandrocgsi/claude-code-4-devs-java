import { useCart } from '@/hooks/useCart/useCart';

export function useCartCount() {
  return useCart().itemCount;
}
