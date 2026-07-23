import { Metadata } from 'next';
import { Suspense } from 'react';
import CatalogClient from '../CatalogClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

type CatalogSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CatalogSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await fetch(`${API_BASE}/categories/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (!response.ok) return { title: 'Категория не найдена' };
    const payload = await response.json();
    const category = payload?.data?.category;
    return {
      title: `${category.name} — HERMITAGE`,
      description: `Каталог товаров в категории ${category.name}`,
    };
  } catch {
    return { title: 'Каталог' };
  }
}

export default async function CatalogSlugPage({ params }: CatalogSlugPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>}>
      <CatalogClient initialCategorySlug={slug} />
    </Suspense>
  );
}
