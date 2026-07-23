'use client';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <div className="container" style={{ paddingTop: 16 }}>
        <BackButton fallback="/" />
      </div>
      <header className="page-header">
        <div className="container">
          <h1>Политика конфиденциальности</h1>
        </div>
      </header>
      <div className="container section" style={{ paddingTop: 0, maxWidth: 800 }}>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Мы обрабатываем персональные данные (имя, телефон, email, адрес доставки) исключительно для оформления и выполнения заказов, обратной связи и улучшения сервиса.
        </p>
        <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Данные не передаются третьим лицам, кроме служб доставки и платёжных провайдеров в объёме, необходимом для исполнения заказа.
        </p>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Вы можете запросить удаление или изменение своих данных, обратившись на info@hermitage-decor.ru.
        </p>
      </div>
      <Footer full />
    </>
  );
}
