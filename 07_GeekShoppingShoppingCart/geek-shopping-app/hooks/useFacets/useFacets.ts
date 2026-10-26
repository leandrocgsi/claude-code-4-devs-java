import { keepPreviousData, useQuery } from '@tanstack/react-query';
import productsService, { FacetsQueryParams } from '@/app/core/api/products';
import { productKeys } from '@/app/core/api/queryKeys';

export const useFacets = (params: FacetsQueryParams) =>
  useQuery({
    queryKey: productKeys.facets(params),
    queryFn: () => productsService.facets(params),
    placeholderData: keepPreviousData,
    retry: 1,
  });
