import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import slugify from 'slugify';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateSlug = (text) => slugify(text, { lower: true, strict: true, locale: 'ru' });

const IMG = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const categories = [
  { name: 'Спальня', image: IMG(100, 800, 800) },
  { name: 'Гостиная', image: IMG(101, 800, 800) },
  { name: 'Столовая', image: IMG(102, 800, 800) },
  { name: 'Кухня', image: IMG(104, 800, 800) },
  { name: 'Прихожая', image: IMG(105, 800, 800) },
  { name: 'Кабинет', image: IMG(103, 800, 800) },
  { name: 'Детская', image: IMG(106, 800, 800) },
  { name: 'Мягкая мебель', image: IMG(107, 800, 800) },
  { name: 'Посуда', image: IMG(108, 800, 800) },
  { name: 'Ароматы', image: IMG(109, 800, 800) },
  { name: 'Текстиль', image: IMG(110, 800, 800) },
];

const brands = [
  { name: 'Poliform', country: 'Италия' },
  { name: 'Minotti', country: 'Италия' },
  { name: 'B&B Italia', country: 'Италия' },
  { name: 'Natuzzi', country: 'Италия' },
  { name: 'Roche Bobois', country: 'Италия' },
  { name: 'Flexform', country: 'Италия' },
  { name: 'Molteni&C', country: 'Италия' },
  { name: 'Cassina', country: 'Италия' },
  { name: 'Villeroy & Boch', country: 'Германия' },
  { name: 'Rosenthal', country: 'Германия' },
  { name: 'Diptyque', country: 'Франция' },
  { name: 'Jo Malone', country: 'Великобритания' },
];

