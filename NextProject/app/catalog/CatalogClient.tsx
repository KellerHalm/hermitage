'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import BackButton from '../components/BackButton';
import { Store } from '@/lib/store';
import { getCategoryUrl } from '@/lib/urls';

type CatalogClientProps = {
  initialCategorySlug?: string;
};

export default function CatalogClient({ initialCategorySlug }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categoryParam = initialCategorySlug || searchParams.get('category') || '';
  const newOnly = searchParams.get('new') === '1';
  const saleOnly = searchParams.get('sale') === '1';
  const country = searchParams.get('country') || '';
  const search = searchParams.get('search') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    country: searchParams.get('country') || '',
    factory: searchParams.get('factory') || '',
    color: searchParams.get('color') || '',
    material: searchParams.get('material') || '',
    inStock: searchParams.get('inStock') || '',
  });

  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setProducts(Store.getProducts());
      setCategories(Store.getCategories());
      setBrands(Store.getBrands());
      setLoaded(true);
    };

    loadData();
    return Store.subscribeToProducts(loadData);
  }, []);

  const updateFilters = (newFilters: typeof filters) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
    setFilters(newFilters);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      minPrice: '',
      maxPrice: '',
      country: '',
      factory: '',
      color: '',
      material: '',
      inStock: '',
    };
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(emptyFilters).forEach(key => params.delete(key));
    router.push(`${pathname}?${params.toString()}`);
    setFilters(emptyFilters);
    setFiltersOpen(false);
  };

  useEffect(() => {
    setFilters({
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      country: searchParams.get('country') || '',
      factory: searchParams.get('factory') || '',
      color: searchParams.get('color') || '',
      material: searchParams.get('material') || '',
      inStock: searchParams.get('inStock') || '',
    });
    setSort(searchParams.get('sort') || 'popular');
  }, [searchParams]);

  if (!loaded) return null;

  const flattenCategories = (list: any[]): any[] => {
    const result: any[] = [];
    list.forEach((cat) => {
      result.push(cat);
      if (Array.isArray(cat.subcategories)) {
        result.push(...flattenCategories(cat.subcategories));
      }
    });
    return result;
  };

  const allCategories = flattenCategories(categories);
  const activeCategory = allCategories.find((c: any) => c.id === categoryParam || c.slug === categoryParam);
  
  const categoryIds = new Set<string>();
  if (activeCategory) {
    categoryIds.add(String(activeCategory.id));
    if (Array.isArray(activeCategory.subcategories)) {
      activeCategory.subcategories.forEach((sub: any) => categoryIds.add(String(sub.id)));
    }
  }

  const filteredProducts = products.filter((p: any) => {
    if (categoryIds.size > 0) {
      const productCategory = String(p.category || p.categoryId || '');
      if (!categoryIds.has(productCategory)) return false;
    }
    if (newOnly && !p.isNew) return false;
    if (saleOnly && !p.isSale) return false;
    if (filters.country && p.country !== filters.country) return false;
    if (filters.factory && p.factory !== filters.factory) return false;
    if (filters.color && p.color !== filters.color) return false;
    if (filters.material && p.material && !p.material.includes(filters.material)) return false;
    if (filters.inStock === 'yes' && p.inStock !== true) return false;
    if (filters.inStock === 'preorder' && p.inStock !== 'preorder') return false;
    if (filters.inStock === 'no' && p.inStock !== false) return false;
    if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.factory?.toLowerCase().includes(q) && !p.country?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'new') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
  });

  const countries = [...new Set(products.map((p: any) => p.country).filter(Boolean))];
  const factories = brands.filter((b) => b.name && b.name.trim() !== '').map((b) => b.name);
  const colors = [...new Set(products.map((p: any) => p.color).filter(Boolean))];
  const materials = [...new Set(products.map((p: any) => p.material?.split(',')[0]?.trim()).filter(Boolean))];

  const pageTitle = activeCategory
    ? activeCategory.name
    : newOnly
      ? 'Новинки'
      : saleOnly
        ? 'Акции'
        : search
          ? `Поиск: ${search}`
          : 'Каталог';

  return (
    <>
      <Header />

      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/" />
      </div>

      <header className="page-header">
        <div className="container">
          <h1>{pageTitle}</h1>
        </div>
      </header>

      <div className="container catalog-layout">
        <aside className={`filters-panel ${filtersOpen ? 'is-open' : ''}`}>
          <form onSubmit={(e) => { e.preventDefault(); updateFilters(filters); }}>
            <div className="filter-group">
              <label>Цена от</label>
              <input type="number" placeholder="0" min="0" step="1000" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>Цена до</label>
              <input type="number" placeholder="1000000" min="0" step="1000" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>Страна</label>
              <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
                <option value="">Все</option>
                {countries.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Фабрика</label>
              <select value={filters.factory} onChange={(e) => setFilters({ ...filters, factory: e.target.value })}>
                <option value="">Все</option>
                {factories.map((f: any) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Цвет</label>
              <select value={filters.color} onChange={(e) => setFilters({ ...filters, color: e.target.value })}>
                <option value="">Все</option>
                {colors.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Материал</label>
              <select value={filters.material} onChange={(e) => setFilters({ ...filters, material: e.target.value })}>
                <option value="">Все</option>
                {materials.map((m: any) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Наличие</label>
              <select value={filters.inStock} onChange={(e) => setFilters({ ...filters, inStock: e.target.value })}>
                <option value="">Все</option>
                <option value="yes">В наличии</option>
                <option value="preorder">Под заказ</option>
                <option value="no">Нет в наличии</option>
              </select>
            </div>
            <button type="submit" className="btn btn--primary btn--block">Применить</button>
            <button type="button" className="btn btn--outline btn--block mt-2" onClick={resetFilters}>Сбросить</button>
          </form>
        </aside>

        <main className="catalog-main">
          <button type="button" className="categories-menu-toggle" onClick={() => setCategoriesPanelOpen(true)}>
            Выбрать комнату <span style={{ fontSize: 12 }}>▼</span>
          </button>

          <div className="catalog-categories">
            <p className="catalog-categories__label">Комнаты</p>
            <div className="catalog-categories__scroll">
              <Link href="/catalog" className={`catalog-chip ${!categoryParam ? 'is-active' : ''}`}>Все</Link>
              {categories.map((c: any) => (
                <Link key={c.id} href={getCategoryUrl(c)} className={`catalog-chip ${categoryParam === c.id || categoryParam === c.slug ? 'is-active' : ''}`}>{c.name}</Link>
              ))}
            </div>
          </div>

          {activeCategory?.subcategories?.length > 0 && (
            <div className="catalog-categories" style={{ marginTop: 12 }}>
              <p className="catalog-categories__label">Подкатегории</p>
              <div className="catalog-categories__scroll">
                {activeCategory.subcategories.map((c: any) => (
                  <Link key={c.id} href={getCategoryUrl(c)} className="catalog-chip">{c.name}</Link>
                ))}
              </div>
            </div>
          )}

          <div className="catalog-toolbar">
            <button type="button" className="filters-toggle" onClick={() => setFiltersOpen(true)}>Фильтры</button>
            <select id="sort-select" value={sort} onChange={(e) => { setSort(e.target.value); updateFilters({ ...filters, sort: e.target.value } as any); }} aria-label="Сортировка">
              <option value="popular">По популярности</option>
              <option value="price-asc">По цене: сначала дешевле</option>
              <option value="price-desc">По цене: сначала дороже</option>
              <option value="new">По новизне</option>
            </select>
          </div>

          <div className="products-grid" style={{ marginTop: 24 }}>
            {sortedProducts.length > 0 ? (
              sortedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)
            ) : (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <p>Товары не найдены</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <div className={`categories-panel ${categoriesPanelOpen ? 'open' : ''}`}>
        <button type="button" onClick={() => setCategoriesPanelOpen(false)} aria-label="Закрыть" style={{ position: 'relative', top: '50px', right: '16px', width: '32px', height: '32px', background: '#fff', border: '1px solid #ddd', borderRadius: '50%', fontSize: '20px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 0 }}>×</button>
        <h2 className="categories-panel__title">Комнаты</h2>
        <div className="categories-panel__grid">
          <Link href="/catalog" className={`categories-panel__item ${!categoryParam ? 'active' : ''}`} onClick={() => setCategoriesPanelOpen(false)}>
            <span className="categories-panel__item-name">Все</span>
          </Link>
          {categories.map((c: any) => (
            <Link key={c.id} href={getCategoryUrl(c)} className={`categories-panel__item ${categoryParam === c.id || categoryParam === c.slug ? 'active' : ''}`} onClick={() => setCategoriesPanelOpen(false)}>
              <span className="categories-panel__item-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <Footer full />
    </>
  );
}
