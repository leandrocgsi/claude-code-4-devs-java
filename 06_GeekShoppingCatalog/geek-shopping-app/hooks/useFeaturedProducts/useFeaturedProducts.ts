import { useQuery } from '@tanstack/react-query';
import productsService, { ShortcutQueryParams } from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export const useFeaturedProducts = (params: ShortcutQueryParams) =>
  useQuery({
    queryKey: productKeys.featured(params),
    queryFn: () => productsService.listFeatured(params),
    retry: 1,
  });
