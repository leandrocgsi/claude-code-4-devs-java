import { useQuery } from '@tanstack/react-query';
import productsService, { ProductsQueryParams } from '@/app/core/api/products';

export const useProducts = (params: ProductsQueryParams) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => productsService.list(params),
    retry: 1,
  });
