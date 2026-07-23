import type { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/catalog?new=1`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/catalog?sale=1`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/delivery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/payment`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const response = await fetch(`${API_BASE}/seo/sitemap`, { next: { revalidate: 3600 } });
    if (!response.ok) return staticPages;

    const payload = await response.json();
    const data = payload?.data || {};

    const productPages: MetadataRoute.Sitemap = (data.products || []).map((item: { slug: string; updatedAt: string }) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(item.slug)}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const categoryPages: MetadataRoute.Sitemap = (data.categories || []).map((item: { slug: string; updatedAt: string }) => ({
      url: `${SITE_URL}/catalog/${encodeURIComponent(item.slug)}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch {
    return staticPages;
  }
}
