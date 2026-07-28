'use client';

import { useEffect, useState } from 'react';
import { Store } from '@/lib/store';
import { fetchCsrfToken } from '@/lib/api';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    Store.init();
    fetchCsrfToken();

    const handler = () => setTick((value) => value + 1);

    window.addEventListener('storage', handler);
    (window as any).__storeUpdate = handler;

    void Store.bootstrap().catch(() => undefined);

    return () => {
      window.removeEventListener('storage', handler);
      delete (window as any).__storeUpdate;
    };
  }, []);

  return <>{children}</>;
}

