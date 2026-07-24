'use client';

import { useEffect, useState } from 'react';
import { SITE } from './site';
import { buildAssetUrl } from './api';
import { Store } from './store';

const DEFAULT_COUNTRY_IMAGE = '/uploads/images/product-fallback.svg';

const buildCountries = (dbCountries: any[]) => {
  return dbCountries.map((c) => ({
    id: c.id || c.slug,
    name: c.name,
    image: c.image ? buildAssetUrl(c.image) : buildAssetUrl(DEFAULT_COUNTRY_IMAGE),
  }));
};

const emptyData = {
  ...SITE,
  products: [] as any[],
  categories: [] as any[],
  brands: [] as any[],
  countries: [] as any[],
};

export function useStoreData() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const applyData = () => {
      const products = Store.getProducts();
      const categories = Store.getCategories();
      const brands = Store.getBrands();
      const countries = Store.getCountries();
      setData({
        ...SITE,
        products,
        categories,
        brands,
        countries: buildCountries(countries),
      });
      setLoaded(true);
    };

    applyData();
    const unsubscribe = Store.subscribeToProducts(applyData);
    return unsubscribe;
  }, []);

  return { data, loaded };
}
