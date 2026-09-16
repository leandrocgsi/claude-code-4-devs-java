import { MOCK_PRODUCTS } from './products';

export interface MockCategory {
  id: number;
  name: string;
  imageUrl: string;
}

const GRID_IMAGES = [
  '/assets/multishop/cat-1.jpg',
  '/assets/multishop/cat-2.jpg',
  '/assets/multishop/cat-3.jpg',
  '/assets/multishop/cat-4.jpg',
];

const DISTINCT_CATEGORIES = Array.from(new Set(MOCK_PRODUCTS.map((product) => product.category)));

const GRID_CELL_COUNT = 12;

export const MOCK_CATEGORY_GRID: MockCategory[] = Array.from({ length: GRID_CELL_COUNT }, (_, index) => ({
  id: index,
  name: DISTINCT_CATEGORIES[index % DISTINCT_CATEGORIES.length],
  imageUrl: GRID_IMAGES[index % GRID_IMAGES.length],
}));

export function countProductsInCategory(name: string): number {
  return MOCK_PRODUCTS.filter((product) => product.category === name).length;
}

export const NAV_CATEGORY_LINKS = [
  'Dresses',
  'Shirts',
  'Jeans',
  'Swimwear',
  'Sleepwear',
  'Sportswear',
  'Jumpsuits',
  'Blazers',
  'Jackets',
  'Shoes',
];
