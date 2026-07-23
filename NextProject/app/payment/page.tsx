'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import Link from 'next/link';

export default function PaymentPage() {
  return (
    <>
      <Header />
      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/" />
      </div>
      <header className="page-header">
        <div className="container">
          <h1>Оплата</h1>
        </div>
      </header>
      <div className="container section" style={{ paddingTop: 0, maxWidth: 800 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 16 }}>Способы оплаты</h2>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Вы можете оплатить заказ онлайн картой или при получении — если это доступно для выбранного способа доставки.
        </p>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Онлайн-оплата картой</h3>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Безопасная оплата банковской картой после подтверждения заказа менеджером. Ссылка на оплату отправляется на email или в мессенджер.
        </p>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Оплата при получении</h3>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Доступна для самовывоза и доставки по Москве (по согласованию). Оплата наличными или картой курьеру / в салоне.
        </p>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Предоплата</h3>
        <p style={{ marginBottom: 24, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Для товаров под заказ может потребоваться предоплата. Размер и условия обсуждаются с менеджером.
        </p>

        <Link href="/cart" className="btn btn--primary">Оформить заказ</Link>
      </div>
      <Footer full />
    </>
  );
}
