'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/" />
      </div>
      <header className="page-header">
        <div className="container">
          <h1>Обмен и возврат</h1>
        </div>
      </header>
      <div className="container section" style={{ paddingTop: 0, maxWidth: 800 }}>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Вы можете вернуть или обменять товар надлежащего качества в течение 7 дней с момента получения, если сохранены товарный вид, упаковка и документы.
        </p>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Товары с индивидуальными характеристиками, изготовленные под заказ, возврату не подлежат, за исключением случаев заводского брака.
        </p>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          По вопросам обмена и возврата свяжитесь с нами: +7 (900) 123-45-67 или info@hermitage-decor.ru.
        </p>
      </div>
      <Footer full />
    </>
  );
}
