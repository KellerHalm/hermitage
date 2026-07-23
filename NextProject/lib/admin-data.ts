export interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    brand: string;
    country: string;
    image: string;
    inStock: boolean;
    popular: boolean;
    isNew: boolean;
    description: string;
  }
  
  export interface Order {
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    products: { productId: number; name: string; quantity: number; price: number }[];
    total: number;
    status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    date: string;
    address: string;
  }
  
  export interface Category {
    id: number;
    name: string;
    image: string;
  }
  
  export interface Brand {
    id: number;
    name: string;
    country: string;
  }
  
  export const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Кровать Imperial Velvet',
      price: 289000,
      category: 'Спальня',
      brand: 'Poliform',
      country: 'Италия',
      image: '/images/p1.jpg',
      inStock: true,
      popular: true,
      isNew: true,
      description: 'Роскошная кровать с бархатной обивкой',
    },
    {
      id: 2,
      name: 'Диван Milano Lounge',
      price: 456000,
      category: 'Гостиная',
      brand: 'Minotti',
      country: 'Италия',
      image: '/images/p1.jpg',
      inStock: true,
      popular: true,
      isNew: false,
      description: 'Просторный диван для гостиной',
    },
    {
      id: 3,
      name: 'Стол Dining Classic',
      price: 178000,
      category: 'Столовая',
      brand: 'Baxter',
      country: 'Италия',
      image: '/images/p1.jpg',
      inStock: true,
      popular: false,
      isNew: true,
      description: 'Обеденный стол из натурального дуба',
    },
  ];
  
  export const mockOrders: Order[] = [
    {
      id: 1,
      customerName: 'Иван Петров',
      customerPhone: '+7 (999) 123-45-67',
      customerEmail: 'ivan@example.com',
      products: [{ productId: 1, name: 'Кровать Imperial Velvet', quantity: 1, price: 289000 }],
      total: 289000,
      status: 'new',
      date: '2026-06-19',
      address: 'Москва, ул. Тверская, 10',
    },
    {
      id: 2,
      customerName: 'Мария Сидорова',
      customerPhone: '+7 (999) 987-65-43',
      customerEmail: 'maria@example.com',
      products: [{ productId: 2, name: 'Диван Milano Lounge', quantity: 1, price: 456000 }],
      total: 456000,
      status: 'processing',
      date: '2026-06-18',
      address: 'Санкт-Петербург, Невский проспект, 25',
    },
  ];
  
  export const mockCategories: Category[] = [
    { id: 1, name: 'Спальня', image: '/images/p1.jpg' },
    { id: 2, name: 'Гостиная', image: '/images/p1.jpg' },
    { id: 3, name: 'Столовая', image: '/images/p1.jpg' },
    { id: 4, name: 'Кабинет', image: '/images/p1.jpg' },
    { id: 5, name: 'Кухня', image: '/images/p1.jpg' },
    { id: 6, name: 'Прихожая', image: '/images/p1.jpg' },
    { id: 7, name: 'Детская', image: '/images/p1.jpg' },
    { id: 8, name: 'Мягкая мебель', image: '/images/p1.jpg' },
    { id: 9, name: 'Посуда', image: '/images/p1.jpg' },
    { id: 10, name: 'Ароматы', image: '/images/p1.jpg' },
    { id: 11, name: 'Текстиль', image: '/images/p1.jpg' },
  ];
  
  export const mockBrands: Brand[] = [
    { id: 1, name: 'Poliform', country: 'Италия' },
    { id: 2, name: 'Minotti', country: 'Италия' },
    { id: 3, name: 'Baxter', country: 'Италия' },
    { id: 4, name: 'B&B Italia', country: 'Италия' },
    { id: 5, name: 'Flexform', country: 'Италия' },
    { id: 6, name: 'Porada', country: 'Италия' },
    { id: 7, name: 'Cassina', country: 'Италия' },
    { id: 8, name: 'Kartell', country: 'Италия' },
    { id: 9, name: 'Foscarini', country: 'Италия' },
    { id: 10, name: 'Lema', country: 'Италия' },
  ];