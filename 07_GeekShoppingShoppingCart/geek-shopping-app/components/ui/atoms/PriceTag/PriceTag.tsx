import { formatPrice } from '@/app/core/utils/currency';
import styles from './PriceTag.module.css';

interface PriceTagProps {
  price: number;
  oldPrice?: number | null;
  size?: 'md' | 'lg';
}

export default function PriceTag({ price, oldPrice, size = 'md' }: PriceTagProps) {
  return (
    <span className={styles.row}>
      <span className={size === 'lg' ? styles.priceLarge : styles.price}>{formatPrice(price)}</span>
      {oldPrice ? <span className={styles.oldPrice}>{formatPrice(oldPrice)}</span> : null}
    </span>
  );
}
