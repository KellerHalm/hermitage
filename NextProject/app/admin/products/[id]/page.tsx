'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProductPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/products');
  }, [router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
      Перенаправление...
    </div>
  );
}
