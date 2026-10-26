import { keepPreviousData, useQuery } from '@tanstack/react-query';
import productsService, { ProductsQueryParams } from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export const useProducts = (params: ProductsQueryParams) =>
  useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.list(params),
    placeholderData: keepPreviousData,
    retry: 1,
  });
