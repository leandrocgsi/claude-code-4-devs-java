import { FaHeart, FaRegHeart, FaSearch, FaShoppingCart, FaStar, FaStarHalfAlt, FaSyncAlt } from 'react-icons/fa';
import { Product } from '@/app/core/models/product';
import { useIsWishlisted, useWishlist } from '@/hooks/useWishlist/useWishlist';
import { useCart } from '@/hooks/useCart/useCart';
import { formatPrice } from '@/app/core/utils/currency';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

function Rating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const filled = index + 1 <= Math.floor(rating);
    const half = !filled && index < rating;
    if (filled) return <FaStar key={index} />;
    if (half) return <FaStarHalfAlt key={index} />;
    return <FaStar key={index} className={styles.starEmpty} />;
  });
  return (
    <div className={styles.rating}>
      {stars}
      {reviewCount ? <span className={styles.reviewCount}>({reviewCount})</span> : null}
    </div>
  );
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const isWishlisted = useIsWishlisted(product.id);
  const { toggle } = useWishlist();
  const { addItem } = useCart();
  const outOfStock = product.quantity <= 0;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={product.imageUrl} alt={product.name} className={styles.image} />
        {outOfStock ? <span className={styles.outOfStock}>Out of stock</span> : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => addItem(product.id)}
            disabled={outOfStock}
            title={outOfStock ? 'Out of stock' : 'Add to cart'}
          >
            <FaShoppingCart />
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => toggle(product.id)}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? <FaHeart /> : <FaRegHeart />}
          </button>
          <button type="button" className={styles.actionButton} disabled title="Compare (coming soon)">
            <FaSyncAlt />
          </button>
          <button type="button" className={styles.actionButton} onClick={() => onQuickView(product)} title="Quick view">
            <FaSearch />
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{product.category}</span>
        <p className={styles.name}>{product.name}</p>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.originalPrice ? <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span> : null}
        </div>
        {product.rating ? <Rating rating={product.rating} reviewCount={product.reviewCount} /> : null}
      </div>
    </div>
  );
}
