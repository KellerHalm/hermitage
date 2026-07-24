'use client';

import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { useStoreData } from '@/lib/use-store-data';
import { buildAssetUrl } from '@/lib/api';
import { getCategoryUrl, getCountryCatalogUrl } from '@/lib/urls';

export default function Home() {
  const { data: HERMITAGE, loaded } = useStoreData();

  if (!loaded) return null;

  const popular = HERMITAGE.products.filter((p: any) => p.popular);
  const newest = HERMITAGE.products.filter((p: any) => p.isNew).slice(0, 4);
  const brandNames = HERMITAGE.brands.map((b: any) => typeof b === 'string' ? b : b.name).filter(Boolean);
  const brands = [...brandNames, ...brandNames];

  return (
    <>
      <Header variant="hero" />

      <section className="hero">
        <div className="hero__bg">
          <img src={buildAssetUrl('/uploads/images/hero.jpg')} alt="Премиальный интерьер" />
        </div>
        <div className="hero__overlay"></div>
        <div className="hero__content">
          <h1 className="hero__title">HERMITAGE</h1>
          <p className="hero__tagline">Мебель и предметы интерьера премиального качества</p>
          <div className="btn-group" style={{ justifyContent: "center" }}>
            <Link href="/catalog" className="btn btn--primary">Смотреть каталог</Link>
            <Link href="/catalog?new=1" className="btn btn--ghost">Новые коллекции</Link>
          </div>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="container">
          <p className="section__subtitle">Коллекции</p>
          <h2 className="section__title">Категории</h2>
          <div className="categories-grid">
            {HERMITAGE.categories.map((c: any) => (
              <Link key={c.id} href={getCategoryUrl(c)} className="category-card">
                <img src={c.image} alt={c.name} loading="lazy" />
                <span className="category-card__label">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <p className="section__subtitle">Производство</p>
          <h2 className="section__title">Мировые фабрики</h2>
          <div className="countries-grid">
            {HERMITAGE.countries.map((c: any) => (
              <Link key={c.id} href={getCountryCatalogUrl(c.name)} className="country-card">
                <img src={c.image} alt={c.name} loading="lazy" />
                <span className="country-card__label">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="slider" data-slider>
            <div className="slider__header">
              <div>
                <p className="section__subtitle">Выбор клиентов</p>
                <h2 className="section__title">Популярные товары</h2>
              </div>
              <div className="slider__nav">
                <button className="slider__btn" aria-label="Назад" onClick={() => { const track = document.getElementById("popular-slider"); if (track) track.scrollBy({ left: -300, behavior: "smooth" }); }}>←</button>
                <button className="slider__btn" aria-label="Вперёд" onClick={() => { const track = document.getElementById("popular-slider"); if (track) track.scrollBy({ left: 300, behavior: "smooth" }); }}>→</button>
              </div>
            </div>
            <div className="slider__track" id="popular-slider">
              {popular.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <p className="section__subtitle">Коллекция 2026</p>
          <h2 className="section__title">Новинки</h2>
          <div className="products-grid">
            {newest.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
          <p className="mt-2" style={{ textAlign: "center" }}>
            <Link href="/catalog?new=1" className="btn btn--outline">Все новинки</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Link href="/catalog?sale=1" className="promo-banner">
            <div className="promo-banner__bg">
              <img src="/images/placeholder.svg" alt="Спальня" />
            </div>
            <div className="promo-banner__overlay"></div>
            <div>
              <h3>Скидки до 30% на мебель для спальни</h3>
              <span className="btn btn--ghost">Смотреть акции</span>
            </div>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section__subtitle">Партнёры</p>
          <h2 className="section__title">Бренды</h2>
          <div className="brands-wrap">
            <div className="brands-track">
              {brands.map((b: any, i: number) => <span key={i} className="brand-item">{b}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container about-block">
          <div className="about-block__image">
            <img src="/images/placeholder.svg" alt="Салон HERMITAGE DECOR" />
          </div>
          <div className="about-block__text">
            <p className="section__subtitle">О нас</p>
            <h2 className="section__title">HERMITAGE</h2>
            <p>Мы — интерьерный бутик премиального сегмента. Представляем коллекции ведущих европейских и мировых фабрик, помогаем создавать пространства с характером и безупречным вкусом.</p>
            <p>Каждый предмет в нашем каталоге отобран вручную: от итальянских диванов до эксклюзивной мебели из Турции и Китая.</p>
            <div className="advantages">
              <div className="advantage-item"><h4>Премиальные фабрики</h4><p>Прямые поставки от производителей</p></div>
              <div className="advantage-item"><h4>Оригинальная продукция</h4><p>Сертификаты и гарантия подлинности</p></div>
              <div className="advantage-item"><h4>Гарантия качества</h4><p>Официальная гарантия на всю мебель</p></div>
              <div className="advantage-item"><h4>Доставка по России</h4><p>Бережная доставка и сборка</p></div>
            </div>
          </div>
        </div>
      </section>

      <Footer full />
    </>
  );
}