import { Suspense } from 'react';
import Products from '@/components/feature/Products';

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <Products />
    </Suspense>
  );
}
