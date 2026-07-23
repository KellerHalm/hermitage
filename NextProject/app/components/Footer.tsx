import Link from "next/link";

export default function Footer({ full = false }: { full?: boolean }) {
  if (!full) {
    return (
      <footer className="site-footer">
        <div className="container footer-copy">© 2026 HERMITAGE</div>
      </footer>
    );
  }

  return (
    <footer className="site-footer" id="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-logo">HERMITAGE</div>
          <div className="footer-contacts" style={{ marginTop: 20 }}>
            <p><a href="tel:+79001234567">+7 (900) 123-45-67</a></p>
            <p><a href="https://wa.me/79001234567" target="_blank" rel="noopener">WhatsApp</a></p>
            <p><a href="mailto:info@hermitage-decor.ru">info@hermitage-decor.ru</a></p>
            <p>Москва, ул. Тверская, 12</p>
          </div>
        </div>
        <div className="footer-links">
          <Link href="/delivery">Доставка</Link>
          <Link href="/payment">Оплата</Link>
          <Link href="/returns">Обмен и возврат</Link>
          <Link href="/privacy">Политика конфиденциальности</Link>
        </div>
        <div className="footer-links">
          <Link href="/catalog">Каталог</Link>
          <Link href="/account">Личный кабинет</Link>
          <Link href="/compare">Сравнение</Link>
          <Link href="/cart">Корзина</Link>
        </div>
      </div>
      <div className="container footer-copy">© 2026 HERMITAGE. Все права защищены.</div>
    </footer>
  );
}
