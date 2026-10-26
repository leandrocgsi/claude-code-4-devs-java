import { useQuery } from '@tanstack/react-query';
import productsService, { ShortcutQueryParams } from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export const useRecentProducts = (params: ShortcutQueryParams) =>
  useQuery({
    queryKey: productKeys.recent(params),
    queryFn: () => productsService.listRecent(params),
    retry: 1,
  });
