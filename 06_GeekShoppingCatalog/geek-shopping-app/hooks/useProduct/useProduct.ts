import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/app/core/api/httpClient';
import productsService from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export const useProduct = (id: number) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.findById(id),
    enabled: Number.isInteger(id) && id > 0,
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });
