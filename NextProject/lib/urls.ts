export function getProductUrl(product: { id: string; slug?: string }) {
  return product.slug ? `/product/${product.slug}` : '/catalog';
}

export function getCategoryUrl(category: { id?: string; slug?: string }) {
  if (category.slug) return `/catalog/${category.slug}`;
  if (category.id) return `/catalog?category=${category.id}`;
  return '/catalog';
}

export function getCountryCatalogUrl(country: string) {
  return `/catalog?country=${encodeURIComponent(country)}`;
}
