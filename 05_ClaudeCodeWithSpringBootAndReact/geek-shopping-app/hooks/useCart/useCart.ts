import { useCartStore } from '@/app/store/modules/cart/useCartStore';
import { findMockProduct } from '@/app/core/mocks/products';
import { Product } from '@/app/core/models/product';

export interface CartLineItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

const SHIPPING_FLAT_RATE = 10;

export function useCart() {
  const quantities = useCartStore((state) => state.quantities);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const items: CartLineItem[] = Object.entries(quantities)
    .map(([productId, quantity]) => {
      const product = findMockProduct(Number(productId));
      if (!product) return null;
      return { product, quantity, lineTotal: product.price * quantity };
    })
    .filter((item): item is CartLineItem => item !== null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = items.length > 0 ? SHIPPING_FLAT_RATE : 0;
  const total = subtotal + shipping;

  return { items, itemCount, subtotal, shipping, total, addItem, setQuantity, removeItem, clear };
}
