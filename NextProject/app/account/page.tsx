'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import { Store } from '@/lib/store';

export default function AccountPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile' | 'favorites' | 'orders'>('login');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');

    const apply = () => {
      const currentUser = Store.user();
      setUser(currentUser);
      setProducts(Store.getProducts());
      setOrders(Store.orders());

      if (currentUser && tabParam && ['profile', 'favorites', 'orders'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      } else {
        setActiveTab(currentUser ? 'profile' : 'login');
      }
    };

    apply();
    void Store.syncPublicData().then(apply).catch(() => undefined);
    void Store.syncUserData().then(apply).catch(() => undefined);

    const handler = () => apply();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [searchParams]);

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
        email: String(form.get('email') || ''),
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) return;
    setLoading(true);
    try {
      await Store.deleteAccount();
      setUser(null);
      setOrders([]);
      setActiveTab('login');
      setToast({ message: 'Аккаунт удалён', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Не удалось удалить аккаунт', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get('newPassword') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    const currentPassword = String(form.get('currentPassword') || '');

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Новые пароли не совпадают', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    try {
      await Store.updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        password: newPassword,
        currentPassword,
      });
      setShowPasswordForm(false);
      setToast({ message: 'Пароль изменён', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Не удалось изменить пароль', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
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
                  <input type="email" name="email" defaultValue="" required />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" name="password" defaultValue="" required />
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
                  <input type="text" name="firstName" defaultValue="" required />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input type="text" name="lastName" defaultValue="" required />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input type="tel" name="phone" defaultValue="" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" defaultValue="" required />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" name="password" defaultValue="" required minLength={8} />
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
              <>
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
                    <input type="email" name="email" defaultValue={user?.email || ''} required />
                  </div>
                  <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" className="btn btn--outline btn--block mt-2" onClick={handleLogout}>
                    Выйти
                  </button>
                  <button type="button" className="btn btn--outline btn--block mt-2" onClick={handleDeleteAccount} disabled={loading} style={{ color: '#dc3545', borderColor: '#dc3545' }}>
                    Удалить аккаунт
                  </button>
                </form>

                {!showPasswordForm ? (
                  <button type="button" className="btn btn--outline btn--block mt-2" onClick={() => setShowPasswordForm(true)} style={{ maxWidth: 480 }}>
                    Сменить пароль
                  </button>
                ) : (
                  <div className="password-change-section" style={{ maxWidth: 480 }}>
                    <h3 className="password-change-title">Смена пароля</h3>
                    <form onSubmit={handlePasswordChange}>
                      <div className="form-group">
                        <label>Текущий пароль</label>
                        <input type="password" name="currentPassword" required minLength={8} />
                      </div>
                      <div className="form-group">
                        <label>Новый пароль</label>
                        <input type="password" name="newPassword" required minLength={8} />
                      </div>
                      <div className="form-group">
                        <label>Подтвердите новый пароль</label>
                        <input type="password" name="confirmPassword" required minLength={8} />
                      </div>
                      <div className="password-change-actions">
                        <button type="submit" className="btn btn--primary" disabled={passwordLoading}>
                          {passwordLoading ? 'Сохранение...' : 'Сохранить пароль'}
                        </button>
                        <button type="button" className="btn btn--outline" onClick={() => setShowPasswordForm(false)} disabled={passwordLoading}>
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
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
                {orders.length > 0 && (
                  <div className="order-filters">
                    <button type="button" className={`order-filters__btn ${orderFilter === '' ? 'is-active' : ''}`} onClick={() => setOrderFilter('')}>
                      Все
                    </button>
                    <button type="button" className={`order-filters__btn ${orderFilter === 'PENDING' ? 'is-active' : ''}`} onClick={() => setOrderFilter('PENDING')}>
                      Ожидает
                    </button>
                    <button type="button" className={`order-filters__btn ${orderFilter === 'PROCESSING' ? 'is-active' : ''}`} onClick={() => setOrderFilter('PROCESSING')}>
                      В обработке
                    </button>
                    <button type="button" className={`order-filters__btn ${orderFilter === 'SHIPPED' ? 'is-active' : ''}`} onClick={() => setOrderFilter('SHIPPED')}>
                      В доставке
                    </button>
                    <button type="button" className={`order-filters__btn ${orderFilter === 'DELIVERED' ? 'is-active' : ''}`} onClick={() => setOrderFilter('DELIVERED')}>
                      Доставлены
                    </button>
                    <button type="button" className={`order-filters__btn ${orderFilter === 'CANCELLED' ? 'is-active' : ''}`} onClick={() => setOrderFilter('CANCELLED')}>
                      Отменены
                    </button>
                  </div>
                )}

                {(() => {
                  const filtered = orderFilter ? orders.filter(o => o.status === orderFilter) : orders;

                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state">
                        <p>{orderFilter ? 'Нет заказов с таким статусом' : 'Заказов пока нет'}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="orders-list">
                      {filtered.map((order) => (
                        <div key={order.id} className="order-card">
                          <div className="order-card__header">
                            <div>
                              <span className="order-card__id">Заказ #{order.id.slice(0, 8)}</span>
                              <span className="order-card__date">{new Date(order.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <span className={`order-card__status order-card__status--${order.status.toLowerCase()}`}>
                              {order.status === 'PENDING' && 'Ожидает обработки'}
                              {order.status === 'PROCESSING' && 'В обработке'}
                              {order.status === 'SHIPPED' && 'В доставке'}
                              {order.status === 'DELIVERED' && 'Доставлен'}
                              {order.status === 'CANCELLED' && 'Отменён'}
                            </span>
                          </div>

                          <div className="order-card__items">
                            {order.items.map((item: any, index: number) => (
                              <Link
                                key={index}
                                href={item.slug ? `/product/${item.slug}` : '#'}
                                className="order-card__item"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <div className="order-card__item-img">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} loading="lazy" />
                                  ) : (
                                    <div className="order-card__item-placeholder">Нет фото</div>
                                  )}
                                </div>
                                <div className="order-card__item-info">
                                  <span className="order-card__item-name">{item.name}</span>
                                  <span className="order-card__item-details">
                                    {item.qty > 1 && <span>{item.qty} шт.</span>}
                                    <span>{item.price.toLocaleString('ru-RU')} &#8381;</span>
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>

                          <div className="order-card__footer">
                            <span className="order-card__total">
                              Итого: {order.total.toLocaleString('ru-RU')} &#8381;
                            </span>
                            {order.deliveryType && (
                              <span className="order-card__delivery">
                                {order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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

