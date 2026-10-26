'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { FieldErrors } from '@/app/core/api/httpClient';
import { Product, ProductInput } from '@/app/core/models/product';
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from '@/app/core/utils/imageFile';
import { useCategories } from '@/hooks/useCategories/useCategories';
import Button from '@/components/ui/atoms/Button';
import Input from '@/components/ui/atoms/Input';
import ProductImage from '@/components/ui/atoms/ProductImage';
import Textarea from '@/components/ui/atoms/Textarea';
import ImageCropper from '@/components/ui/molecules/ImageCropper';
import InlineAlert from '@/components/ui/molecules/InlineAlert';
import styles from './ProductForm.module.css';

interface ProductFormProps {
  product?: Product;
  isSubmitting: boolean;
  serverErrors?: FieldErrors;
  formError?: string | null;
  onSubmit: (input: ProductInput, image: File | null) => void;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  category: string;
  quantity: string;
  color: string;
  size: string;
  featured: boolean;
}

type TextField = Exclude<keyof FormValues, 'featured'>;

const MAX_PRICE = 1_000_000_000;

function toFormValues(product?: Product): FormValues {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    oldPrice: product?.oldPrice ? String(product.oldPrice) : '',
    category: product?.category ?? '',
    quantity: product ? String(product.quantity) : '0',
    color: product?.color ?? '',
    size: product?.size ?? '',
    featured: product?.featured ?? false,
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const price = Number(values.price);
  const quantity = Number(values.quantity);

  if (!values.name.trim()) errors.name = 'The name is required.';
  else if (values.name.length > 150) errors.name = 'The name must have at most 150 characters.';

  if (!values.description.trim()) errors.description = 'The description is required.';
  else if (values.description.length > 255) errors.description = 'The description must have at most 255 characters.';

  if (values.price.trim() === '' || !(price > 0)) errors.price = 'The price must be greater than zero.';
  else if (price >= MAX_PRICE) errors.price = 'The price must be below 1,000,000,000.';

  if (values.oldPrice.trim() !== '') {
    const oldPrice = Number(values.oldPrice);
    if (!(oldPrice > 0)) errors.oldPrice = 'The old price must be greater than zero.';
    else if (oldPrice >= MAX_PRICE) errors.oldPrice = 'The old price must be below 1,000,000,000.';
    else if (price > 0 && oldPrice <= price) errors.oldPrice = 'The old price must be greater than the price.';
  }

  if (!values.category.trim()) errors.category = 'The category is required.';
  else if (values.category.length > 100) errors.category = 'The category must have at most 100 characters.';

  if (values.quantity.trim() === '' || !Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = 'The quantity must be zero or a positive whole number.';
  }

  if (values.color.length > 50) errors.color = 'The color must have at most 50 characters.';
  if (values.size.length > 20) errors.size = 'The size must have at most 20 characters.';

  return errors;
}

function toProductInput(values: FormValues, id?: number): ProductInput {
  return {
    id,
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    oldPrice: values.oldPrice.trim() === '' ? null : Number(values.oldPrice),
    category: values.category.trim(),
    quantity: Number(values.quantity),
    color: values.color.trim() === '' ? null : values.color.trim(),
    size: values.size.trim() === '' ? null : values.size.trim(),
    featured: values.featured,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className={styles.error} role="alert">
      {message}
    </span>
  );
}

export default function ProductForm({ product, isSubmitting, serverErrors, formError, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(product));
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const { data: categories } = useCategories();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const errorFor = (field: string) => clientErrors[field] ?? serverErrors?.[field];

  const bind = (field: TextField) => ({
    value: values[field],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
  });

  const selectImage = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageError(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImageError(null);
    setCropping(false);
    setFileInputKey((key) => key + 1);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      setImageError(problem);
      setFileInputKey((key) => key + 1);
      return;
    }
    selectImage(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate(values);
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSubmit(toProductInput(values, product?.id), imageFile);
  };

  const shownImage = previewUrl ?? product?.imageUrl ?? null;
  const shownImageError = imageError ?? errorFor('image');

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError ? <InlineAlert tone="error">{formError}</InlineAlert> : null}

      <div className={styles.fullRow}>
        <Input id="product-name" label="Name" maxLength={150} {...bind('name')} />
        <FieldError message={errorFor('name')} />
      </div>

      <div className={styles.fullRow}>
        <Textarea id="product-description" label="Description" maxLength={255} {...bind('description')} />
        <FieldError message={errorFor('description')} />
      </div>

      <div>
        <Input id="product-price" label="Price" type="number" step="0.01" min="0" {...bind('price')} />
        <FieldError message={errorFor('price')} />
      </div>

      <div>
        <Input id="product-old-price" label="Old price (optional)" type="number" step="0.01" min="0" {...bind('oldPrice')} />
        <FieldError message={errorFor('oldPrice')} />
      </div>

      <div>
        <Input id="product-category" label="Category" maxLength={100} list="product-category-options" {...bind('category')} />
        <datalist id="product-category-options">
          {categories?.map((category) => (
            <option key={category.name} value={category.name} />
          ))}
        </datalist>
        <FieldError message={errorFor('category')} />
      </div>

      <div>
        <Input id="product-quantity" label="Quantity in stock" type="number" step="1" min="0" {...bind('quantity')} />
        <FieldError message={errorFor('quantity')} />
      </div>

      <div>
        <Input id="product-color" label="Color (optional)" maxLength={50} {...bind('color')} />
        <FieldError message={errorFor('color')} />
      </div>

      <div>
        <Input id="product-size" label="Size (optional)" maxLength={20} {...bind('size')} />
        <FieldError message={errorFor('size')} />
      </div>

      <label className={`${styles.fullRow} ${styles.checkbox}`}>
        <input
          type="checkbox"
          checked={values.featured}
          onChange={(event) => setValues((current) => ({ ...current, featured: event.target.checked }))}
        />
        Featured product
      </label>

      <div className={`${styles.fullRow} ${styles.imageGroup}`}>
        <span className={styles.imageLabel}>Image (JPEG, PNG, WebP or GIF, up to 5 MB)</span>

        {cropping && previewUrl && imageFile ? (
          <ImageCropper
            imageUrl={previewUrl}
            fileName={imageFile.name}
            onApply={(file) => {
              selectImage(file);
              setCropping(false);
            }}
            onCancel={() => setCropping(false)}
          />
        ) : (
          <>
            <div className={styles.preview}>
              <ProductImage src={shownImage} alt="Product image preview" className={styles.previewImage} />
            </div>
            <div className={styles.imageActions}>
              <input
                key={fileInputKey}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                aria-label="Product image"
              />
              {imageFile ? (
                <>
                  <Button type="button" variant="secondary" onClick={() => setCropping(true)}>
                    Crop image
                  </Button>
                  <Button type="button" variant="ghost" onClick={clearImage}>
                    Remove selection
                  </Button>
                </>
              ) : null}
            </div>
            {product && !imageFile ? (
              <span className={styles.hint}>Choose a file only if you want to replace the current image.</span>
            ) : null}
          </>
        )}
        <FieldError message={shownImageError ?? undefined} />
      </div>

      <div className={`${styles.fullRow} ${styles.actions}`}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting || cropping}>
          {isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
