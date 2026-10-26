import { useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import productsService from '@/app/core/api/products';
import { ApiError } from '@/app/core/api/httpClient';
import { productKeys } from '@/app/core/api/queryKeys';
import { Product } from '@/app/core/models/product';

export interface CartLineItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

const SHIPPING_FLAT_RATE = 10;
const NOT_FOUND = 404;

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === NOT_FOUND;
}

export function useCart() {
  const quantities = useCartStore((state) => state.quantities);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const productIds = Object.keys(quantities).map(Number);
  const queries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: productKeys.detail(id),
      queryFn: () => productsService.findById(id),
      retry: (failureCount: number, error: unknown) => !isNotFound(error) && failureCount < 1,
    })),
  });

  const missingIds = productIds.filter((_, index) => isNotFound(queries[index].error));
  const missingKey = missingIds.join(',');

  useEffect(() => {
    if (!missingKey) return;
    missingKey.split(',').forEach((id) => removeItem(Number(id)));
  }, [missingKey, removeItem]);

  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError && !isNotFound(query.error));
  const refetch = () => queries.forEach((query) => query.isError && query.refetch());

  const items: CartLineItem[] = productIds
    .map((id, index) => {
      const product = queries[index].data;
      if (!product) return null;
      const quantity = product.quantity > 0 ? Math.min(quantities[id], product.quantity) : quantities[id];
      return { product, quantity, lineTotal: product.price * quantity };
    })
    .filter((item): item is CartLineItem => item !== null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = items.length > 0 ? SHIPPING_FLAT_RATE : 0;
  const total = subtotal + shipping;

  return {
    items,
    isLoading,
    isError,
    refetch,
    itemCount,
    subtotal,
    shipping,
    total,
    addItem,
    setQuantity,
    removeItem,
    clear,
  };
}
