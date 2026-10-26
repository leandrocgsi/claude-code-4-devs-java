'use client';

import { useState } from 'react';
import { FaBars, FaThLarge } from 'react-icons/fa';
import { useProducts } from '@/hooks/useProducts/useProducts';
import { useFacets } from '@/hooks/useFacets/useFacets';
import { PAGE_SIZE_OPTIONS, useProductSearchParams } from '@/hooks/useProductSearchParams/useProductSearchParams';
import { FacetsQueryParams } from '@/app/core/api/products';
import { Product, ProductSortField } from '@/app/core/models/product';
import { SortDirection } from '@/app/core/models/pagination';
import { formatPrice } from '@/app/core/utils/currency';
import Select from '@/components/ui/atoms/Select';
import Button from '@/components/ui/atoms/Button';
import EmptyState from '@/components/ui/atoms/EmptyState';
import ProductImage from '@/components/ui/atoms/ProductImage';
import Spinner from '@/components/ui/atoms/Spinner';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import Modal from '@/components/ui/molecules/Modal';
import Pagination from '@/components/ui/molecules/Pagination';
import DataTable, { DataTableColumn } from '@/components/ui/molecules/DataTable';
import ProductCard from './ProductCard';
import ProductDetails from './ProductDetails';
import ShopSidebar from './ShopSidebar';
import styles from './Products.module.css';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Latest' },
  { value: 'popularity:desc', label: 'Popularity' },
  { value: 'rating:desc', label: 'Best Rating' },
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
];

const PAGE_SIZE_SELECT_OPTIONS = PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: `Show ${size}` }));

export default function Products() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { search, update } = useProductSearchParams();

  const filters: FacetsQueryParams = {
    q: search.q || undefined,
    category: search.category || undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    colors: search.color ? [search.color] : undefined,
    productSizes: search.productSize ? [search.productSize] : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useProducts({
    page: search.page,
    size: search.size,
    direction: search.direction,
    sortBy: search.sortBy,
    ...filters,
  });
  const { data: facets } = useFacets(filters);

  const clearFilters = () =>
    update({
      q: '',
      category: '',
      color: '',
      productSize: '',
      minPrice: undefined,
      maxPrice: undefined,
    });

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'image',
      header: '',
      width: '64px',
      render: (product) => <ProductImage src={product.imageUrl} alt={product.name} className={styles.thumbnail} />,
    },
    { key: 'name', header: 'Name', render: (product) => product.name },
    { key: 'category', header: 'Category', render: (product) => product.category },
    { key: 'price', header: 'Price', align: 'right', render: (product) => formatPrice(product.price) },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (product) => (product.quantity > 0 ? product.quantity : 'Out of stock'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (product) => (
        <Button variant="ghost" onClick={() => setSelectedProduct(product)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <section className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <span>Home</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span>Shop</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>Shop List</span>
      </nav>

      <div className={styles.layout}>
        <ShopSidebar
          facets={facets}
          price={{ minPrice: search.minPrice, maxPrice: search.maxPrice }}
          onPriceChange={(price) => update(price)}
          category={search.category}
          onCategoryChange={(category) => update({ category })}
          color={search.color}
          onColorChange={(color) => update({ color })}
          size={search.productSize}
          onSizeChange={(productSize) => update({ productSize })}
        />

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={view === 'grid' ? styles.viewButtonActive : styles.viewButton}
                onClick={() => setView('grid')}
                aria-label="Grid view"
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                className={view === 'list' ? styles.viewButtonActive : styles.viewButton}
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <FaBars />
              </button>
            </div>

            <div className={styles.filters}>
              <Select
                id="product-sort"
                options={SORT_OPTIONS}
                value={`${search.sortBy}:${search.direction}`}
                onChange={(event) => {
                  const [sortBy, direction] = event.target.value.split(':');
                  update({ sortBy: sortBy as ProductSortField, direction: direction as SortDirection });
                }}
              />
              <Select
                id="product-size"
                options={PAGE_SIZE_SELECT_OPTIONS}
                value={String(search.size)}
                onChange={(event) => update({ size: Number(event.target.value) })}
              />
            </div>
          </div>

          {search.q ? (
            <p className={styles.searchInfo}>
              Results for “{search.q}”
              <button type="button" className={styles.clearSearch} onClick={() => update({ q: '' })}>
                Clear search
              </button>
            </p>
          ) : null}

          {isLoading ? <Spinner label="Loading products" /> : null}

          {isError ? (
            <div className={styles.errorBox}>
              <InlineAlert tone="error">
                {error instanceof Error ? error.message : 'Unexpected error.'}
              </InlineAlert>
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : null}

          {data && !isError ? (
            <>
              {data.content.length === 0 ? (
                <EmptyState title="No products found" description="Try changing or clearing the filters.">
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </EmptyState>
              ) : view === 'grid' ? (
                <div className={styles.grid}>
                  {data.content.map((product) => (
                    <ProductCard key={product.id} product={product} onQuickView={setSelectedProduct} />
                  ))}
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={data.content}
                  getRowId={(product) => product.id}
                  onRowClick={(product) => setSelectedProduct(product)}
                  emptyMessage="No products found."
                />
              )}

              <Pagination page={data.number} totalPages={data.totalPages} onPageChange={(page) => update({ page })} />
            </>
          ) : null}
        </div>
      </div>

      <Modal isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name ?? ''}>
        {selectedProduct ? <ProductDetails product={selectedProduct} /> : null}
      </Modal>
    </section>
  );
}
