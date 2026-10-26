import { useQuery } from '@tanstack/react-query';
import productsService from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export const useCategories = () =>
  useQuery({
    queryKey: productKeys.categories,
    queryFn: () => productsService.categories(),
    retry: 1,
  });
