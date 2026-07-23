export function formatPrice(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}

export interface Product {
  stockQuantity?: number | null;
  id: string;
  slug?: string;
  name: string;
  price: number;
  country: string;
  factory: string;
  category: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  color: string;
  material: string;
  sizes: string;
  sku: string;
  inStock: true | false | 'preorder';
  isNew: boolean;
  isSale: boolean;
  popular: boolean;
  image: string;
  images: string[];
  description: string;
  characteristics?: Array<{ name: string; value: string }>;
  brandId?: string | null;
}
