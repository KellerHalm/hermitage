'use client';

import { useParams } from 'next/navigation';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id;

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', marginBottom: '24px' }}>
        Редактирование товара
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        ID товара: {productId}
      </p>
      <p style={{ color: '#666' }}>
        Страница редактирования товара (в разработке)
      </p>
    </div>
  );
}