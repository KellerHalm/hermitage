'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('nav-open');
    } else {
      document.body.classList.remove('nav-open');
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setIsOpen(false);

  return (
    <>
      <button
        className="nav-toggle"
        aria-label="Меню"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`site-nav ${isOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="nav-close"
          aria-label="Закрыть меню"
          onClick={close}
        >
          ✕
        </button>
        <ul>
          <li><Link href="/catalog" onClick={close}>Каталог</Link></li>
          <li><Link href="/catalog?new=1" onClick={close}>Новинки</Link></li>
          <li><Link href="/catalog?sale=1" onClick={close}>Акции</Link></li>
          <li><Link href="/#about" onClick={close}>О компании</Link></li>
          <li><Link href="/#footer" onClick={close}>Контакты</Link></li>
          <li><Link href="/account" onClick={close}>Личный кабинет</Link></li>
          <li><Link href="/favorites" onClick={close}>Избранное</Link></li>
          <li><Link href="/compare" onClick={close}>Сравнение</Link></li>
        </ul>
      </nav>
    </>
  );
}