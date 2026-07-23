'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ProductCard from '../components/ProductCard';
import { useStoreData } from '@/lib/use-store-data';
import { Store } from '@/lib/store';

export default function FavoritesPage() {
  const { data: HERMITAGE, loaded } = useStoreData();
  const [products, setProducts] = useState<any[]>([]);

  const refresh = () => {
    const favIds = Store.favorites();
    const found = favIds
      .map((id) => HERMITAGE.products.find((p: any) => String(p.id) === String(id)))
      .filter(Boolean);
    setProducts(found);
  };

  useEffect(() => {
    if (!loaded) return;
    refresh();
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loaded, HERMITAGE.products]);

  const removeFromFavorites = (id: string) => {
    Store.toggleFavorite(id);
    refresh();
  };

  if (!loaded) {
    return (
      <>
        <Header />
        <div className="container section" style={{ paddingTop: 100, textAlign: 'center' }}>
          Загрузка...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/catalog" />
      </div>

      <header className="page-header">
        <div className="container">
          <h1>Избранное</h1>
        </div>
      </header>

      <div className="container section" style={{ paddingTop: 0 }}>
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((p) => (
              <div key={p.id} style={{ position: 'relative' }}>
                <ProductCard product={p} />
                <button
                  onClick={() => removeFromFavorites(String(p.id))}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 10,
                  }}
                  aria-label="Удалить из избранного"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>В избранном пока пусто</h2>
            <Link href="/catalog" className="btn btn--outline" style={{ marginTop: 16 }}>В каталог</Link>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
