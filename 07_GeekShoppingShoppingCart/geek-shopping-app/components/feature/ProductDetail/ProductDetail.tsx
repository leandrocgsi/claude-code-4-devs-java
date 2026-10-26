'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/app/core/api/httpClient';
import { useProduct } from '@/hooks/useProduct/useProduct';
import { useAddToCart } from '@/hooks/useAddToCart/useAddToCart';
import Button from '@/components/ui/atoms/Button';
import EmptyState from '@/components/ui/atoms/EmptyState';
import PriceTag from '@/components/ui/atoms/PriceTag';
import ProductImage from '@/components/ui/atoms/ProductImage';
import RatingStars from '@/components/ui/atoms/RatingStars';
import Spinner from '@/components/ui/atoms/Spinner';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import QuantityStepper from '@/components/ui/molecules/QuantityStepper';
import styles from './ProductDetail.module.css';

interface ProductDetailProps {
  id: number;
}

export default function ProductDetail({ id }: ProductDetailProps) {
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const addItem = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const validId = Number.isInteger(id) && id > 0;
  const notFound = !validId || (isError && error instanceof ApiError && error.status === 404);
  const inStock = (product?.quantity ?? 0) > 0;

  return (
    <section className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href="/products">Shop</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>{product?.name ?? 'Product'}</span>
      </nav>

      {validId && isLoading ? <Spinner label="Loading product" /> : null}

      {notFound ? (
        <EmptyState title="Product not found" description="It may have been removed.">
          <Link href="/products" className={styles.backLink}>
            Back to the shop
          </Link>
        </EmptyState>
      ) : null}

      {!notFound && isError ? (
        <div className={styles.errorBox}>
          <InlineAlert tone="error">{error instanceof Error ? error.message : 'Unexpected error.'}</InlineAlert>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {product ? (
        <div className={styles.layout}>
          <div className={styles.imageWrap}>
            <ProductImage src={product.imageUrl} alt={product.name} className={styles.image} />
            {inStock ? null : <span className={styles.outOfStockBadge}>Out of stock</span>}
          </div>

          <div className={styles.info}>
            <span className={styles.category}>{product.category}</span>
            <h1 className={styles.name}>{product.name}</h1>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
            <PriceTag price={product.price} oldPrice={product.oldPrice} size="lg" />
            <p className={styles.description}>{product.description}</p>

            <dl className={styles.attributes}>
              {product.color ? (
                <>
                  <dt>Color</dt>
                  <dd>{product.color}</dd>
                </>
              ) : null}
              {product.size ? (
                <>
                  <dt>Size</dt>
                  <dd>{product.size}</dd>
                </>
              ) : null}
              <dt>Availability</dt>
              <dd className={inStock ? styles.inStock : styles.outOfStock}>
                {inStock ? `${product.quantity} in stock` : 'Out of stock'}
              </dd>
            </dl>

            <div className={styles.actions}>
              {inStock ? (
                <QuantityStepper value={quantity} min={1} max={product.quantity} onChange={setQuantity} />
              ) : null}
              <Button
                variant="primary"
                disabled={!inStock}
                onClick={() => {
                  addItem(product.id, quantity);
                  setAdded(true);
                }}
              >
                {inStock ? 'Add to Cart' : 'Out of stock'}
              </Button>
            </div>

            {added ? (
              <InlineAlert tone="success">
                Added to your cart. <Link href="/cart">View cart</Link>
              </InlineAlert>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
