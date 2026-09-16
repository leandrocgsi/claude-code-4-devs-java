'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaFacebookF, FaInstagram, FaLinkedinIn, FaMapMarkerAlt, FaPhoneAlt, FaTwitter } from 'react-icons/fa';
import Input from '@/components/ui/atoms/Input';
import Button from '@/components/ui/atoms/Button';
import styles from './Footer.module.css';

const QUICK_SHOP_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Our Shop' },
  { href: '/products', label: 'Shop Detail' },
  { href: '/cart', label: 'Shopping Cart' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/contact', label: 'Contact Us' },
];

const MY_ACCOUNT_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Our Shop' },
  { href: '/products', label: 'Shop Detail' },
  { href: '/cart', label: 'Shopping Cart' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/contact', label: 'Contact Us' },
];

const SOCIAL_LINKS = [
  { href: 'https://twitter.com/erudiotraining', Icon: FaTwitter, label: 'Twitter' },
  { href: 'https://facebook.com/erudiotraining', Icon: FaFacebookF, label: 'Facebook' },
  { href: 'https://linkedin.com/company/erudiotraining', Icon: FaLinkedinIn, label: 'LinkedIn' },
  { href: 'https://instagram.com/erudiotraining', Icon: FaInstagram, label: 'Instagram' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  const handleNewsletterSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSignedUp(true);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div className={styles.aboutColumn}>
          <h5 className={styles.heading}>Get In Touch</h5>
          <p className={styles.text}>
            Geek Shopping is a demo storefront built with Spring Boot and Next.js — this page is a course project, not a
            real business.
          </p>
          <p className={styles.infoRow}>
            <FaMapMarkerAlt /> Av. Brasil, 123 - Centro, Uberlândia - MG, 38400-100
          </p>
          <p className={styles.infoRow}>
            <FaEnvelope /> contato@geekshopping.com.br
          </p>
          <p className={styles.infoRow}>
            <FaPhoneAlt /> +55 (34) 3212-3456
          </p>
        </div>

        <div>
          <h5 className={styles.heading}>Quick Shop</h5>
          <div className={styles.linkList}>
            {QUICK_SHOP_LINKS.map((link, index) => (
              <Link key={`${link.href}-${index}`} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h5 className={styles.heading}>My Account</h5>
          <div className={styles.linkList}>
            {MY_ACCOUNT_LINKS.map((link, index) => (
              <Link key={`${link.href}-${index}`} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h5 className={styles.heading}>Newsletter</h5>
          {signedUp ? (
            <p className={styles.text}>This is a demo — you weren&apos;t actually subscribed.</p>
          ) : (
            <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
              <Input
                placeholder="Your Email Address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Button type="submit" variant="primary">
                Sign Up
              </Button>
            </form>
          )}
          <h6 className={styles.followHeading}>Follow Us</h6>
          <div className={styles.socialRow}>
            {SOCIAL_LINKS.map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={styles.socialButton} aria-label={label}>
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p className={styles.copyright}>
          &copy; Geek Shopping. All rights reserved. Design inspired by{' '}
          <a href="https://htmlcodex.com" className={styles.link} target="_blank" rel="noopener noreferrer">
            HTML Codex
          </a>
          .
        </p>
        <img src="/assets/multishop/payments.png" alt="Accepted payment methods" className={styles.payments} />
      </div>
    </footer>
  );
}
