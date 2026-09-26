'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaMinus, FaPlus, FaTimes } from 'react-icons/fa';
import { useCart } from '@/hooks/useCart/useCart';
import { formatPrice } from '@/app/core/utils/currency';
import Input from '@/components/ui/atoms/Input';
import Button from '@/components/ui/atoms/Button';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import styles from './Cart.module.css';

export default function Cart() {
  const { items, subtotal, shipping, total, setQuantity, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const applyCoupon = () => {
    if (!coupon.trim()) return;
    setCouponMessage('Coupons are not available yet.');
  };

  return (
    <section className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <span>Home</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span>Shop</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>Shopping Cart</span>
      </nav>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Your cart is empty.</p>
          <Link href="/products" className={styles.emptyLink}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.tableWrap}>
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
                  <tr key={item.product.id}>
                    <td className={styles.productCell}>
                      <img src={item.product.imageUrl} alt={item.product.name} className={styles.thumbnail} />
                      {item.product.name}
                    </td>
                    <td>{formatPrice(item.product.price)}</td>
                    <td>
                      <div className={styles.quantity}>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus />
                        </button>
                        <span className={styles.quantityValue}>{item.quantity}</span>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </td>
                    <td>{formatPrice(item.lineTotal)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem(item.product.id)}
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.summaryColumn}>
            <div className={styles.coupon}>
              <Input placeholder="Coupon Code" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
              <Button variant="primary" onClick={applyCoupon}>
                Apply Coupon
              </Button>
            </div>
            {couponMessage ? <p className={styles.couponMessage}>{couponMessage}</p> : null}

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
