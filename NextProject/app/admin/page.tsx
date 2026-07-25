'use client';
import { Store } from '@/lib/store';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    orders: 0,
    users: 0,
  });

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        Store.syncPublicData(),
        Store.loadAdminOrders(),
      ]);

      let users: any[] = [];
      try {
        users = await Store.loadUsers();
      } catch {}

      setStats({
        products: Store.getProducts().length,
        categories: Store.getCategories().length,
        brands: Store.getBrands().length,
        orders: Store.getAdminOrders().length,
        users: users.length,
      });
    };

    void load();
  }, []);

  return (
    <div style={{ padding: '40px', background: '#f5f5f0', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', marginBottom: '32px' }}>
        Админ-панель
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '14px', color: '#777' }}>Товары</div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginTop: '10px' }}>{stats.products}</div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '14px', color: '#777' }}>Категории</div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginTop: '10px' }}>{stats.categories}</div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '14px', color: '#777' }}>Бренды</div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginTop: '10px' }}>{stats.brands}</div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '14px', color: '#777' }}>Заказы</div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginTop: '10px' }}>{stats.orders}</div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '14px', color: '#777' }}>Пользователи</div>
          <div style={{ fontSize: '36px', fontWeight: 700, marginTop: '10px' }}>{stats.users}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <Link href="/admin/products" style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#1a1a1a' }}>
          <h3 style={{ marginBottom: '8px' }}>Товары</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Управление каталогом</p>
        </Link>

        <Link href="/admin/orders" style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#1a1a1a' }}>
          <h3 style={{ marginBottom: '8px' }}>Заказы</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Просмотр заказов</p>
        </Link>

        <Link href="/admin/categories" style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#1a1a1a' }}>
          <h3 style={{ marginBottom: '8px' }}>Категории</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Управление категориями</p>
        </Link>

        <Link href="/admin/users" style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#1a1a1a' }}>
          <h3 style={{ marginBottom: '8px' }}>Пользователи</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Управление пользователями</p>
        </Link>
      </div>
    </div>
  );
}

