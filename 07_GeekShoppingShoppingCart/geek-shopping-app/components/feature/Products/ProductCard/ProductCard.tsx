import Link from 'next/link';
import { FaHeart, FaRegHeart, FaSearch, FaShoppingCart, FaSyncAlt } from 'react-icons/fa';
import { Product } from '@/app/core/models/product';
import { useIsWishlisted, useWishlist } from '@/hooks/useWishlist/useWishlist';
import { useAddToCart } from '@/hooks/useAddToCart/useAddToCart';
import PriceTag from '@/components/ui/atoms/PriceTag';
import ProductImage from '@/components/ui/atoms/ProductImage';
import RatingStars from '@/components/ui/atoms/RatingStars';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const isWishlisted = useIsWishlisted(product.id);
  const { toggle } = useWishlist();
  const { addItem, isPending } = useAddToCart();
  const outOfStock = product.quantity <= 0;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <ProductImage src={product.imageUrl} alt={product.name} className={styles.image} />
        {outOfStock ? <span className={styles.outOfStock}>Out of stock</span> : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => addItem(product.id)}
            disabled={outOfStock || isPending}
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
        <Link href={`/products/${product.id}`} className={styles.name}>
          {product.name}
        </Link>
        <PriceTag price={product.price} oldPrice={product.oldPrice} />
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
      </div>
    </div>
  );
}
