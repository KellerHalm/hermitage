'use client';
import { showToast } from '@/lib/toast';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import BackButton from '../components/BackButton';
import { formatPrice } from '../../lib/data';
import { Store } from '../../lib/store';
import { useStoreData } from '@/lib/use-store-data';

type ProductPageProps = {
  initialSlug?: string;
};

export default function ProductPage({ initialSlug }: ProductPageProps) {
  const { data: HERMITAGE_DATA, loaded } = useStoreData();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const slugParam = initialSlug || searchParams.get('slug');
  const [product, setProduct] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [boughtTogether, setBoughtTogether] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(true);

  const cachedProduct = useMemo(() => {
    if (id) {
      return HERMITAGE_DATA.products.find((entry: any) => String(entry.id) === String(id));
    }
    if (slugParam) {
      return HERMITAGE_DATA.products.find((entry: any) => entry.slug === slugParam);
    }
    return null;
  }, [HERMITAGE_DATA.products, id, slugParam]);

  useEffect(() => {
    if (!loaded) return;

    const loadProduct = async () => {
      setProductLoading(true);

      if (cachedProduct) {
        setProduct(cachedProduct);
      }

      try {
        let freshProduct = null;

        if (id) {
          freshProduct = await Store.fetchProductById(String(id));
        } else if (slugParam) {
          freshProduct = await Store.fetchProductBySlug(slugParam);
        } else if ((cachedProduct as any)?.slug) {
          freshProduct = await Store.fetchProductBySlug((cachedProduct as any).slug);
        } else if (cachedProduct?.id) {
          freshProduct = await Store.fetchProductById(String(cachedProduct.id));
        }

        if (freshProduct) {
          setProduct(freshProduct);
          const [similarProducts, boughtTogetherProducts] = await Promise.all([
            Store.fetchSimilarProducts(freshProduct.slug),
            Store.fetchBoughtTogetherProducts(freshProduct.slug),
          ]);
          setSimilar(similarProducts);
          setBoughtTogether(boughtTogetherProducts);
        } else if (cachedProduct) {
          const localSimilar = HERMITAGE_DATA.products
            .filter((entry: any) => entry.id !== cachedProduct.id && (entry.category === cachedProduct.category || entry.factory === cachedProduct.factory))
            .slice(0, 4);
          setSimilar(localSimilar);
          setBoughtTogether(localSimilar);
        }
      } catch {
        if (cachedProduct) {
          setProduct(cachedProduct);
          const localSimilar = HERMITAGE_DATA.products
            .filter((entry: any) => entry.id !== cachedProduct.id && (entry.category === cachedProduct.category || entry.factory === cachedProduct.factory))
            .slice(0, 4);
          setSimilar(localSimilar);
          setBoughtTogether(localSimilar);
        }
      } finally {
        setProductLoading(false);
      }
    };

    void loadProduct();
  }, [loaded, id, slugParam, cachedProduct, HERMITAGE_DATA.products]);

  const [isFav, setIsFav] = useState(false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('desc');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [orderForm, setOrderForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    comment: '',
    deliveryType: 'pickup',
    paymentMethod: 'card_online',
    address: '',
  });

  useEffect(() => {
    if (!product) return;
    setIsFav(Store.isFavorite(String(product.id)));
    setIsInCompare(Store.isInCompare(String(product.id)));
    setCurrentUser(Store.user());
  }, [product]);

  useEffect(() => {
    const handler = () => setCurrentUser(Store.user());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!loaded || productLoading) return null;

  if (!product) {
    return (
      <>
        <Header />
        <div className="container" style={{ paddingTop: 16 }}><BackButton fallback="/catalog" /></div>
        <div className="container section">
          <div className="empty-state">
            <h2>Товар не найден</h2>
            <Link href="/catalog" className="btn btn--outline">В каталог</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const availabilityState = product.inStock as boolean | 'preorder';

  const toggleFav = () => {
    const next = Store.toggleFavorite(String(product.id));
    setIsFav(next);
  };

  const toggleCompare = () => {
    const next = Store.toggleCompare(String(product.id));
    setIsInCompare(next);
  };

  const addToCart = () => {
    Store.addToCart(String(product.id));
    showToast('Товар добавлен в корзину', 'success');
  };

  const getAvailabilityText = () => {
    if (availabilityState === 'preorder') return 'Под заказ';
    if (availabilityState === false || product.stockQuantity === 0) return 'Нет в наличии';
    if (typeof product.stockQuantity === 'number' && product.stockQuantity > 0 && product.stockQuantity <= 5) return `Осталось ${product.stockQuantity} шт.`;
    return 'В наличии';
  };

  const getAvailabilityColor = () => {
    if (availabilityState === 'preorder') return '#e65100';
    if (availabilityState === false || product.stockQuantity === 0) return '#c62828';
    return '#2e7d32';
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowOrderModal(false);
      setShowLoginModal(true);
      return;
    }

    setLoading(true);

    try {
      await Store.createOrder({
        firstName: orderForm.firstName || currentUser.firstName,
        lastName: orderForm.lastName || currentUser.lastName,
        phone: orderForm.phone || currentUser.phone,
        deliveryType: orderForm.deliveryType as 'pickup' | 'delivery',
        paymentMethod: orderForm.paymentMethod,
        address: orderForm.address,
        comment: orderForm.comment,
        items: [{ id: String(product.id), qty: 1 }],
      });
      showToast('Заявка отправлена', 'success');
      setShowOrderModal(false);
      setOrderForm({ firstName: '', lastName: '', phone: '', comment: '', deliveryType: 'pickup', paymentMethod: 'card_online', address: '' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось отправить заявку', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    setLoading(true);

    try {
      const user = await Store.login(String(form.get('email') || ''), String(form.get('password') || ''));
      setCurrentUser(user);
      setShowLoginModal(false);
      setShowOrderModal(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось войти', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    setLoading(true);

    try {
      const user = await Store.register({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || ''),
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      });
      setCurrentUser(user);
      setShowRegisterModal(false);
      setShowOrderModal(true);
      showToast('Регистрация завершена', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось зарегистрироваться', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/catalog" />
      </div>

      <div className="product-layout container" style={{ paddingTop: 0, paddingBottom: 32 }}>
        <div className="product-gallery">
          <div className="product-gallery__main">
            {product.images && product.images.length > 1 && (
              <>
                <button type="button" className="gallery-main-arrow gallery-main-arrow--left" onClick={() => setActiveImage((prev) => prev === 0 ? product.images.length - 1 : prev - 1)}>‹</button>
                <button type="button" className="gallery-main-arrow gallery-main-arrow--right" onClick={() => setActiveImage((prev) => prev === product.images.length - 1 ? 0 : prev + 1)}>›</button>
              </>
            )}
            <img src={product.images?.[activeImage] || product.image} alt={product.name} />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="gallery-thumbs-wrapper">
              {product.images.length > 6 && <button type="button" className="gallery-arrow gallery-arrow-left" onClick={() => thumbsRef.current?.scrollBy({ left: -696, behavior: 'smooth' })}>‹</button>}
              <div ref={thumbsRef} className="product-gallery__thumbs">
                {product.images.map((image: string, index: number) => (
                  <button key={index} type="button" className={index === activeImage ? 'is-active' : ''} onClick={() => setActiveImage(index)}>
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
              {product.images.length > 6 && <button type="button" className="gallery-arrow gallery-arrow-right" onClick={() => thumbsRef.current?.scrollBy({ left: 696, behavior: 'smooth' })}>›</button>}
            </div>
          )}
        </div>

        <div className="product-info">
          {product.isNew && <span className="badge badge--new" style={{ display: 'inline-block', marginBottom: 12 }}>Новинка</span>}
          {product.isSale && <span className="badge badge--sale" style={{ display: 'inline-block', marginBottom: 12 }}>Акция</span>}
          <h1>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <p className="product-info__price" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {product.oldPrice && product.oldPrice > product.price && (
                <>
                  <span className="price--old">{formatPrice(product.oldPrice)}</span>
                  <span className="price--discount">-{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</span>
                </>
              )}
              {formatPrice(product.price)}
            </p>
            <span style={{ padding: '6px 14px', background: getAvailabilityColor() === '#2e7d32' ? '#e8f5e9' : getAvailabilityColor() === '#e65100' ? '#fff3e0' : '#ffebee', color: getAvailabilityColor(), borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>
              {getAvailabilityText()}
            </span>
          </div>

          <div className="product-actions">
            <button type="button" className="btn btn--primary btn--block" onClick={addToCart}>Добавить в корзину</button>
            <button type="button" className="btn btn--outline btn--block" onClick={() => {
              if (!product.inStock || product.stockQuantity === 0) {
                showToast('Товар временно недоступен', 'error');
                return;
              }
              setShowOrderModal(true);
            }}>
              Оформить заявку
            </button>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" className="btn btn--outline btn--sm" onClick={toggleFav}>{isFav ? 'В избранном' : 'В избранное'}</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={toggleCompare}>{isInCompare ? 'В сравнении' : 'Сравнить'}</button>
            </div>
          </div>

          <div className="tabs">
            <div className="tabs__nav">
              <button type="button" className={activeTab === 'desc' ? 'is-active' : ''} onClick={() => setActiveTab('desc')}>Описание</button>
              <button type="button" className={activeTab === 'specs' ? 'is-active' : ''} onClick={() => setActiveTab('specs')}>Характеристики</button>
            </div>
            <div className="tabs__panel" style={{ display: activeTab === 'desc' ? 'block' : 'none' }}>
              <p>{product.description || 'Описание отсутствует'}</p>
            </div>
            <div className="tabs__panel" style={{ display: activeTab === 'specs' ? 'block' : 'none' }}>
              <table className="specs-table">
                <tbody>
                  <tr><td>Страна</td><td>{product.country}</td></tr>
                  <tr><td>Фабрика</td><td>{product.factory}</td></tr>
                  <tr><td>Артикул</td><td>{product.sku || '—'}</td></tr>
                  <tr><td>Размеры</td><td>{product.sizes || '—'}</td></tr>
                  <tr><td>Материал</td><td>{product.material || '—'}</td></tr>
                  <tr><td>Цвет</td><td>{product.color || '—'}</td></tr>
                  <tr><td>Наличие</td><td>{getAvailabilityText()}</td></tr>
                  {Array.isArray(product.characteristics) && product.characteristics.map((item: any, index: number) => (
                    <tr key={index}><td>{item.name}</td><td>{item.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' }} onClick={() => setShowOrderModal(false)}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', margin: '0 0 24px 0' }}>Оформить заявку</h2>
            {!currentUser ? (
              <>
                <p style={{ color: '#666', marginBottom: '20px' }}>Для отправки заявки необходимо войти в систему</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setShowOrderModal(false); setShowLoginModal(true); }} className="btn btn--primary" style={{ flex: 1 }}>Войти</button>
                  <button onClick={() => { setShowOrderModal(false); setShowRegisterModal(true); }} className="btn btn--outline" style={{ flex: 1 }}>Регистрация</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleOrderSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Имя</label>
                  <input type="text" required defaultValue={currentUser.firstName} onChange={(e) => setOrderForm({ ...orderForm, firstName: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Фамилия</label>
                  <input type="text" defaultValue={currentUser.lastName} onChange={(e) => setOrderForm({ ...orderForm, lastName: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Телефон</label>
                  <input type="tel" required defaultValue={currentUser.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Способ получения</label>
                  <select value={orderForm.deliveryType} onChange={(e) => setOrderForm({ ...orderForm, deliveryType: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <option value="pickup">Самовывоз</option>
                    <option value="delivery">Доставка</option>
                  </select>
                </div>
                {orderForm.deliveryType === 'delivery' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Адрес доставки</label>
                    <input type="text" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Способ оплаты</label>
                  <select value={orderForm.paymentMethod} onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <option value="card_online">Онлайн-оплата картой</option>
                    <option value="on_delivery">Оплата при получении</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Комментарий</label>
                  <textarea rows={3} value={orderForm.comment} onChange={(e) => setOrderForm({ ...orderForm, comment: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Отправка...' : 'Отправить заявку'}</button>
                  <button type="button" onClick={() => setShowOrderModal(false)} className="btn btn--outline" style={{ flex: 1 }}>Отмена</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' }} onClick={() => setShowLoginModal(false)}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', margin: '0 0 24px 0' }}>Вход</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Email</label>
                <input name="email" type="email" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Пароль</label>
                <input name="password" type="password" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn btn--outline" style={{ flex: 1 }}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' }} onClick={() => setShowRegisterModal(false)}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '100%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', margin: '0 0 24px 0' }}>Регистрация</h2>
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Имя</label><input name="firstName" type="text" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Фамилия</label><input name="lastName" type="text" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Email</label><input name="email" type="email" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Телефон</label><input name="phone" type="tel" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div style={{ marginBottom: '24px' }}><label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Пароль</label><input name="password" type="password" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn btn--outline" style={{ flex: 1 }}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {boughtTogether.length > 0 && (
        <section className="section" style={{ background: '#f9f9f9' }}>
          <div className="container">
            <h2 className="section__title">С этим покупают</h2>
            <div className="products-grid">
              {boughtTogether.map((entry: any) => <ProductCard key={entry.id} product={entry} />)}
            </div>
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="section" style={{ background: 'var(--white)' }}>
          <div className="container">
            <p className="section__subtitle">Рекомендуем</p>
            <h2 className="section__title">Похожие товары</h2>
            <div className="products-grid">
              {similar.map((entry: any) => <ProductCard key={entry.id} product={entry} />)}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

