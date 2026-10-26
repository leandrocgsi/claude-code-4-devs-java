'use client';

import { useState } from 'react';
import { ApiError } from '@/app/core/api/httpClient';
import { Product, ProductInput } from '@/app/core/models/product';
import { formatPrice } from '@/app/core/utils/currency';
import { useProducts } from '@/hooks/useProducts/useProducts';
import { useCreateProduct } from '@/hooks/useCreateProduct/useCreateProduct';
import { useUpdateProduct } from '@/hooks/useUpdateProduct/useUpdateProduct';
import { useDeleteProduct } from '@/hooks/useDeleteProduct/useDeleteProduct';
import Button from '@/components/ui/atoms/Button';
import EmptyState from '@/components/ui/atoms/EmptyState';
import ProductImage from '@/components/ui/atoms/ProductImage';
import SectionTitle from '@/components/ui/atoms/SectionTitle';
import Spinner from '@/components/ui/atoms/Spinner';
import DataTable, { DataTableColumn } from '@/components/ui/molecules/DataTable';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import Modal from '@/components/ui/molecules/Modal';
import Pagination from '@/components/ui/molecules/Pagination';
import ProductForm from './ProductForm';
import styles from './AdminProducts.module.css';

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    size: PAGE_SIZE,
    sortBy: 'createdAt',
    direction: 'desc',
  });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const formMutation = editing ? updateProduct : createProduct;
  const formApiError = formMutation.error instanceof ApiError ? formMutation.error : null;
  const formError = formMutation.error
    ? formApiError?.fields
      ? 'Please fix the highlighted fields.'
      : (formApiError?.message ?? 'Unexpected error.')
    : null;

  const closeForm = () => {
    createProduct.reset();
    updateProduct.reset();
    setCreating(false);
    setEditing(null);
  };

  const closeDelete = () => {
    deleteProduct.reset();
    setDeleting(null);
  };

  const handleSubmit = (input: ProductInput, image: File | null) => {
    if (editing) {
      updateProduct.mutate(
        { product: { ...input, id: editing.id }, image },
        {
          onSuccess: () => {
            closeForm();
            setFeedback('Product updated.');
          },
        },
      );
      return;
    }
    createProduct.mutate(
      { product: input, image },
      {
        onSuccess: () => {
          closeForm();
          setPage(0);
          setFeedback('Product created.');
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteProduct.mutate(deleting.id, {
      onSuccess: () => {
        closeDelete();
        setPage(0);
        setFeedback('Product deleted.');
      },
    });
  };

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
      header: 'Stock',
      align: 'right',
      render: (product) => (product.quantity > 0 ? product.quantity : 'Out of stock'),
    },
    { key: 'featured', header: 'Featured', align: 'center', render: (product) => (product.featured ? 'Yes' : '—') },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (product) => (
        <div className={styles.rowActions}>
          <Button
            variant="ghost"
            onClick={() => {
              setFeedback(null);
              setEditing(product);
            }}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFeedback(null);
              setDeleting(product);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <SectionTitle as="h2" size="lg" className={styles.title}>
          Manage products
        </SectionTitle>
        <Button
          variant="primary"
          onClick={() => {
            setFeedback(null);
            setCreating(true);
          }}
        >
          New product
        </Button>
      </div>

      {feedback ? <InlineAlert tone="success">{feedback}</InlineAlert> : null}

      {isLoading ? <Spinner label="Loading products" /> : null}

      {isError ? (
        <div className={styles.errorBox}>
          <InlineAlert tone="error">{error instanceof Error ? error.message : 'Unexpected error.'}</InlineAlert>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {data && !isError ? (
        <>
          {data.content.length === 0 ? (
            <EmptyState title="No products yet" description="Create the first product of the catalog.">
              <Button variant="primary" onClick={() => setCreating(true)}>
                New product
              </Button>
            </EmptyState>
          ) : (
            <DataTable columns={columns} data={data.content} getRowId={(product) => product.id} />
          )}
          <Pagination page={data.number} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : null}

      <Modal
        isOpen={creating || editing !== null}
        onClose={closeForm}
        title={editing ? 'Edit product' : 'New product'}
        maxWidth={720}
      >
        <ProductForm
          key={editing?.id ?? 'new'}
          product={editing ?? undefined}
          isSubmitting={formMutation.isPending}
          serverErrors={formApiError?.fields}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        isOpen={deleting !== null}
        onClose={closeDelete}
        title="Delete product"
        maxWidth={440}
        footer={
          <div className={styles.confirmActions}>
            <Button variant="secondary" onClick={closeDelete} disabled={deleteProduct.isPending}>
              Cancel
            </Button>
            <Button variant="dark" onClick={handleDelete} disabled={deleteProduct.isPending}>
              {deleteProduct.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className={styles.confirmText}>
          Delete <strong>{deleting?.name}</strong>? This cannot be undone.
        </p>
        {deleteProduct.isError ? (
          <InlineAlert tone="error">
            {deleteProduct.error instanceof Error ? deleteProduct.error.message : 'Unexpected error.'}
          </InlineAlert>
        ) : null}
      </Modal>
    </section>
  );
}
