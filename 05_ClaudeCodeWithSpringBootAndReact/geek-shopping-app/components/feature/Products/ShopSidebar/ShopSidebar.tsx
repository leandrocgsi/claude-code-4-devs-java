import {
  PRICE_BUCKETS,
  countProductsInPriceBucket,
  countProductsWithColor,
  countProductsWithSize,
  getDistinctColors,
  getDistinctSizes,
} from '@/app/core/mocks/products';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import styles from './ShopSidebar.module.css';

interface ShopSidebarProps {
  priceBucketId: string;
  onPriceBucketChange: (id: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: string;
  onSizeChange: (size: string) => void;
}

export default function ShopSidebar({
  priceBucketId,
  onPriceBucketChange,
  color,
  onColorChange,
  size,
  onSizeChange,
}: ShopSidebarProps) {
  const colors = getDistinctColors();
  const sizes = getDistinctSizes();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.group}>
        <SectionTitle as="h5" size="sm" className={styles.groupTitle}>
          Filter by price
        </SectionTitle>
        <div className={styles.groupBody}>
          {PRICE_BUCKETS.map((bucket) => (
            <label key={bucket.id} className={styles.option}>
              <span className={styles.optionLabel}>
                <input
                  type="radio"
                  name="price-bucket"
                  checked={priceBucketId === bucket.id}
                  onChange={() => onPriceBucketChange(bucket.id)}
                />
                {bucket.label}
              </span>
              <span className={styles.count}>{countProductsInPriceBucket(bucket)}</span>
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
              <input type="radio" name="color" checked={color === 'all'} onChange={() => onColorChange('all')} />
              All Color
            </span>
          </label>
          {colors.map((colorOption) => (
            <label key={colorOption} className={styles.option}>
              <span className={styles.optionLabel}>
                <input
                  type="radio"
                  name="color"
                  checked={color === colorOption}
                  onChange={() => onColorChange(colorOption)}
                />
                {colorOption}
              </span>
              <span className={styles.count}>{countProductsWithColor(colorOption)}</span>
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
              <input type="radio" name="size" checked={size === 'all'} onChange={() => onSizeChange('all')} />
              All Size
            </span>
          </label>
          {sizes.map((sizeOption) => (
            <label key={sizeOption} className={styles.option}>
              <span className={styles.optionLabel}>
                <input type="radio" name="size" checked={size === sizeOption} onChange={() => onSizeChange(sizeOption)} />
                {sizeOption}
              </span>
              <span className={styles.count}>{countProductsWithSize(sizeOption)}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
