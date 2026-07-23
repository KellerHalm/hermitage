import { Suspense } from 'react';
import CatalogClient from './CatalogClient';

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>}>
      <CatalogClient />
    </Suspense>
  );
}