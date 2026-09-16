'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCheck, FaExchangeAlt, FaPhoneVolume, FaShippingFast } from 'react-icons/fa';
import { MOCK_PRODUCTS } from '@/app/core/mocks/products';
import { MOCK_CATEGORY_GRID, countProductsInCategory } from '@/app/core/mocks/categories';
import { Product } from '@/app/core/models/product';
import Modal from '@/components/ui/molecules/Modal';
import Carousel from '@/components/ui/molecules/Carousel';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import ProductCard from '@/components/feature/Products/ProductCard';
import ProductDetails from '@/components/feature/Products/ProductDetails';
import styles from './Home.module.css';

const HERO_SLIDES = [
  { id: 1, image: '/assets/multishop/carousel-1.jpg', title: 'Men Fashion' },
  { id: 2, image: '/assets/multishop/carousel-2.jpg', title: 'Women Fashion' },
  { id: 3, image: '/assets/multishop/carousel-3.jpg', title: 'Kids Fashion' },
];

const FEATURES = [
  { icon: FaCheck, label: 'Quality Product' },
  { icon: FaShippingFast, label: 'Free Shipping' },
  { icon: FaExchangeAlt, label: '14-Day Return' },
  { icon: FaPhoneVolume, label: '24/7 Support' },
];

const VENDOR_LOGOS = Array.from({ length: 8 }, (_, index) => `/assets/multishop/vendor-${index + 1}.jpg`);

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const featured = MOCK_PRODUCTS.slice(0, 8);
  const recent = MOCK_PRODUCTS.slice(0, 8);

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className={styles.heroCarousel}>
          <Carousel
            slides={HERO_SLIDES.map((slide) => ({
              id: slide.id,
              content: (
                <div className={styles.heroSlide} style={{ backgroundImage: `url(${slide.image})` }}>
                  <div className={styles.heroCaption}>
                    <h1 className={styles.heroTitle}>{slide.title}</h1>
                    <p className={styles.heroText}>Fresh drops every week — gear up before the next release sells out.</p>
                    <Link href="/products" className={styles.heroLink}>
                      Shop Now
                    </Link>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
        <div className={styles.offers}>
          <div className={styles.offer}>
            <img src="/assets/multishop/offer-1.jpg" alt="" className={styles.offerImage} />
            <div className={styles.offerContent}>
              <span className={styles.offerBadge}>Save 20%</span>
              <span className={styles.offerTitle}>Special Offer</span>
              <Link href="/products" className={styles.offerLink}>
                Shop Now
              </Link>
            </div>
          </div>
          <div className={styles.offer}>
            <img src="/assets/multishop/offer-2.jpg" alt="" className={styles.offerImage} />
            <div className={styles.offerContent}>
              <span className={styles.offerBadge}>Save 20%</span>
              <span className={styles.offerTitle}>Special Offer</span>
              <Link href="/products" className={styles.offerLink}>
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className={styles.feature}>
            <Icon size={28} />
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle as="h2" size="lg">
          Categories
        </SectionTitle>
        <div className={styles.categoryGrid}>
          {MOCK_CATEGORY_GRID.map((category) => (
            <Link key={category.id} href="/products" className={styles.categoryCard}>
              <div className={styles.categoryImageWrap}>
                <img src={category.imageUrl} alt={category.name} className={styles.categoryImage} />
              </div>
              <div>
                <p className={styles.categoryName}>{category.name}</p>
                <span className={styles.categoryCount}>{countProductsInCategory(category.name)} Products</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle as="h2" size="lg">
          Featured Products
        </SectionTitle>
        <div className={styles.productGrid}>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={setSelectedProduct} />
          ))}
        </div>
      </section>

      <section className={styles.midOffers}>
        <div className={styles.midOffer}>
          <img src="/assets/multishop/offer-1.jpg" alt="" className={styles.offerImage} />
          <div className={styles.offerContent}>
            <span className={styles.offerBadge}>Save 20%</span>
            <span className={styles.offerTitle}>Special Offer</span>
            <Link href="/products" className={styles.offerLink}>
              Shop Now
            </Link>
          </div>
        </div>
        <div className={styles.midOffer}>
          <img src="/assets/multishop/offer-2.jpg" alt="" className={styles.offerImage} />
          <div className={styles.offerContent}>
            <span className={styles.offerBadge}>Save 20%</span>
            <span className={styles.offerTitle}>Special Offer</span>
            <Link href="/products" className={styles.offerLink}>
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle as="h2" size="lg">
          Recent Products
        </SectionTitle>
        <div className={styles.productGrid}>
          {recent.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={setSelectedProduct} />
          ))}
        </div>
      </section>

      <section className={styles.vendors}>
        <div className={styles.vendorTrack}>
          {[...VENDOR_LOGOS, ...VENDOR_LOGOS].map((logo, index) => (
            <div key={`${logo}-${index}`} className={styles.vendorItem}>
              <img src={logo} alt="Vendor logo" className={styles.vendorLogo} />
            </div>
          ))}
        </div>
      </section>

      <Modal isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name ?? ''}>
        {selectedProduct ? <ProductDetails product={selectedProduct} /> : null}
      </Modal>
    </div>
  );
}
