import { Facets } from '@/app/core/models/facets';
import { formatPrice } from '@/app/core/utils/currency';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import styles from './ShopSidebar.module.css';

export interface PriceSelection {
  minPrice?: number;
  maxPrice?: number;
}

interface ShopSidebarProps {
  facets?: Facets;
  price: PriceSelection;
  onPriceChange: (price: PriceSelection) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: string;
  onSizeChange: (size: string) => void;
}

const PRICE_CENT = 0.01;

function upperBound(max: number | null): number | undefined {
  return max === null ? undefined : Number((max - PRICE_CENT).toFixed(2));
}

function priceLabel(min: number, max: number | null): string {
  return max === null ? `${formatPrice(min)}+` : `${formatPrice(min)} - ${formatPrice(max)}`;
}

export default function ShopSidebar({
  facets,
  price,
  onPriceChange,
  category,
  onCategoryChange,
  color,
  onColorChange,
  size,
  onSizeChange,
}: ShopSidebarProps) {
  const totalProducts = facets?.priceRanges.reduce((sum, range) => sum + range.count, 0) ?? 0;
  const allPrices = price.minPrice === undefined && price.maxPrice === undefined;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.group}>
        <SectionTitle as="h5" size="sm" className={styles.groupTitle}>
          Filter by price
        </SectionTitle>
        <div className={styles.groupBody}>
          <label className={styles.option}>
            <span className={styles.optionLabel}>
              <input type="radio" name="price-range" checked={allPrices} onChange={() => onPriceChange({ minPrice: undefined, maxPrice: undefined })}
              />
              All Price
            </span>
            <span className={styles.count}>{totalProducts}</span>
          </label>
          {facets?.priceRanges.map((range) => {
            const maxPrice = upperBound(range.max);
            const selected = price.minPrice === range.min && price.maxPrice === maxPrice;
            return (
              <label key={range.min} className={styles.option}>
                <span className={styles.optionLabel}>
                  <input
                    type="radio"
                    name="price-range"
                    checked={selected}
                    onChange={() => onPriceChange({ minPrice: range.min, maxPrice })}
                  />
                  {priceLabel(range.min, range.max)}
                </span>
                <span className={styles.count}>{range.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.group}>
        <SectionTitle as="h5" size="sm" className={styles.groupTitle}>
          Filter by category
        </SectionTitle>
        <div className={styles.groupBody}>
          <label className={styles.option}>
            <span className={styles.optionLabel}>
              <input type="radio" name="category" checked={category === ''} onChange={() => onCategoryChange('')} />
              All Category
            </span>
          </label>
          {facets?.categories.map((item) => (
            <label key={item.name} className={styles.option}>
              <span className={styles.optionLabel}>
                <input
                  type="radio"
                  name="category"
                  checked={category === item.name}
                  onChange={() => onCategoryChange(item.name)}
                />
                {item.name}
              </span>
              <span className={styles.count}>{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <SectionTitle as="h5" size="sm" className={styles.groupTitle}>
          Filter by color
        </SectionTitle>
        <div className={styles.groupBody}>
          <label className={styles.option}>
            <span className={styles.optionLabel}>
              <input type="radio" name="color" checked={color === ''} onChange={() => onColorChange('')} />
              All Color
            </span>
          </label>
          {facets?.colors.map((item) => (
            <label key={item.name} className={styles.option}>
              <span className={styles.optionLabel}>
                <input type="radio" name="color" checked={color === item.name} onChange={() => onColorChange(item.name)} />
                {item.name}
              </span>
              <span className={styles.count}>{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <SectionTitle as="h5" size="sm" className={styles.groupTitle}>
          Filter by size
        </SectionTitle>
        <div className={styles.groupBody}>
          <label className={styles.option}>
            <span className={styles.optionLabel}>
              <input type="radio" name="size" checked={size === ''} onChange={() => onSizeChange('')} />
              All Size
            </span>
          </label>
          {facets?.sizes.map((item) => (
            <label key={item.name} className={styles.option}>
              <span className={styles.optionLabel}>
                <input type="radio" name="size" checked={size === item.name} onChange={() => onSizeChange(item.name)} />
                {item.name}
              </span>
              <span className={styles.count}>{item.count}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
