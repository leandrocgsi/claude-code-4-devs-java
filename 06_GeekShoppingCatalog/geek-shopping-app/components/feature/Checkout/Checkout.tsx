'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart/useCart';
import { formatPrice } from '@/app/core/utils/currency';
import Input from '@/components/ui/atoms/Input';
import Select from '@/components/ui/atoms/Select';
import Button from '@/components/ui/atoms/Button';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import styles from './Checkout.module.css';

const COUNTRY_OPTIONS = [
  { value: 'br', label: 'Brazil' },
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'gb', label: 'United Kingdom' },
];

const PAYMENT_OPTIONS = [
  { value: 'paypal', label: 'Paypal' },
  { value: 'direct-check', label: 'Direct Check' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
];

export default function Checkout() {
  const { items, subtotal, shipping, total, clear } = useCart();
  const [payment, setPayment] = useState('paypal');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setOrderPlaced(true);
    clear();
  };

  if (orderPlaced) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.confirmation}>
          <h2>Order placed!</h2>
          <p>This is a demo checkout — no payment was processed and no order was actually created.</p>
          <Link href="/products" className={styles.confirmationLink}>
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.confirmation}>
          <h2>Your cart is empty</h2>
          <Link href="/products" className={styles.confirmationLink}>
            Go to Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <span>Home</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span>Shop</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>Checkout</span>
      </nav>

      <form className={styles.layout} onSubmit={handleSubmit}>
        <div>
          <SectionTitle as="h5" size="sm">
            Billing Address
          </SectionTitle>
          <div className={styles.formGrid}>
            <Input label="First Name" placeholder="João" required />
            <Input label="Last Name" placeholder="Silva" required />
            <Input label="E-mail" type="email" placeholder="joao.silva@email.com" required />
            <Input label="Mobile No" placeholder="+55 (34) 99999-8888" />
            <Input label="Address Line 1" placeholder="Av. Brasil, 123" required />
            <Input label="Address Line 2" placeholder="Centro" />
            <Select label="Country" options={COUNTRY_OPTIONS} defaultValue="br" />
            <Input label="City" placeholder="Uberlândia" required />
            <Input label="State" placeholder="MG" />
            <Input label="CEP" placeholder="38400-100" />
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(event) => setCreateAccount(event.target.checked)}
              />
              Create an account
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={shipToDifferentAddress}
                onChange={(event) => setShipToDifferentAddress(event.target.checked)}
              />
              Ship to different address
            </label>
          </div>
        </div>

        {shipToDifferentAddress ? (
          <div className={styles.shippingSection}>
            <SectionTitle as="h5" size="sm">
              Shipping Address
            </SectionTitle>
            <div className={styles.formGrid}>
              <Input label="First Name" placeholder="João" />
              <Input label="Last Name" placeholder="Silva" />
              <Input label="E-mail" type="email" placeholder="joao.silva@email.com" />
              <Input label="Mobile No" placeholder="+55 (34) 99999-8888" />
              <Input label="Address Line 1" placeholder="Av. Brasil, 123" />
              <Input label="Address Line 2" placeholder="Centro" />
              <Select label="Country" options={COUNTRY_OPTIONS} defaultValue="br" />
              <Input label="City" placeholder="Uberlândia" />
              <Input label="State" placeholder="MG" />
              <Input label="CEP" placeholder="38400-100" />
            </div>
          </div>
        ) : null}

        <div className={styles.sidebar}>
          <SectionTitle as="h5" size="sm">
            Order Total
          </SectionTitle>
          <div className={styles.summary}>
            {items.map((item) => (
              <div key={item.product.id} className={styles.summaryRow}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
            <div className={styles.summaryDivider} />
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
          </div>

          <SectionTitle as="h5" size="sm">
            Payment
          </SectionTitle>
          <div className={styles.payment}>
            {PAYMENT_OPTIONS.map((option) => (
              <label key={option.value} className={styles.paymentOption}>
                <input
                  type="radio"
                  name="payment"
                  value={option.value}
                  checked={payment === option.value}
                  onChange={() => setPayment(option.value)}
                />
                {option.label}
              </label>
            ))}
            <Button type="submit" variant="primary" className={styles.placeOrderButton}>
              Place Order
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
