'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCheck, FaExchangeAlt, FaPhoneVolume, FaShippingFast } from 'react-icons/fa';
import { useCategories } from '@/hooks/useCategories/useCategories';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts/useFeaturedProducts';
import { useRecentProducts } from '@/hooks/useRecentProducts/useRecentProducts';
import { Product } from '@/app/core/models/product';
import Modal from '@/components/ui/molecules/Modal';
import Carousel from '@/components/ui/molecules/Carousel';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import EmptyState from '@/components/ui/atoms/EmptyState';
import ProductImage from '@/components/ui/atoms/ProductImage';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import Spinner from '@/components/ui/atoms/Spinner';
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

const HOME_SECTION_SIZE = 8;

interface ProductsSectionProps {
  title: string;
  products?: Product[];
  isLoading: boolean;
  isError: boolean;
  onQuickView: (product: Product) => void;
}

function ProductsSection({ title, products, isLoading, isError, onQuickView }: ProductsSectionProps) {
  return (
    <section>
      <SectionTitle as="h2" size="lg">
        {title}
      </SectionTitle>
      {isLoading ? <Spinner label={`Loading ${title.toLowerCase()}`} /> : null}
      {isError ? <InlineAlert tone="error">The products could not be loaded.</InlineAlert> : null}
      {!isLoading && !isError && products?.length === 0 ? <EmptyState title="No products yet" /> : null}
      {products && products.length > 0 ? (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const categories = useCategories();
  const featured = useFeaturedProducts({ page: 0, size: HOME_SECTION_SIZE });
  const recent = useRecentProducts({ page: 0, size: HOME_SECTION_SIZE });

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
        {categories.isLoading ? <Spinner label="Loading categories" /> : null}
        {categories.isError ? <InlineAlert tone="error">The categories could not be loaded.</InlineAlert> : null}
        {categories.data && categories.data.length === 0 ? <EmptyState title="No categories yet" /> : null}
        {categories.data && categories.data.length > 0 ? (
          <div className={styles.categoryGrid}>
            {categories.data.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryImageWrap}>
                  <ProductImage src={category.imageUrl} alt={category.name} className={styles.categoryImage} />
                </div>
                <div>
                  <p className={styles.categoryName}>{category.name}</p>
                  <span className={styles.categoryCount}>{category.productCount} Products</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <ProductsSection
        title="Featured Products"
        products={featured.data?.content}
        isLoading={featured.isLoading}
        isError={featured.isError}
        onQuickView={setSelectedProduct}
      />

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

      <ProductsSection
        title="Recent Products"
        products={recent.data?.content}
        isLoading={recent.isLoading}
        isError={recent.isError}
        onQuickView={setSelectedProduct}
      />

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
