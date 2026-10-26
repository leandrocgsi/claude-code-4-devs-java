export interface FacetItem {
  name: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number | null;
  count: number;
}

export interface Facets {
  priceRanges: PriceRange[];
  colors: FacetItem[];
  sizes: FacetItem[];
  categories: FacetItem[];
}
