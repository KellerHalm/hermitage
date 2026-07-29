'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { formatPrice, type Product } from '../../lib/data';
import { Store } from '../../lib/store';
import { useStoreData } from '@/lib/use-store-data';
import { getProductUrl } from '@/lib/urls';

type DiffMode = 'all' | 'hide';

export default function ComparePage() {
  const { data: HERMITAGE, loaded } = useStoreData();
  const [ids, setIds] = useState<string[]>([]);
  const [diffMode, setDiffMode] = useState<DiffMode>('all');

  useEffect(() => {
    if (!loaded) return;
    setIds(Store.compare());
  }, [loaded]);

  const products: any[] = ids
    .map((id) => HERMITAGE.products.find((p: any) => String(p.id) === String(id)))
    .filter(Boolean);

  useEffect(() => {
    if (!loaded) return;
    const validIds = ids.filter((id) =>
      HERMITAGE.products.some((p: any) => String(p.id) === String(id))
    );
    if (validIds.length !== ids.length) {
      Store.setCompare(validIds);
      setIds(validIds);
    }
  }, [loaded, ids, HERMITAGE.products]);

  const removeFromCompare = (id: string) => {
    Store.toggleCompare(id);
    setIds(Store.compare());
  };

  const getProductUrlFor = (product: any) => getProductUrl(product);

  const hasDiff = (key: string) => {
    if (key.startsWith('char:')) {
      const charName = key.slice(5);
      const values = products.map((p) => {
        const match = Array.isArray(p.characteristics)
          ? p.characteristics.find((ch: any) => ch.name === charName)
          : null;
        return String(match?.value ?? '').trim();
      });
      return [...new Set(values)].length > 1;
    }
    const values = products.map((p) => String(p[key] ?? '').trim());
    return [...new Set(values)].length > 1;
  };

  const charNames = (() => {
    const names = new Set<string>();
    products.forEach((p) => {
      if (Array.isArray(p.characteristics)) {
        p.characteristics.forEach((ch: any) => {
          if (ch.name) names.add(ch.name);
        });
      }
    });
    return Array.from(names);
  })();

  // Характеристики для таблицы
  const specs: { key: string; label: string; render?: (p: any) => React.ReactNode }[] = [
    { key: 'country', label: 'Страна' },
    { key: 'factory', label: 'Фабрика' },
    { key: 'sku', label: 'Артикул' },
    { key: 'sizes', label: 'Размеры' },
    { key: 'material', label: 'Материал' },
    { key: 'color', label: 'Цвет' },
    {
      key: 'inStock',
      label: 'Наличие',
      render: (p: any) => (
        <span className={`stock-badge stock-badge--${p.inStock === true ? 'ok' : p.inStock === 'preorder' ? 'preorder' : 'no'}`}>
          {p.inStock === true ? 'В наличии' : p.inStock === 'preorder' ? 'Под заказ' : 'Нет в наличии'}
        </span>
      ),
    },
  ];

  if (!loaded) {
    return (
      <>
        <Header />
        <div className="container section" style={{ paddingTop: 100, textAlign: 'center' }}>Загрузка...</div>
        <Footer />
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <Header />
        <div className="container" style={{ paddingTop: 16 }}><BackButton fallback="/catalog" /></div>
        <header className="page-header"><div className="container"><h1>Сравнение товаров</h1></div></header>
        <div className="container section" style={{ paddingTop: 0 }}>
          <div className="empty-state">
            <h2>Нет товаров для сравнения</h2>
            <Link href="/catalog" className="btn btn--outline" style={{ marginTop: 16 }}>В каталог</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container" style={{ paddingTop: 16 }}><BackButton fallback="/catalog" /></div>

      <header className="page-header">
        <div className="container">
          <h1>Сравнение товаров</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>До 4 товаров. Добавляйте из карточки товара.</p>
        </div>
      </header>

      <div className="container" style={{ marginBottom: 24 }}>
        <div className="compare-header-card">
          <div>
            <div className="compare-header-count">{products.length} из 4 товаров</div>
            <div className="compare-header-hint">Выберите товары для удобного сравнения характеристик.</div>
          </div>
          <button 
            onClick={() => { 
              products.forEach((p) => Store.toggleCompare(String(p.id))); 
              setIds([]); 
            }} 
            className="btn btn--outline"
          >
            Очистить
          </button>
        </div>
      </div>

      <div className="container" style={{ marginBottom: 20 }}>
        <div className="compare-modes">
          <button 
            className={`compare-mode-btn ${diffMode === 'all' ? 'is-active' : ''}`} 
            onClick={() => setDiffMode('all')}
          >
            Все параметры
          </button>
          <button 
            className={`compare-mode-btn ${diffMode === 'hide' ? 'is-active' : ''}`} 
            onClick={() => setDiffMode('hide')}
          >
            Только различия
          </button>
        </div>
      </div>

      <div className="container section" style={{ paddingTop: 0 }}>
        <p className="scroll-hint">Прокрутите таблицу влево →</p>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                {products.map((p) => (
                  <th key={p.id}>
                    <div className="compare-product-card">
                      <button 
                        className="compare-remove" 
                        onClick={() => removeFromCompare(String(p.id))} 
                        title="Убрать из сравнения"
                      >
                        ✕
                      </button>
                      <img 
                        className="compare-product-img" 
                        src={p.images?.[0] || p.image} 
                        alt={p.name} 
                      />
                      <Link href={getProductUrlFor(p)} className="compare-product-title">
                        {p.name}
                      </Link>
                      <div className="compare-product-price">
                        {formatPrice(p.price)}
                      </div>
                      <Link 
                        href={getProductUrlFor(p)} 
                        className="btn btn--outline btn--sm" 
                        style={{ marginTop: 12 }}
                      >
                        Подробнее
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map(({ key, label, render }) => (
                <tr 
                  key={key} 
                  className={diffMode === 'hide' && !hasDiff(key) ? 'compare-row--hidden' : ''}
                >
                  <td>{label}</td>
                  {products.map((p) => (
                    <td key={p.id}>
                      {render ? render(p) : p[key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
              {charNames.map((charName) => {
                const key = `char:${charName}`;
                return (
                  <tr 
                    key={key} 
                    className={diffMode === 'hide' && !hasDiff(key) ? 'compare-row--hidden' : ''}
                  >
                    <td>{charName}</td>
                    {products.map((p) => {
                      const match = Array.isArray(p.characteristics)
                        ? p.characteristics.find((ch: any) => ch.name === charName)
                        : null;
                      return <td key={p.id}>{match?.value || '—'}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </>
  );
}