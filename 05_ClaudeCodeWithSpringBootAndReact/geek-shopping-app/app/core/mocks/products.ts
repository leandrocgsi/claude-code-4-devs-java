import { Product } from '@/app/core/models/product';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Mirrorless Camera with Zoom Lens',
    description: 'A mirrorless camera bundled with a versatile zoom lens, ready for travel and everyday shooting.',
    price: 549.0,
    originalPrice: 649.0,
    category: 'Electronics',
    imageUrl: '/assets/multishop/product-1.jpg',
    quantity: 8,
    rating: 5,
    reviewCount: 99,
    color: 'Black',
    size: 'Standard',
  },
  {
    id: 2,
    name: 'Crewneck Sweatshirt',
    description: 'A soft crewneck sweatshirt with ribbed cuffs and hem, cut for everyday comfort.',
    price: 45.0,
    category: 'Apparel',
    imageUrl: '/assets/multishop/product-2.jpg',
    quantity: 24,
    rating: 4.5,
    reviewCount: 99,
    color: 'Blue',
    size: 'M',
  },
  {
    id: 3,
    name: 'Ceramic Table Lamp',
    description: 'A ceramic table lamp with a pleated shade and gold trim, a warm accent for any room.',
    price: 89.0,
    category: 'Home & Living',
    imageUrl: '/assets/multishop/product-3.jpg',
    quantity: 14,
    rating: 4,
    reviewCount: 99,
    color: 'Brown',
    size: 'Standard',
  },
  {
    id: 4,
    name: 'Kids Sneakers',
    description: 'Lightweight kids sneakers with a hook-and-loop strap for an easy, secure fit.',
    price: 65.0,
    category: 'Footwear',
    imageUrl: '/assets/multishop/product-4.jpg',
    quantity: 0,
    rating: 3.5,
    reviewCount: 99,
    color: 'Black',
    size: 'S',
  },
  {
    id: 5,
    name: '4K Camera Drone',
    description: 'A foldable 4K camera drone with a 3-axis gimbal and GPS-assisted flight.',
    price: 899.0,
    originalPrice: 999.0,
    category: 'Electronics',
    imageUrl: '/assets/multishop/product-5.jpg',
    quantity: 5,
    rating: 5,
    reviewCount: 99,
    color: 'White',
    size: 'Standard',
  },
  {
    id: 6,
    name: 'Steel Smartwatch',
    description: 'A steel-cased smartwatch with a milanese loop band, heart-rate and activity tracking.',
    price: 329.0,
    category: 'Electronics',
    imageUrl: '/assets/multishop/product-6.jpg',
    quantity: 11,
    rating: 5,
    reviewCount: 99,
    color: 'Silver',
    size: 'Standard',
  },
  {
    id: 7,
    name: 'Lace Trim Blouse',
    description: 'A flowy blouse with lace-trimmed shoulders and long bell sleeves.',
    price: 55.0,
    category: 'Apparel',
    imageUrl: '/assets/multishop/product-7.jpg',
    quantity: 17,
    rating: 3,
    reviewCount: 99,
    color: 'Black',
    size: 'S',
  },
  {
    id: 8,
    name: 'Skincare Starter Set',
    description: 'A three-piece skincare starter set: cleanser, treatment, and rich moisturizer.',
    price: 39.0,
    category: 'Beauty',
    imageUrl: '/assets/multishop/product-8.jpg',
    quantity: 30,
    rating: 4.5,
    reviewCount: 99,
    color: 'N/A',
    size: 'Travel',
  },
  {
    id: 9,
    name: 'Ergonomic Office Chair',
    description: 'A cushioned ergonomic office chair with a reclining back and smooth-rolling casters.',
    price: 259.0,
    category: 'Home & Living',
    imageUrl: '/assets/multishop/product-9.jpg',
    quantity: 6,
    rating: 4,
    reviewCount: 99,
    color: 'Blue',
    size: 'Standard',
  },
];

export function findMockProduct(id: number): Product | undefined {
  return MOCK_PRODUCTS.find((product) => product.id === id);
}

export interface PriceBucket {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_BUCKETS: PriceBucket[] = [
  { id: 'all', label: 'All Price', min: 0, max: Infinity },
  { id: '0-100', label: '$0 - $100', min: 0, max: 100 },
  { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { id: '200-300', label: '$200 - $300', min: 200, max: 300 },
  { id: '300-400', label: '$300 - $400', min: 300, max: 400 },
  { id: '400-500', label: '$400 - $500', min: 400, max: 500 },
  { id: '500+', label: '$500 and up', min: 500, max: Infinity },
];

export function countProductsInPriceBucket(bucket: PriceBucket): number {
  if (bucket.id === 'all') return MOCK_PRODUCTS.length;
  return MOCK_PRODUCTS.filter((product) => product.price >= bucket.min && product.price < bucket.max).length;
}

export function getDistinctColors(): string[] {
  return Array.from(new Set(MOCK_PRODUCTS.map((product) => product.color).filter((color): color is string => !!color && color !== 'N/A')));
}

export function countProductsWithColor(color: string): number {
  return MOCK_PRODUCTS.filter((product) => product.color === color).length;
}

export function getDistinctSizes(): string[] {
  return Array.from(new Set(MOCK_PRODUCTS.map((product) => product.size).filter((size): size is string => !!size)));
}

export function countProductsWithSize(size: string): number {
  return MOCK_PRODUCTS.filter((product) => product.size === size).length;
}
