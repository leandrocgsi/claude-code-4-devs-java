import { useMutation, useQueryClient } from '@tanstack/react-query';
import cartService from '@/app/core/api/cart';
import { cartKeys } from '@/app/core/api/queryKeys';
import { getErrorMessage } from '@/app/core/utils/errorMessage';
import { useToast } from '@/hooks/useToast/useToast';

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const { show } = useToast();
  return useMutation({
    mutationFn: (itemId: number) => cartService.removeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
    onError: (error) => show('error', getErrorMessage(error)),
  });
}
