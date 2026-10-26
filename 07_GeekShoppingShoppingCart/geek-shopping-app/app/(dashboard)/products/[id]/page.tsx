import ProductDetail from '@/components/feature/ProductDetail';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductDetail key={id} id={Number(id)} />;
}
