'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import { Store } from '@/lib/store';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile' | 'favorites' | 'orders'>('login');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const apply = () => {
      const currentUser = Store.user();
      setUser(currentUser);
      setProducts(Store.getProducts());
      setOrders(Store.orders());
      setActiveTab(currentUser ? 'profile' : 'login');
    };

    apply();
    void Store.syncPublicData().then(apply).catch(() => undefined);
    void Store.syncUserData().then(apply).catch(() => undefined);

    const handler = () => apply();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const favoriteProducts = useMemo(() => {
    const ids = Store.favorites();
    return ids
      .map((id) => products.find((product) => String(product.id) === String(id)))
      .filter(Boolean);
  }, [products, user]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const nextUser = await Store.login(String(form.get('email') || ''), String(form.get('password') || ''));
      setUser(nextUser);
      setOrders(Store.orders());
      setActiveTab('profile');
      setToast({ message: 'Вход выполнен', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Не удалось войти', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const nextUser = await Store.register({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || ''),
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      });
      setUser(nextUser);
      setOrders(Store.orders());
      setActiveTab('profile');
      setToast({ message: 'Регистрация завершена', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Не удалось зарегистрироваться', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const nextUser = await Store.updateProfile({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || ''),
      });
      setUser(nextUser);
      setToast({ message: 'Данные сохранены', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Не удалось сохранить данные', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Store.logout();
    setUser(null);
    setOrders([]);
    setActiveTab('login');
    setToast({ message: 'Вы вышли из системы', type: 'info' });
  };

  return (
    <>
      <Header />

      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/" />
      </div>

      <header className="page-header">
        <div className="container">
          <h1>Личный кабинет</h1>
        </div>
      </header>

      <div className="container section" style={{ paddingTop: 0 }}>
        {!user ? (
          <>
            <div className="account-tabs">
              <button type="button" className={activeTab === 'login' ? 'is-active' : ''} onClick={() => setActiveTab('login')}>
                Вход
              </button>
              <button type="button" className={activeTab === 'register' ? 'is-active' : ''} onClick={() => setActiveTab('register')}>
                Регистрация
              </button>
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="checkout-form" style={{ maxWidth: 400 }}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" name="password" required />
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="checkout-form" style={{ maxWidth: 400 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input type="text" name="firstName" required />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input type="text" name="lastName" required />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input type="tel" name="phone" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" name="password" required minLength={6} />
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <p style={{ marginBottom: 24 }}>
              Здравствуйте, <strong>{user.firstName}</strong>
            </p>

            <div className="account-tabs">
              <button type="button" className={activeTab === 'profile' ? 'is-active' : ''} onClick={() => setActiveTab('profile')}>
                Личные данные
              </button>
              <button type="button" className={activeTab === 'favorites' ? 'is-active' : ''} onClick={() => setActiveTab('favorites')}>
                Избранное
              </button>
              <button type="button" className={activeTab === 'orders' ? 'is-active' : ''} onClick={() => setActiveTab('orders')}>
                История заказов
              </button>
            </div>

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="checkout-form" style={{ maxWidth: 480 }}>
                <div className="form-group">
                  <label>Имя</label>
                  <input type="text" name="firstName" defaultValue={user?.firstName || ''} required />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input type="text" name="lastName" defaultValue={user?.lastName || ''} required />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input type="tel" name="phone" defaultValue={user?.phone || ''} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} readOnly style={{ opacity: 0.6 }} />
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" className="btn btn--outline btn--block mt-2" onClick={handleLogout}>
                  Выйти
                </button>
              </form>
            )}

            {activeTab === 'favorites' && (
              <div>
                {favoriteProducts.length > 0 ? (
                  <div className="products-grid">
                    {favoriteProducts.map((product) => product && <ProductCard key={product.id} product={product} />)}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Избранное пусто</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <p className="order-card__date">{new Date(order.date).toLocaleString('ru-RU')}</p>
                      <p>
                        <strong>{order.firstName} {order.lastName}</strong> · {order.phone}
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{order.status}</p>
                      <ul style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                        {order.items.map((item: any, index: number) => (
                          <li key={index}>
                            {item.name}
                            {item.qty > 1 ? ` x${item.qty}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>Заказов пока нет</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

