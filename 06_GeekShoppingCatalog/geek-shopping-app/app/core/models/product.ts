export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  quantity: number;
  featured: boolean;
  createdAt: string;
  color?: string | null;
  size?: string | null;
  popularity: number;
  rating?: number | null;
  reviewCount: number;
  imageUrl?: string | null;
}

export interface ProductInput {
  id?: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  featured: boolean;
}

export type ProductSortField = 'name' | 'price' | 'createdAt' | 'popularity' | 'rating';
