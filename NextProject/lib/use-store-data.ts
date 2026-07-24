'use client';

import { useEffect, useState } from 'react';
import { SITE, COUNTRY_IMAGES, DEFAULT_COUNTRY_IMAGE } from './site';
import { buildAssetUrl } from './api';
import { Store } from './store';

const buildCountries = (brands: any[], products: any[]) => {
  const names = new Set<string>();
  brands.forEach((brand) => {
    if (brand.country) names.add(brand.country);
  });
  products.forEach((product) => {
    if (product.country) names.add(product.country);
  });

  return [...names].map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    image: buildAssetUrl(COUNTRY_IMAGES[name] || DEFAULT_COUNTRY_IMAGE),
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
      setData({
        ...SITE,
        products,
        categories,
        brands,
        countries: buildCountries(brands, products),
      });
      setLoaded(true);
    };

    applyData();
    const unsubscribe = Store.subscribeToProducts(applyData);
    return unsubscribe;
  }, []);

  return { data, loaded };
}
