'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import Link from 'next/link';

export default function DeliveryPage() {
  return (
    <>
      <Header />
      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/" />
      </div>
      <header className="page-header">
        <div className="container">
          <h1>Доставка</h1>
        </div>
      </header>
      <div className="container section" style={{ paddingTop: 0, maxWidth: 800 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 16 }}>Условия доставки</h2>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Доставляем мебель и товары для интерьера по Москве, Московской области и регионам России. Перед отправкой каждый заказ проходит проверку качества.
        </p>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Сроки</h3>
        <ul style={{ lineHeight: 1.8, paddingLeft: 20, color: 'var(--text-secondary)' }}>
          <li>Москва в пределах МКАД — 1–3 рабочих дня</li>
          <li>Московская область — 2–5 рабочих дней</li>
          <li>Регионы РФ — 5–14 рабочих дней в зависимости от удалённости</li>
          <li>Товары под заказ — срок уточняется менеджером</li>
        </ul>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Стоимость</h3>
        <ul style={{ lineHeight: 1.8, paddingLeft: 20, color: 'var(--text-secondary)' }}>
          <li>Москва в пределах МКАД — от 3 000 ₽</li>
          <li>За МКАД — от 3 000 ₽ + 50 ₽/км</li>
          <li>Регионы — рассчитывается индивидуально</li>
          <li>Самовывоз из салона — бесплатно</li>
        </ul>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Регионы доставки</h3>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Москва, Санкт-Петербург, Центральный ФО, Южный ФО и другие регионы России. Точную стоимость и срок рассчитает менеджер при подтверждении заказа.
        </p>

        <h3 style={{ marginTop: 32, marginBottom: 12 }}>Подъём и сборка</h3>
        <p style={{ marginBottom: 24, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          По желанию организуем подъём на этаж и профессиональную сборку. Услуга оплачивается отдельно.
        </p>

        <Link href="/catalog" className="btn btn--primary">Перейти в каталог</Link>
      </div>
      <Footer full />
    </>
  );
}
