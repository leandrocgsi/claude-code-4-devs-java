import { useQuery } from '@tanstack/react-query';
import cartService from '@/app/core/api/cart';
import { cartKeys } from '@/app/core/api/queryKeys';
import { CartItem } from '@/app/core/models/cart';

const NO_ITEMS: CartItem[] = [];

export function useCart() {
  const query = useQuery({
    queryKey: cartKeys.all,
    queryFn: () => cartService.get(),
    retry: 1,
  });

  return {
    items: query.data?.items ?? NO_ITEMS,
    itemCount: query.data?.itemCount ?? 0,
    subtotal: query.data?.subtotal ?? 0,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
