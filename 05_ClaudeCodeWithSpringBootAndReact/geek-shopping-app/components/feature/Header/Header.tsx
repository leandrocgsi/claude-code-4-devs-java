'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaAngleDown, FaBars, FaHeart, FaSearch, FaShoppingCart } from 'react-icons/fa';
import Input from '@/components/ui/atoms/Input';
import { useProductFilters } from '@/hooks/useProductFilters/useProductFilters';
import { useWishlist } from '@/hooks/useWishlist/useWishlist';
import { useCart } from '@/hooks/useCart/useCart';
import { NAV_CATEGORY_LINKS } from '@/app/core/mocks/categories';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/cart', label: 'Shop Cart' },
  { href: '/checkout', label: 'Checkout' },
  { href: '/contact', label: 'Contact' },
];

const INFO_LINKS = ['About', 'Contact', 'Help', 'FAQs'];

const CURRENCY_OPTIONS = ['EUR', 'GBP', 'CAD'];

const LANGUAGE_OPTIONS = ['FR', 'AR', 'RU'];

export default function Header() {
  const { search, setSearch } = useProductFilters();
  const { count: wishlistCount } = useWishlist();
  const { itemCount } = useCart();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header>
      <div className={styles.topbar}>
        <div className={styles.infoLinks}>
          {INFO_LINKS.map((label) => (
            <span key={label} className={styles.infoLink}>
              {label}
            </span>
          ))}
        </div>

        <div className={styles.topbarActions}>
          <div className={styles.dropdown}>
            <button type="button" className={styles.dropdownToggle}>
              My Account
              <FaAngleDown />
            </button>
            <div className={styles.dropdownMenu}>
              <button type="button" className={styles.dropdownItem}>
                Sign in
              </button>
              <button type="button" className={styles.dropdownItem}>
                Sign up
              </button>
            </div>
          </div>

          <div className={styles.dropdown}>
            <button type="button" className={styles.dropdownToggle}>
              BRL
              <FaAngleDown />
            </button>
            <div className={styles.dropdownMenu}>
              {CURRENCY_OPTIONS.map((currency) => (
                <button key={currency} type="button" className={styles.dropdownItem}>
                  {currency}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.dropdown}>
            <button type="button" className={styles.dropdownToggle}>
              EN
              <FaAngleDown />
            </button>
            <div className={styles.dropdownMenu}>
              {LANGUAGE_OPTIONS.map((language) => (
                <button key={language} type="button" className={styles.dropdownItem}>
                  {language}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.topRow}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoDark}>Geek</span>
          <span className={styles.logoPrimary}>Shopping</span>
        </Link>

        <div className={styles.search}>
          <Input
            id="header-search"
            placeholder="Search for products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <FaSearch className={styles.searchIcon} aria-hidden="true" />
        </div>

        <div className={styles.customerService}>
          <p className={styles.customerServiceLabel}>Customer Service</p>
          <p className={styles.customerServicePhone}>+55 (34) 3212-3456</p>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.categoriesWrap}>
          <button type="button" className={styles.categoriesToggle} onClick={() => setCategoriesOpen((open) => !open)}>
            <FaBars />
            Categories
            <FaAngleDown />
          </button>
          {categoriesOpen ? (
            <div className={styles.categoriesPanel}>
              {NAV_CATEGORY_LINKS.map((category) => (
                <Link
                  key={category}
                  href="/products"
                  className={styles.categoryItem}
                  onClick={() => setCategoriesOpen(false)}
                >
                  {category}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? styles.navLinkActive : styles.navLink}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          <Link href="/products" className={styles.actionLink} aria-label={`${wishlistCount} products in wishlist`}>
            <FaHeart size={18} />
            {wishlistCount > 0 ? <span className={styles.badge}>{wishlistCount}</span> : null}
          </Link>
          <Link href="/cart" className={styles.actionLink} aria-label={`${itemCount} items in cart`}>
            <FaShoppingCart size={18} />
            {itemCount > 0 ? <span className={styles.badge}>{itemCount}</span> : null}
          </Link>
        </div>
      </nav>
    </header>
  );
}
