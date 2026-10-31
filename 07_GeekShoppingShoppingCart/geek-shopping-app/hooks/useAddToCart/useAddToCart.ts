import { useMutation, useQueryClient } from '@tanstack/react-query';
import cartService from '@/app/core/api/cart';
import { cartKeys } from '@/app/core/api/queryKeys';
import { getErrorMessage } from '@/app/core/utils/errorMessage';
import { useToast } from '@/hooks/useToast/useToast';

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const mutation = useMutation({
    mutationFn: (variables: { productId: number; quantity: number }) => cartService.addItem(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      show('success', 'Added to your cart.');
    },
    onError: (error) => show('error', getErrorMessage(error)),
  });

  const addItem = (productId: number, quantity = 1, onAdded?: () => void) =>
    mutation.mutate({ productId, quantity }, { onSuccess: onAdded });

  return { addItem, isPending: mutation.isPending };
}