const products = [
  {
    title: 'Кровать Imperial Velvet',
    description: 'Роскошная кровать с мягким изголовьем и благородной обивкой. Итальянское мастерство и безупречная эстетика для спальни премиум-класса.',
    price: 289000,
    sku: 'HD-BED-001',
    sizes: '200×220 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 3,
    country: 'Италия',
    material: 'Ткань, массив дуба',
    color: 'Бежевый',
    popular: true,
    isNew: true,
    isSale: false,
    categoryName: 'Спальня',
    brandName: 'Poliform',
    images: [IMG(1, 1200, 800), IMG(10, 1200, 800), IMG(11, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Кровать' },
      { name: 'Стиль', value: 'Современный' },
    ],
  },
  {
    title: 'Диван Milano Lounge',
    description: 'Элегантный модульный диван с глубокими сиденьями. Идеален для просторной гостиной в современном стиле.',
    price: 456000,
    sku: 'HD-SOF-002',
    sizes: '280×95×72 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 2,
    country: 'Италия',
    material: 'Кожа, металл',
    color: 'Серый',
    popular: true,
    isNew: false,
    isSale: true,
    categoryName: 'Гостиная',
    brandName: 'Minotti',
    images: [IMG(2, 1200, 800), IMG(12, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Диван' },
      { name: 'Механизм', value: 'Статичный' },
    ],
  },
  {
    title: 'Обеденный стол Grand Oak',
    description: 'Массивный обеденный стол из натурального дуба. Вместимость до 10 персон.',
    price: 198000,
    sku: 'HD-TBL-003',
    sizes: '240×100×76 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 5,
    country: 'Турция',
    material: 'Массив дуба',
    color: 'Тёмный дуб',
    popular: true,
    isNew: false,
    isSale: false,
    categoryName: 'Столовая',
    brandName: 'Natuzzi',
    images: [IMG(3, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Стол' },
      { name: 'Форма', value: 'Прямоугольный' },
    ],
  },
  {
    title: 'Шкаф-купе Elegance',
    description: 'Вместительный шкаф-купе с зеркальными фасадами и системой хранения премиум-класса.',
    price: 345000,
    sku: 'HD-WRD-004',
    sizes: '300×60×240 см',
    stockStatus: 'ON_ORDER',
    stockQuantity: null,
    country: 'Италия',
    material: 'ЛДСП, зеркало',
    color: 'Белый',
    popular: false,
    isNew: true,
    isSale: false,
    categoryName: 'Спальня',
    brandName: 'Poliform',
    images: [IMG(4, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Шкаф-купе' },
    ],
  },
  {
    title: 'Кресло Executive',
    description: 'Кожаное кресло руководителя с эргономичной спинкой и хромированным основанием.',
    price: 125000,
    sku: 'HD-CHR-005',
    sizes: '70×75×120 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 8,
    country: 'Италия',
    material: 'Натуральная кожа',
    color: 'Чёрный',
    popular: true,
    isNew: false,
    isSale: false,
    categoryName: 'Кабинет',
    brandName: 'Flexform',
    images: [IMG(5, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Кресло' },
    ],
  },
  {
    title: 'Комод Riviera',
    description: 'Элегантный комод с мраморной столешницей и латунной фурнитурой.',
    price: 89000,
    sku: 'HD-CMD-006',
    sizes: '140×45×85 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 4,
    country: 'Италия',
    material: 'Массив, мрамор',
    color: 'Белый',
    popular: false,
    isNew: true,
    isSale: true,
    categoryName: 'Спальня',
    brandName: 'Molteni&C',
    images: [IMG(6, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Комод' },
    ],
  },
  {
    title: 'Ваза керамическая Aurora',
    description: 'Авторская керамическая ваза ручной работы для интерьера в скандинавском стиле.',
    price: 18500,
    sku: 'HD-VAS-007',
    sizes: '35×35×50 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 12,
    country: 'Италия',
    material: 'Керамика',
    color: 'Белый',
    popular: false,
    isNew: true,
    isSale: false,
    categoryName: 'Посуда',
    brandName: 'Villeroy & Boch',
    images: [IMG(7, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Ваза' },
    ],
  },
  {
    title: 'Диффузор ароматический Baies',
    description: 'Премиальный ароматический диффузор с нотами чёрной смородины и розы.',
    price: 8900,
    sku: 'HD-ARO-008',
    sizes: '350 мл',
    stockStatus: 'IN_STOCK',
    stockQuantity: 20,
    country: 'Франция',
    material: 'Стекло',
    color: 'Прозрачный',
    popular: true,
    isNew: false,
    isSale: false,
    categoryName: 'Ароматы',
    brandName: 'Diptyque',
    images: [IMG(8, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Диффузор' },
    ],
  },
  {
    title: 'Покрывало Cashmere Dream',
    description: 'Роскошное покрывало из кашемира с нежной текстурой.',
    price: 45000,
    sku: 'HD-TXT-009',
    sizes: '240×260 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 6,
    country: 'Италия',
    material: 'Кашемир',
    color: 'Серый',
    popular: false,
    isNew: true,
    isSale: false,
    categoryName: 'Текстиль',
    brandName: 'Roche Bobois',
    images: [IMG(9, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Покрывало' },
    ],
  },
  {
    title: 'Детская кровать Cloud',
    description: 'Безопасная и стильная детская кровать с мягкими бортиками.',
    price: 78000,
    sku: 'HD-KID-010',
    sizes: '90×200 см',
    stockStatus: 'IN_STOCK',
    stockQuantity: 3,
    country: 'Турция',
    material: 'МДФ, текстиль',
    color: 'Белый',
    popular: false,
    isNew: true,
    isSale: false,
    categoryName: 'Детская',
    brandName: 'Natuzzi',
    images: [IMG(13, 1200, 800)],
    characteristics: [
      { name: 'Тип', value: 'Кровать' },
    ],
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productCharacteristic.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  const categoryMap = {};
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: generateSlug(cat.name),
        image: cat.image,
      },
    });
    categoryMap[cat.name] = created.id;
  }

  const brandMap = {};
  for (const brand of brands) {
    const created = await prisma.brand.create({
      data: {
        name: brand.name,
        slug: generateSlug(brand.name),
        country: brand.country,
      },
    });
    brandMap[brand.name] = created.id;
  }

  for (const product of products) {
    await prisma.product.create({
      data: {
        title: product.title,
        slug: generateSlug(product.title),
        description: product.description,
        price: product.price,
        sku: product.sku,
        sizes: product.sizes,
        stockStatus: product.stockStatus,
        stockQuantity: product.stockQuantity,
        country: product.country,
        material: product.material,
        color: product.color,
        popular: product.popular,
        isNew: product.isNew,
        isSale: product.isSale,
        categoryId: categoryMap[product.categoryName],
        brandId: brandMap[product.brandName],
        images: {
          create: product.images.map((url, index) => ({
            url,
            isMain: index === 0,
          })),
        },
        characteristics: {
          create: product.characteristics,
        },
      },
    });
  }

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.create({
    data: {
      email: 'admin@hermitage-decor.ru',
      password: adminPassword,
      firstName: 'Админ',
      lastName: 'HERMITAGE',
      phone: '+7 (900) 123-45-67',
      role: 'ADMIN',
    },
  });

  const managerPassword = await bcrypt.hash('Manager123!', 12);
  await prisma.user.create({
    data: {
      email: 'manager@hermitage-decor.ru',
      password: managerPassword,
      firstName: 'Менеджер',
      lastName: 'HERMITAGE',
      phone: '+7 (900) 123-45-68',
      role: 'MANAGER',
    },
  });

  console.log('Seed completed successfully');
  console.log('Admin: admin@hermitage-decor.ru / Admin123!');
  console.log('Manager: manager@hermitage-decor.ru / Manager123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
