import { useMutation, useQueryClient } from '@tanstack/react-query';
import productsService from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';
import { ProductInput } from '@/app/core/models/product';

interface UpdateProductVariables {
  product: ProductInput;
  image?: File | null;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ product, image }: UpdateProductVariables) => productsService.update(product, image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
