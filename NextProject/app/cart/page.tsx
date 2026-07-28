'use client';
import { showToast } from '@/lib/toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { formatPrice, type Product } from '../../lib/data';
import { Store } from '../../lib/store';
import { useStoreData } from '@/lib/use-store-data';
import { getProductUrl } from '@/lib/urls';
import { validate } from '@/lib/validation';

interface CartItem extends Product {
  qty: number;
}

export default function CartPage() {
  const { data: HERMITAGE, loaded } = useStoreData();
  const [cart, setCart] = useState<Array<{ id: string; qty: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    deliveryType: 'pickup',
    paymentMethod: 'card_online',
    address: '',
    comment: '',
  });

  useEffect(() => {
    if (!loaded) return;
    setCart(Store.cart());
    const user = Store.user();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        email: user.email || '',
      }));
    }
  }, [loaded]);

  useEffect(() => {
    const handler = () => setCart(Store.cart());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const items = cart.flatMap((cartItem) => {
    const product = HERMITAGE.products.find((entry: any) => String(entry.id) === String(cartItem.id));
    return product ? [{ ...product, qty: cartItem.qty } as CartItem] : [];
  });

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const updateQty = (id: string, delta: number) => {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      Store.removeFromCart(id);
    } else {
      Store.updateCartQty(id, nextQty);
    }
    setCart(Store.cart());
  };

  const removeFromCart = (id: string) => {
    Store.removeFromCart(id);
    setCart(Store.cart());
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!Store.user()) {
      showToast('Для оформления заказа необходимо войти в аккаунт', 'error');
      return;
    }

    const errors = [
      validate.name(formData.firstName, 'Имя'),
      validate.name(formData.lastName, 'Фамилия'),
      validate.phone(formData.phone),
    ].filter(Boolean);
    if (errors.length > 0) { showToast(errors[0]!, 'error'); return; }

    if (formData.email) {
      const emailError = validate.email(formData.email);
      if (emailError) { showToast(emailError, 'error'); return; }
    }

    const unavailable = items.filter((item) => item.inStock === false || item.stockQuantity === 0);
    if (unavailable.length > 0) {
      showToast(`Некоторые товары недоступны: ${unavailable.map((item) => item.name).join(', ')}`, 'error');
      return;
    }

    if (formData.deliveryType === 'delivery' && !formData.address.trim()) {
      showToast('Укажите адрес доставки', 'error');
      return;
    }

    if (formData.deliveryType === 'delivery' && formData.address.length > 500) {
      showToast('Адрес доставки: максимум 500 символов', 'error');
      return;
    }

    if (formData.comment.length > 1000) {
      showToast('Комментарий: максимум 1000 символов', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await Store.createOrder({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        deliveryType: formData.deliveryType as 'pickup' | 'delivery',
        paymentMethod: formData.paymentMethod,
        address: formData.address,
        comment: formData.comment,
        items: items.map((item) => ({ id: String(item.id), qty: item.qty })),
      });

      setCart([]);
      showToast('Заказ успешно отправлен', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Не удалось оформить заказ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <>
        <Header />
        <div className="container section" style={{ paddingTop: 100, textAlign: 'center' }}>Загрузка...</div>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="container" style={{ paddingTop: 16 }}>
          <BackButton fallback="/catalog" />
        </div>
        <header className="page-header">
          <div className="container">
            <h1>Оформление заказа</h1>
          </div>
        </header>
        <div className="container section" style={{ paddingTop: 0 }}>
          <div className="empty-state">
            <h2>Корзина пуста</h2>
            <p>Добавьте товары для оформления заказа</p>
            <Link href="/catalog" className="btn btn--primary" style={{ marginTop: 20 }}>В каталог</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/catalog" />
      </div>
      <header className="page-header">
        <div className="container">
          <h1>Оформление заказа</h1>
        </div>
      </header>
      <div className="container section" style={{ paddingTop: 0 }}>
        <div className="cart-layout">
          <div>
            <div className="cart-list">
              {cart.map((cartItem) => {
                const product = HERMITAGE.products.find((entry: any) => String(entry.id) === String(cartItem.id));
                if (!product) return null;
                const productUrl = getProductUrl(product as any);

                return (
                  <div key={cartItem.id} className="cart-item">
                    <Link href={productUrl} className="cart-item__img">
                      <img src={product.images?.[0] || product.image} alt={product.name} />
                    </Link>
                    <div className="cart-item__info">
                      <h3><Link href={productUrl}>{product.name}</Link></h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{product.country} · {product.factory}</p>
                      <p className="product-card__price">{formatPrice(product.price)}</p>
                      <div className="qty-control">
                        <button type="button" onClick={() => updateQty(cartItem.id, -1)}>−</button>
                        <span>{cartItem.qty}</span>
                        <button type="button" onClick={() => updateQty(cartItem.id, 1)}>+</button>
                      </div>
                      <button type="button" className="cart-remove" onClick={() => removeFromCart(cartItem.id)}>Удалить</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 18, marginTop: 16 }}>Итого: <strong>{formatPrice(total)}</strong></p>
            <p style={{ marginTop: 8 }}>
              <Link href="/delivery" style={{ fontSize: 14 }}>Условия доставки</Link>
              {' · '}
              <Link href="/payment" style={{ fontSize: 14 }}>Способы оплаты</Link>
            </p>
          </div>

          <form className="checkout-form" onSubmit={submitOrder}>
            <h2 style={{ fontSize: 24, marginBottom: 24, fontFamily: 'var(--font-display)' }}>Ваши данные</h2>

            <div className="form-group">
              <label htmlFor="firstName">Имя</label>
              <input type="text" id="firstName" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Фамилия</label>
              <input type="text" id="lastName" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон</label>
              <input type="tel" id="phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <h3 style={{ marginBottom: '12px' }}>Способ получения</h3>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              <label><input type="radio" name="deliveryType" value="pickup" checked={formData.deliveryType === 'pickup'} onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })} /> Самовывоз</label>
              <label><input type="radio" name="deliveryType" value="delivery" checked={formData.deliveryType === 'delivery'} onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })} /> Доставка</label>
            </div>

            {formData.deliveryType === 'delivery' && (
              <div className="form-group">
                <label htmlFor="address">Адрес доставки</label>
                <textarea id="address" required rows={4} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical' }} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
            )}

            <h3 style={{ marginBottom: '12px' }}>Способ оплаты</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <label><input type="radio" name="paymentMethod" value="card_online" checked={formData.paymentMethod === 'card_online'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} /> Онлайн-оплата картой</label>
              <label><input type="radio" name="paymentMethod" value="on_delivery" checked={formData.paymentMethod === 'on_delivery'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} /> Оплата при получении</label>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Комментарий к заказу</label>
              <textarea id="comment" rows={4} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical' }} value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} />
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Отправка...' : 'Оформить заказ'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
