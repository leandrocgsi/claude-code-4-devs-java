import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { Product } from '@/app/core/models/product';
import { formatPrice } from '@/app/core/utils/currency';
import { useCart } from '@/hooks/useCart/useCart';
import Button from '@/components/ui/atoms/Button';
import styles from './ProductDetails.module.css';

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { addItem } = useCart();
  const inStock = product.quantity > 0;

  return (
    <div className={styles.wrapper}>
      <img src={product.imageUrl} alt={product.name} className={styles.image} />
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        {product.rating ? (
          <div className={styles.rating}>
            {Array.from({ length: 5 }, (_, index) => {
              const filled = index + 1 <= Math.floor(product.rating ?? 0);
              const half = !filled && index < (product.rating ?? 0);
              if (filled) return <FaStar key={index} />;
              if (half) return <FaStarHalfAlt key={index} />;
              return <FaStar key={index} className={styles.starEmpty} />;
            })}
            {product.reviewCount ? <span className={styles.reviewCount}>({product.reviewCount})</span> : null}
          </div>
        ) : null}
        <p className={styles.description}>{product.description}</p>
        <div className={styles.meta}>
          <span className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {product.originalPrice ? <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span> : null}
          </span>
          <span className={inStock ? styles.inStock : styles.outOfStock}>
            {inStock ? `${product.quantity} in stock` : 'Out of stock'}
          </span>
        </div>
        <Button variant="primary" disabled={!inStock} onClick={() => addItem(product.id)}>
          {inStock ? 'Add to Cart' : 'Out of stock'}
        </Button>
      </div>
    </div>
  );
}
