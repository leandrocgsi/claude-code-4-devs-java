export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  quantity: number;
  rating?: number;
  reviewCount?: number;
  originalPrice?: number;
  color?: string;
  size?: string;
}
