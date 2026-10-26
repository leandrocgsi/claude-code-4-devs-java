import Link from 'next/link';
import { Product } from '@/app/core/models/product';
import { useAddToCart } from '@/hooks/useAddToCart/useAddToCart';
import Button from '@/components/ui/atoms/Button';
import PriceTag from '@/components/ui/atoms/PriceTag';
import ProductImage from '@/components/ui/atoms/ProductImage';
import RatingStars from '@/components/ui/atoms/RatingStars';
import styles from './ProductDetails.module.css';

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const addItem = useAddToCart();
  const inStock = product.quantity > 0;

  return (
    <div className={styles.wrapper}>
      <ProductImage src={product.imageUrl} alt={product.name} className={styles.image} />
      <div className={styles.info}>
        <span className={styles.category}>{product.category}</span>
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
        <p className={styles.description}>{product.description}</p>
        <div className={styles.meta}>
          <PriceTag price={product.price} oldPrice={product.oldPrice} size="lg" />
          <span className={inStock ? styles.inStock : styles.outOfStock}>
            {inStock ? `${product.quantity} in stock` : 'Out of stock'}
          </span>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" disabled={!inStock} onClick={() => addItem(product.id)}>
            {inStock ? 'Add to Cart' : 'Out of stock'}
          </Button>
          <Link href={`/products/${product.id}`} className={styles.detailsLink}>
            View full details
          </Link>
        </div>
      </div>
    </div>
  );
}
