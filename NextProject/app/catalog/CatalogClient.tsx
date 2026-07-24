'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [serverProducts, setServerProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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
      setCategories(Store.getCategories());
      setBrands(Store.getBrands());
      setLoaded(true);
    };
    loadData();
    return Store.subscribeToProducts(loadData);
  }, []);

  const buildQueryParams = useCallback(() => {
    const params: Record<string, unknown> = { page, limit: 24 };

    if (categoryParam) params.categorySlug = categoryParam;
    if (searchQuery) params.search = searchQuery;
    if (filters.minPrice) params.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
    if (filters.country) params.country = filters.country;
    if (filters.color) params.color = filters.color;
    if (filters.material) params.material = filters.material;
    if (filters.inStock) {
      if (filters.inStock === 'yes') params.stockStatus = 'IN_STOCK';
      else if (filters.inStock === 'no') params.stockStatus = 'OUT_OF_STOCK';
      else if (filters.inStock === 'preorder') params.stockStatus = 'ON_ORDER';
    }

    const brandObj = brands.find((b: any) => b.name === filters.factory);
    if (brandObj?.id) params.brandId = brandObj.id;

    if (newOnly) params.isNew = 'true';
    if (saleOnly) params.isSale = 'true';

    if (sort === 'price-asc') params.sort = 'price_asc';
    else if (sort === 'price-desc') params.sort = 'price_desc';
    else if (sort === 'new') params.sort = 'popular';
    else if (sort === 'discount') params.sort = 'discount';
    else params.sort = 'popular';

    return params;
  }, [categoryParam, searchQuery, filters, brands, newOnly, saleOnly, sort, page]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await Store.fetchProducts(buildQueryParams());
      setServerProducts(result);
    } catch {
      setServerProducts([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchProducts();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loaded, filters, sort, categoryParam, searchQuery, newOnly, saleOnly, page]);

  useEffect(() => {
    setPage(1);
  }, [filters, sort, categoryParam, searchQuery, newOnly, saleOnly]);

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

  const allProducts = serverProducts.length > 0 ? serverProducts : [];

  const countries = [...new Set(allProducts.map((p: any) => p.country).filter(Boolean))];
  const colors = [...new Set(allProducts.map((p: any) => p.color).filter(Boolean))];
  const materials = [...new Set(allProducts.map((p: any) => p.material?.split(',')[0]?.trim()).filter(Boolean))];

  const pageTitle = activeCategory
    ? activeCategory.name
    : newOnly
      ? 'Новинки'
      : saleOnly
        ? 'Акции'
        : searchQuery
          ? `Поиск: ${searchQuery}`
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
                {brands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
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
            Выбрать комнату <span style={{ fontSize: 12 }}>&#9660;</span>
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
            <select id="sort-select" value={sort} onChange={(e) => { setSort(e.target.value); }} aria-label="Сортировка">
              <option value="popular">По популярности</option>
              <option value="price-asc">По цене: сначала дешевле</option>
              <option value="price-desc">По цене: сначала дороже</option>
              <option value="new">По новизне</option>
              <option value="discount">Сначала со скидкой</option>
            </select>
          </div>

          <div className="products-grid" style={{ marginTop: 24 }}>
            {loading ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <p>Загрузка товаров...</p>
              </div>
            ) : allProducts.length > 0 ? (
              allProducts.map((p: any) => <ProductCard key={p.id} product={p} />)
            ) : (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <p>Товары не найдены</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32, paddingBottom: 32 }}>
              <button
                className="btn btn--outline btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <span style={{ fontSize: 14, color: '#666' }}>
                Страница {page} из {totalPages}
              </span>
              <button
                className="btn btn--outline btn--sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Вперёд
              </button>
            </div>
          )}
        </main>
      </div>

      <div className={`categories-panel ${categoriesPanelOpen ? 'open' : ''}`}>
        <button type="button" onClick={() => setCategoriesPanelOpen(false)} aria-label="Закрыть" style={{ position: 'relative', top: '50px', right: '16px', width: '32px', height: '32px', background: '#fff', border: '1px solid #ddd', borderRadius: '50%', fontSize: '20px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 0 }}>&times;</button>
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
