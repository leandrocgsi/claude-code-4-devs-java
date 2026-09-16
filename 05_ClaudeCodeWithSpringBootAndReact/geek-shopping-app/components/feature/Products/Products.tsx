'use client';

import { useMemo, useState } from 'react';
import { FaBars, FaThLarge } from 'react-icons/fa';
import { useProducts } from '@/hooks/useProducts/useProducts';
import { useProductFilters } from '@/hooks/useProductFilters/useProductFilters';
import { Product } from '@/app/core/models/product';
import { SortDirection } from '@/app/core/models/pagination';
import { PRICE_BUCKETS } from '@/app/core/mocks/products';
import Select from '@/components/ui/atoms/Select';
import Button from '@/components/ui/atoms/Button';
import Modal from '@/components/ui/molecules/Modal';
import DataTable, { DataTableColumn } from '@/components/ui/molecules/DataTable';
import { formatPrice } from '@/app/core/utils/currency';
import ProductCard from './ProductCard';
import ProductDetails from './ProductDetails';
import ShopSidebar from './ShopSidebar';
import styles from './Products.module.css';

const SORT_OPTIONS = [
  { value: 'asc', label: 'Name (A-Z)' },
  { value: 'desc', label: 'Name (Z-A)' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: 'Show 10' },
  { value: '20', label: 'Show 20' },
  { value: '30', label: 'Show 30' },
];

function getPageWindow(current: number, total: number, windowSize = 5): number[] {
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, current - half);
  const end = Math.min(total, start + windowSize);
  start = Math.max(0, end - windowSize);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export default function Products() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceBucketId, setPriceBucketId] = useState('all');
  const [color, setColor] = useState('all');
  const [productSize, setProductSize] = useState('all');

  const { search } = useProductFilters();
  const { data, isLoading, isError, error } = useProducts({ page, size, direction });

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    const bucket = PRICE_BUCKETS.find((item) => item.id === priceBucketId);

    return data.content.filter((product) => {
      const matchesSearch =
        !term || product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
      const matchesPrice = !bucket || bucket.id === 'all' || (product.price >= bucket.min && product.price < bucket.max);
      const matchesColor = color === 'all' || product.color === color;
      const matchesSize = productSize === 'all' || product.size === productSize;
      return matchesSearch && matchesPrice && matchesColor && matchesSize;
    });
  }, [data, search, priceBucketId, color, productSize]);

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'image',
      header: '',
      width: '64px',
      render: (product) => <img src={product.imageUrl} alt={product.name} className={styles.thumbnail} />,
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
          priceBucketId={priceBucketId}
          onPriceBucketChange={(id) => {
            setPriceBucketId(id);
            setPage(0);
          }}
          color={color}
          onColorChange={(value) => {
            setColor(value);
            setPage(0);
          }}
          size={productSize}
          onSizeChange={(value) => {
            setProductSize(value);
            setPage(0);
          }}
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
                value={direction}
                onChange={(event) => {
                  setDirection(event.target.value as SortDirection);
                  setPage(0);
                }}
              />
              <Select
                id="product-size"
                options={PAGE_SIZE_OPTIONS}
                value={String(size)}
                onChange={(event) => {
                  setSize(Number(event.target.value));
                  setPage(0);
                }}
              />
            </div>
          </div>

          {isLoading ? <p className={styles.status}>Loading products…</p> : null}

          {isError ? (
            <p className={styles.statusError}>{error instanceof Error ? error.message : 'Unexpected error.'}</p>
          ) : null}

          {!isLoading && !isError ? (
            <>
              {view === 'grid' ? (
                filteredProducts.length === 0 ? (
                  <p className={styles.status}>No products match your filters.</p>
                ) : (
                  <div className={styles.grid}>
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onQuickView={setSelectedProduct} />
                    ))}
                  </div>
                )
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredProducts}
                  getRowId={(product) => product.id}
                  onRowClick={(product) => setSelectedProduct(product)}
                  emptyMessage="No products match your filters."
                />
              )}

              {data && data.totalPages > 1 ? (
                <nav className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageLink}
                    disabled={data.first}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </button>
                  {getPageWindow(data.number, data.totalPages).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={pageNumber === data.number ? styles.pageLinkActive : styles.pageLink}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageLink}
                    disabled={data.last}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </nav>
              ) : null}
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
