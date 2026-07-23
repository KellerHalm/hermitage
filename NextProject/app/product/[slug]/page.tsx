import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductClient from '../ProductClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (!response.ok) return { title: 'Товар не найден' };
    const payload = await response.json();
    const product = payload?.data?.product;
    return {
      title: `${product.title} — HERMITAGE`,
      description: product.description.substring(0, 160),
    };
  } catch {
    return { title: 'Товар' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>}>
      <ProductClient initialSlug={slug} />
    </Suspense>
  );
}
