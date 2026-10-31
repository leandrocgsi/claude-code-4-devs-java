import { api } from './httpClient';
import { AddCartItemInput, Cart, CartItem } from '@/app/core/models/cart';
import { toApiUrl } from '@/app/core/utils/apiUrl';

interface CartItemResponse {
  id: number;
  productId: number;
  name: string;
  imageUrl?: string | null;
  color?: string | null;
  size?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
}

interface CartResponse {
  items?: CartItemResponse[];
  itemCount: number;
  subtotal: number;
  shipping?: number;
  total: number;
}

const CART_PATH = '/api/cart/v1';

function toCartItem(response: CartItemResponse): CartItem {
  return {
    id: response.id,
    productId: response.productId,
    name: response.name,
    imageUrl: response.imageUrl ? toApiUrl(response.imageUrl) : null,
    color: response.color,
    size: response.size,
    unitPrice: response.unitPrice,
    quantity: response.quantity,
    lineTotal: response.lineTotal,
    stock: response.stock,
  };
}

function toCart(response: CartResponse): Cart {
  return {
    items: (response.items ?? []).map(toCartItem),
    itemCount: response.itemCount,
    subtotal: response.subtotal,
    shipping: response.shipping ?? 0,
    total: response.total,
  };
}

const cartService = {
  async get(): Promise<Cart> {
    const { data } = await api.get<CartResponse>(CART_PATH);
    return toCart(data);
  },

  async addItem(input: AddCartItemInput): Promise<Cart> {
    const { data } = await api.post<CartResponse>(`${CART_PATH}/items`, input);
    return toCart(data);
  },

  async updateItem(itemId: number, quantity: number): Promise<Cart> {
    const { data } = await api.put<CartResponse>(`${CART_PATH}/items/${itemId}`, { quantity });
    return toCart(data);
  },

  async removeItem(itemId: number): Promise<void> {
    await api.delete(`${CART_PATH}/items/${itemId}`);
  },

  async clear(): Promise<void> {
    await api.delete(CART_PATH);
  },
};

export default cartService;
