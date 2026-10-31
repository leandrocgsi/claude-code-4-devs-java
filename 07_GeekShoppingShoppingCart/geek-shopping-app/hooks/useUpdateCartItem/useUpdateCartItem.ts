import { useMutation, useQueryClient } from '@tanstack/react-query';
import cartService from '@/app/core/api/cart';
import { cartKeys } from '@/app/core/api/queryKeys';

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}
