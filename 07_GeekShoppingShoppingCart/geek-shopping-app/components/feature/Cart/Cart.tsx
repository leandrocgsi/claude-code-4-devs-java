'use client';

import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';
import { useCart } from '@/hooks/useCart/useCart';
import { useClearCart } from '@/hooks/useClearCart/useClearCart';
import { useRemoveCartItem } from '@/hooks/useRemoveCartItem/useRemoveCartItem';
import { useUpdateCartItem } from '@/hooks/useUpdateCartItem/useUpdateCartItem';
import { formatPrice } from '@/app/core/utils/currency';
import { getErrorMessage } from '@/app/core/utils/errorMessage';
import Button from '@/components/ui/atoms/Button';
import EmptyState from '@/components/ui/atoms/EmptyState';
import ProductImage from '@/components/ui/atoms/ProductImage';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import Spinner from '@/components/ui/atoms/Spinner';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import QuantityStepper from '@/components/ui/molecules/QuantityStepper';
import styles from './Cart.module.css';

export default function Cart() {
  const { items, isLoading, isError, refetch, subtotal, shipping, total } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const busy = updateItem.isPending || removeItem.isPending || clearCart.isPending;

  return (
    <section className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <span>Home</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span>Shop</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>Shopping Cart</span>
      </nav>

      {isLoading ? (
        <Spinner label="Loading your cart" />
      ) : isError ? (
        <div className={styles.empty}>
          <InlineAlert tone="error">Could not load your cart.</InlineAlert>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Your cart is empty">
          <Link href="/products" className={styles.emptyLink}>
            Continue shopping
          </Link>
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <div className={styles.tableWrap}>
            {updateItem.isError ? (
              <div className={styles.inlineError}>
                <InlineAlert tone="error">{getErrorMessage(updateItem.error)}</InlineAlert>
              </div>
            ) : null}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Products</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.productCell}>
                      <ProductImage src={item.imageUrl} alt={item.name} className={styles.thumbnail} />
                      <div className={styles.productInfo}>
                        <span>{item.name}</span>
                        {item.color || item.size ? (
                          <span className={styles.itemMeta}>
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatPrice(item.unitPrice)}</td>
                    <td>
                      <div className={styles.quantity}>
                        <QuantityStepper
                          value={item.quantity}
                          min={1}
                          max={item.stock}
                          onChange={(quantity) => updateItem.mutate({ itemId: item.id, quantity })}
                        />
                      </div>
                    </td>
                    <td>{formatPrice(item.lineTotal)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem.mutate(item.id)}
                        disabled={busy}
                        aria-label={`Remove ${item.name}`}
                      >
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.tableActions}>
              <Button variant="secondary" onClick={() => clearCart.mutate()} disabled={busy}>
                Clear cart
              </Button>
            </div>
          </div>

          <div className={styles.summaryColumn}>
            <SectionTitle as="h5" size="sm" className={styles.summaryTitle}>
              Cart Summary
            </SectionTitle>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className={styles.summaryTotalRow}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link href="/checkout" className={styles.checkoutButton}>
                Proceed To Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
