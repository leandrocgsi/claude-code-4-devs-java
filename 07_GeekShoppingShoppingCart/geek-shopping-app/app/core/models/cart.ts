export interface CartItem {
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

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
}

export interface AddCartItemInput {
  productId: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
}
