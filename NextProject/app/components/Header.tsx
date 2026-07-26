'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store } from '../../lib/store';
import { getCategoryUrl, getProductUrl } from '@/lib/urls';
import { buildAssetUrl } from '../../lib/api';
import BurgerMenu from './BurgerMenu';
import NotificationsBell from './NotificationsBell';

type SearchResult = {
  products: any[];
  categories: any[];
  brands: any[];
};

export default function Header({ variant = 'solid' }: { variant?: 'solid' | 'hero' }) {
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const heroMode = variant === 'hero' && isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      setCartCount(Store.cart().length);
      setFavCount(Store.favorites().length);
    };

    update();

    const prev = (window as any).__storeUpdate;
    (window as any).__storeUpdate = () => {
      update();
      if (prev) prev();
    };

    window.addEventListener('storage', update);

    return () => {
      (window as any).__storeUpdate = prev;
      window.removeEventListener('storage', update);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      document.body.classList.add('search-open');
    } else {
      document.body.classList.remove('search-open');
      setSearchQuery('');
      setSearchResults(null);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await Store.search(searchQuery.trim());
        setSearchResults(results);
      } catch {
        const q = searchQuery.trim().toLowerCase();
        const products = Store.getProducts().filter((p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.factory?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        ).slice(0, 8);
        setSearchResults({ products, categories: [], brands: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const goToCatalog = () => {
    const q = searchQuery.trim();
    if (q) {
      window.location.href = `/catalog?search=${encodeURIComponent(q)}`;
    }
  };

  const headerClass = `site-header ${heroMode ? 'site-header--hero' : 'site-header--solid'} ${heroMode && scrolled ? 'is-scrolled' : ''}`;
  const hasResults = searchResults && (searchResults.products.length > 0 || searchResults.categories.length > 0 || searchResults.brands.length > 0);

  return (
    <>
      <header className={headerClass}>
        <div className="site-header__inner">
          <BurgerMenu />
          <Link href="/" className="logo">HERMITAGE</Link>
          <div className="header-actions">
            <button
              className="icon-btn"
              aria-label="Поиск"
              onClick={() => setSearchOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            </button>
            <NotificationsBell />
            <Link href="/favorites" className="icon-btn" aria-label="Избранное">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {favCount > 0 && <span className="badge-count">{favCount}</span>}
            </Link>
            <Link href="/account" className="icon-btn" aria-label="Кабинет">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM3 21v-1a9 9 0 0118 0v1" />
              </svg>
            </Link>
            <Link href="/cart" className="icon-btn" aria-label="Корзина">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      <div className={`search-panel ${searchOpen ? 'is-open' : ''}`} onClick={() => setSearchOpen(false)}>
        <div className="search-panel__wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="search-panel__box">
            <input
              type="search"
              placeholder="Поиск товаров, категорий, брендов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goToCatalog();
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              autoFocus={searchOpen}
            />
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setSearchOpen(false)}
            >
              Закрыть
            </button>
          </div>

          {searchQuery.trim() && (
            <div className="search-results">
              {searchLoading && <div className="search-results__loader">Поиск...</div>}

              {!searchLoading && hasResults && (
                <>
                  {searchResults!.products.length > 0 && (
                    <div className="search-results__section">
                      <p className="search-results__heading">Товары</p>
                      <div className="search-results__products">
                        {searchResults!.products.map((p: any) => (
                          <Link
                            key={p.id}
                            href={getProductUrl(p)}
                            onClick={() => setSearchOpen(false)}
                            className="search-product-card"
                          >
                            <div className="search-product-card__img">
                              <img
                                src={p.image || p.images?.[0] || buildAssetUrl(null)}
                                alt={p.name || 'Товар'}
                                loading="lazy"
                              />
                            </div>
                            <div className="search-product-card__info">
                              <span className="search-product-card__name">{p.name || 'Без названия'}</span>
                              <span className="search-product-card__price">{typeof p.price === 'number' ? p.price.toLocaleString('ru-RU') + ' \u20BD' : ''}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults!.categories.length > 0 && (
                    <div className="search-results__section">
                      <p className="search-results__heading">Категории</p>
                      <div className="search-results__links">
                        {searchResults!.categories.map((c: any) => (
                          <Link
                            key={c.id}
                            href={getCategoryUrl(c)}
                            onClick={() => setSearchOpen(false)}
                            className="search-results__link"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults!.brands.length > 0 && (
                    <div className="search-results__section">
                      <p className="search-results__heading">Бренды</p>
                      <div className="search-results__links">
                        {searchResults!.brands.map((b: any) => (
                          <Link
                            key={b.id}
                            href={`/catalog?search=${encodeURIComponent(b.name)}`}
                            onClick={() => setSearchOpen(false)}
                            className="search-results__link"
                          >
                            {b.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!searchLoading && !hasResults && (
                <div className="search-results__empty">Ничего не найдено</div>
              )}

              {!searchLoading && searchQuery.trim() && (
                <button type="button" className="search-results__all" onClick={goToCatalog}>
                  Все результаты по запросу &laquo;{searchQuery.trim()}&raquo;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
