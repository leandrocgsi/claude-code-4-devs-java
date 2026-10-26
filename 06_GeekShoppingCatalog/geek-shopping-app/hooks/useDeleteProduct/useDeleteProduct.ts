import { useMutation, useQueryClient } from '@tanstack/react-query';
import productsService from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
