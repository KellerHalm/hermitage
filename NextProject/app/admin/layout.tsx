'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Store } from '@/lib/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;

    if (!Store.isAuthenticated() || !Store.isAdmin()) {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    Store.logout();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin', label: 'Дашборд' },
    { href: '/admin/products', label: 'Товары' },
    { href: '/admin/brands', label: 'Бренды' },
    { href: '/admin/categories', label: 'Категории' },
    { href: '/admin/orders', label: 'Заказы' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f0' }}>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mobile-menu-btn"
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1001,
          padding: '12px',
          background: '#1a1a1a',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'none',
        }}
      >
        {sidebarOpen ? '?' : '?'}
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'block',
          }}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '260px',
        background: '#1a1a1a',
        color: '#fff',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1000,
        left: 0,
        transition: 'transform 0.3s ease',
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #333' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '24px',
            margin: 0,
          }}>
            HERMITAGE
          </h2>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            Админ-панель
          </p>
        </div>

        <nav style={{ padding: '24px 0' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'block',
                padding: '12px 24px',
                color: pathname === item.href ? '#b89968' : '#ccc',
                textDecoration: 'none',
                fontSize: '14px',
                background: pathname === item.href ? 'rgba(184, 153, 104, 0.1)' : 'transparent',
                borderLeft: pathname === item.href ? '3px solid #b89968' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '0',
          right: '0',
          padding: '0 24px',
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid #555',
              color: '#ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Выйти
          </button>
        </div>
      </aside>

      <main className="admin-content" style={{
        marginLeft: '260px',
        flex: 1,
        minWidth: 0,
        padding: '32px',
      }}>
        {children}
      </main>
    </div>
  );
}

