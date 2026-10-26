import { useWishlistStore } from '@/app/store/modules/global/useWishlistStore';

export function useWishlist() {
  const productIds = useWishlistStore((state) => state.productIds);
  const toggle = useWishlistStore((state) => state.toggle);
  return { count: productIds.size, toggle };
}

export function useIsWishlisted(productId: number) {
  return useWishlistStore((state) => state.productIds.has(productId));
}
