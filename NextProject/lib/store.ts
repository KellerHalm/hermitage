import { api, buildAssetUrl } from './api';

const APP_VERSION = '4.0.0';
const USER_KEY = 'hd_user';
const PRODUCTS_KEY = 'hd_products';
const CATEGORIES_KEY = 'categories';
const BRANDS_KEY = 'brands';
const COUNTRIES_KEY = 'countries';
const FAVORITES_KEY = 'hd_favorites';
const CART_KEY = 'hd_cart';
const COMPARE_KEY = 'hd_compare';
const USER_ORDERS_KEY = 'hd_orders';
const ADMIN_ORDERS_KEY = 'hd_admin_orders';
const VERSION_KEY = 'hd_app_version';

const Storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

type CartItem = {
  id: string;
  qty: number;
};

type User = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
};

type FavoriteProduct = {
  productId?: string;
};

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type OrderItem = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  images?: string[];
  sku?: string;
  qty: number;
  price?: number;
  oldPrice?: number;
  description?: string;
  category?: string;
  brand?: string;
  country?: string;
  material?: string;
  color?: string;
  sizes?: string;
  inStock?: boolean | string;
  stockQuantity?: number | null;
  characteristics?: { name: string; value: string }[];
};

type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  deliveryType?: 'pickup' | 'delivery';
  paymentMethod?: string;
  address?: string;
  comment?: string;
  items: OrderItem[];
  total?: number;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStockValue = (value: string) => {
  if (value === 'ON_ORDER') return 'preorder';
  if (value === 'OUT_OF_STOCK') return false;
  return true;
};

const normalizeProduct = (product: any) => {
  const rawImages: Array<{ id: string; url: string }> = Array.isArray(product?.images)
    ? product.images.map((image: any) => ({ id: String(image?.id || ''), url: buildAssetUrl(image?.url) })).filter((img: any) => img.url)
    : [];
  const images = rawImages.map((img) => img.url);
  const categoryId = product?.category?.id || product?.categoryId || product?.category || '';
  const brandName = product?.brand?.name || product?.factory || product?.brandName || product?.brand || '';
  const country = product?.country || product?.brand?.country || '';
  const characteristics = Array.isArray(product?.characteristics)
    ? product.characteristics.map((item: any) => ({ name: item.name || '', value: item.value || '' }))
    : [];

  return {
    id: String(product?.id || ''),
    slug: product?.slug || '',
    name: product?.title || product?.name || '',
    price: toNumber(product?.price),
    country,
    factory: brandName,
    brand: brandName,
    brandId: product?.brand?.id || product?.brandId || null,
    category: String(categoryId),
    categoryId: String(categoryId),
    categoryName: product?.category?.name || '',
    categorySlug: product?.category?.slug || product?.categorySlug || '',
    color: product?.color || '',
    material: product?.material || '',
    sizes: product?.sizes || '',
    sku: product?.sku || '',
    inStock: toStockValue(product?.stockStatus || 'IN_STOCK'),
    stockQuantity: product?.stockQuantity ?? null,
    isNew: Boolean(product?.isNew),
    isSale: Boolean(product?.isSale) || (product?.oldPrice ? toNumber(product?.oldPrice) > toNumber(product?.price) : false),
    popular: Boolean(product?.popular),
    oldPrice: product?.oldPrice ? toNumber(product?.oldPrice) : null,
    image: images[0] || buildAssetUrl(product?.image),
    images: images.length > 0 ? images : [buildAssetUrl(product?.image)],
    rawImages,
    description: product?.description || '',
    characteristics,
  };
};

const normalizeCategory = (category: any) => ({
  id: String(category?.id || ''),
  name: category?.name || '',
  image: buildAssetUrl(category?.image),
  slug: category?.slug || '',
  parentId: category?.parentId || null,
  subcategories: Array.isArray(category?.subcategories) ? category.subcategories.map(normalizeCategory) : [],
});

const normalizeBrand = (brand: any) => ({
  id: String(brand?.id || ''),
  name: brand?.name || '',
  country: brand?.country || '',
  slug: brand?.slug || '',
});

const normalizeCountry = (country: any) => ({
  id: String(country?.id || ''),
  name: country?.name || '',
  slug: country?.slug || '',
  image: buildAssetUrl(country?.image),
});

const normalizeOrder = (order: any): Order => ({
  id: String(order?.id || ''),
  date: order?.createdAt || order?.date || new Date().toISOString(),
  status: (order?.status || 'PENDING') as OrderStatus,
  firstName: order?.customerFirstName || order?.user?.firstName || '',
  lastName: order?.customerLastName || order?.user?.lastName || '',
  phone: order?.customerPhone || order?.user?.phone || '',
  email: order?.customerEmail || order?.user?.email || '',
  deliveryType: order?.deliveryType === 'delivery' ? 'delivery' : 'pickup',
  paymentMethod: order?.paymentMethod || '',
  address: order?.shippingAddress || '',
  comment: order?.comment || '',
  items: Array.isArray(order?.items)
    ? order.items.map((item: any) => {
        const p = item?.product || {};
        return {
          id: String(item?.productId || p?.id || item?.id || ''),
          slug: p?.slug || '',
          name: p?.title || item?.name || '',
          image: buildAssetUrl(p?.images?.[0]?.url) || buildAssetUrl(item?.image),
          images: Array.isArray(p?.images) ? p.images.map((img: any) => buildAssetUrl(img?.url)).filter(Boolean) : [],
          sku: p?.sku || '',
          qty: item?.quantity || item?.qty || 1,
          price: toNumber(item?.price),
          oldPrice: p?.oldPrice ? toNumber(p?.oldPrice) : null,
          description: p?.description || '',
          category: p?.category?.name || '',
          brand: p?.brand?.name || '',
          country: p?.country || '',
          material: p?.material || '',
          color: p?.color || '',
          sizes: p?.sizes || '',
          inStock: toStockValue(p?.stockStatus || 'IN_STOCK'),
          stockQuantity: p?.stockQuantity ?? null,
          characteristics: Array.isArray(p?.characteristics)
            ? p.characteristics.map((ch: any) => ({ name: ch.name || '', value: ch.value || '' }))
            : [],
        };
      })
    : [],
  total: toNumber(order?.totalAmount),
});

const normalizeUser = (user: any): User => ({
  id: user?.id,
  email: user?.email || '',
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  phone: user?.phone || '',
  role: user?.role,
});

const normalizeCartItems = (cart: any): CartItem[] => {
  if (!Array.isArray(cart?.items)) return [];
  return cart.items.map((item: any) => ({
    id: String(item.productId || item.product?.id || ''),
    qty: item.quantity || 1,
  })).filter((item: CartItem) => item.id);
};

const setMirrorValue = (key: string, value: unknown) => {
  Storage.set(key, value);
};

const notify = (eventName?: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('storage'));
  if (eventName) window.dispatchEvent(new Event(eventName));
  const update = (window as any).__storeUpdate;
  if (typeof update === 'function') update();
};

const cartAuth = () => ({
  token: null as string | null,
});

const setCurrentUser = (user: User | null) => {
  if (user) {
    const safeUser = { ...user, role: undefined };
    Storage.set(USER_KEY, safeUser);
  } else {
    Storage.remove(USER_KEY);
  }
};

const clearUserData = () => {
  setCurrentUser(null);
  Storage.set(FAVORITES_KEY, []);
  Storage.set(USER_ORDERS_KEY, []);
};

const applyCart = (cart: any) => {
  const items = normalizeCartItems(cart);
  Storage.set(CART_KEY, items);
  notify();
  return items;
};

const buildProductFormData = (product: Record<string, any>) => {
  const formData = new FormData();
  formData.append('title', String(product.name || ''));
  formData.append('description', String(product.description || ''));
  formData.append('price', String(product.price || 0));
  if (product.oldPrice !== undefined && product.oldPrice !== null && product.oldPrice !== '') {
    formData.append('oldPrice', String(product.oldPrice));
  }
  formData.append('categoryId', String(product.category || product.categoryId || ''));
  if (product.brandId) formData.append('brandId', String(product.brandId));
  if (product.country) formData.append('country', String(product.country));
  if (product.sku) formData.append('sku', String(product.sku));
  if (product.sizes) formData.append('sizes', String(product.sizes));
  if (product.material) formData.append('material', String(product.material));
  if (product.color) formData.append('color', String(product.color));
  formData.append('stockStatus', String(product.stockStatus || 'IN_STOCK'));
  if (product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity !== '') {
    formData.append('stockQuantity', String(product.stockQuantity));
  }
  formData.append('popular', String(Boolean(product.popular)));
  formData.append('isNew', String(Boolean(product.isNew)));
  formData.append('isSale', String(Boolean(product.isSale)));
  formData.append('characteristics', JSON.stringify(Array.isArray(product.characteristics) ? product.characteristics : []));
  if (Array.isArray(product.files)) {
    product.files.forEach((file: File) => formData.append('images', file));
  }
  if (Array.isArray(product.deleteImageIds) && product.deleteImageIds.length > 0) {
    formData.append('deleteImageIds', JSON.stringify(product.deleteImageIds));
  }
  return formData;
};

const syncPublicData = async () => {
  const [productsResponse, categoriesResponse, brandsResponse, countriesResponse] = await Promise.all([
    api.listProducts({ limit: 200 }),
    api.listCategories(),
    api.listBrands(),
    api.listCountries(),
  ]);

  const products = Array.isArray(productsResponse?.data?.products)
    ? productsResponse.data.products.map(normalizeProduct)
    : [];
  const categories = Array.isArray(categoriesResponse?.data?.categories)
    ? categoriesResponse.data.categories.map(normalizeCategory)
    : [];
  const brands = Array.isArray(brandsResponse?.data?.brands)
    ? brandsResponse.data.brands.map(normalizeBrand)
    : [];
  const countries = Array.isArray(countriesResponse?.data?.countries)
    ? countriesResponse.data.countries.map(normalizeCountry)
    : [];

  setMirrorValue(PRODUCTS_KEY, products);
  setMirrorValue('products', products);
  setMirrorValue(CATEGORIES_KEY, categories);
  setMirrorValue(BRANDS_KEY, brands);
  setMirrorValue(COUNTRIES_KEY, countries);
  notify('products:update');

  return { products, categories, brands, countries };
};

const syncCart = async () => {
  const response = await api.getCart(cartAuth());
  return applyCart(response?.data?.cart);
};

const syncFavorites = async () => {
  const favoritesResponse = await api.getFavorites();
  const ids = Array.isArray(favoritesResponse?.data?.favorites)
    ? favoritesResponse.data.favorites.map((entry: FavoriteProduct & { product?: any }) => String(entry.productId || entry.product?.id || '')).filter(Boolean)
    : [];
  Storage.set(FAVORITES_KEY, ids);
};

const syncCompare = async () => {
  const response = await api.getCompare();
  const ids = Array.isArray(response?.data?.compares)
    ? response.data.compares.map((entry: any) => String(entry.productId || entry.product?.id || '')).filter(Boolean)
    : Array.isArray(response?.data?.items)
      ? response.data.items.map((entry: any) => String(entry.productId || entry.product?.id || '')).filter(Boolean)
      : [];
  Storage.set(COMPARE_KEY, ids.slice(0, 4));
};

const syncOrders = async () => {
  const ordersResponse = await api.getMyOrders();
  const orders = Array.isArray(ordersResponse?.data?.orders)
    ? ordersResponse.data.orders.map(normalizeOrder)
    : [];
  Storage.set(USER_ORDERS_KEY, orders);
  return orders;
};

const syncUserData = async () => {
  try {
    const meResponse = await api.getMe();
    const user = normalizeUser(meResponse?.data?.user);
    setCurrentUser(user);
    await Promise.all([syncFavorites(), syncOrders(), syncCompare()]);
    notify();
    return user;
  } catch {
    clearUserData();
    notify();
    return null;
  }
};

const mergeAndSyncCart = async () => {
  try {
    const response = await api.mergeGuestCart('');
    if (response?.data?.cart) {
      applyCart(response.data.cart);
      return;
    }
  } catch {
  }
  await syncCart();
};

export const Store = {
  init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('auth:logout', () => {
      clearUserData();
      notify();
    });

    const version = localStorage.getItem(VERSION_KEY);

    if (version !== APP_VERSION) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('hd_') || key === 'products' || key === 'categories' || key === 'brands' || key === 'countries') {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem(VERSION_KEY, APP_VERSION);
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const res = await api.getMe();
      return Boolean(res?.data?.user);
    } catch {
      return false;
    }
  },
  user: (): User | null => Storage.get<User | null>(USER_KEY, null),
  setUser: setCurrentUser,
  cart: (): CartItem[] => Storage.get<CartItem[]>(CART_KEY, []),
  setCart: (items: CartItem[]) => {
    Storage.set(CART_KEY, items);
    notify();
  },
  favorites: (): string[] => Storage.get<string[]>(FAVORITES_KEY, []),
  setFavorites: (ids: string[]) => {
    Storage.set(FAVORITES_KEY, ids);
    notify();
  },
  orders: (): Order[] => Storage.get<Order[]>(USER_ORDERS_KEY, []),
  setOrders: (orders: Order[]) => {
    Storage.set(USER_ORDERS_KEY, orders);
    notify();
  },
  adminOrders: (): Order[] => Storage.get<Order[]>(ADMIN_ORDERS_KEY, []),
  setAdminOrders: (orders: Order[]) => {
    Storage.set(ADMIN_ORDERS_KEY, orders);
    notify();
  },
  compare: (): string[] => Storage.get<string[]>(COMPARE_KEY, []),
  setCompare: (ids: string[]) => {
    Storage.set(COMPARE_KEY, ids.slice(0, 4));
    notify();
  },
  getProducts() {
    return Storage.get<any[]>(PRODUCTS_KEY, []);
  },
  setProducts(products: any[]) {
    setMirrorValue(PRODUCTS_KEY, products);
    setMirrorValue('products', products);
    notify('products:update');
  },
  getCategories() {
    return Storage.get<any[]>(CATEGORIES_KEY, []);
  },
  setCategories(categories: any[]) {
    setMirrorValue(CATEGORIES_KEY, categories);
    notify();
  },
  getBrands() {
    return Storage.get<any[]>(BRANDS_KEY, []);
  },
  setBrands(brands: any[]) {
    setMirrorValue(BRANDS_KEY, brands);
    notify();
  },
  getCountries() {
    return Storage.get<any[]>(COUNTRIES_KEY, []);
  },
  setCountries(countries: any[]) {
    setMirrorValue(COUNTRIES_KEY, countries);
    notify();
  },
  getOrders() {
    return Storage.get<Order[]>(USER_ORDERS_KEY, []);
  },
  getAdminOrders() {
    return Storage.get<Order[]>(ADMIN_ORDERS_KEY, []);
  },
  async isAdmin() {
    try {
      const res = await api.verifyAdmin();
      const role = res?.data?.user?.role;
      return role === 'ADMIN' || role === 'MANAGER';
    } catch {
      return false;
    }
  },
  async syncPublicData() {
    return syncPublicData();
  },
  async syncCart() {
    return syncCart();
  },
  async fetchProducts(params?: Record<string, unknown>) {
    const response = await api.listProducts({ limit: 200, ...params } as any);
    const products = Array.isArray(response?.data?.products)
      ? response.data.products.map(normalizeProduct)
      : [];
    setMirrorValue(PRODUCTS_KEY, products);
    setMirrorValue('products', products);
    notify('products:update');
    return products;
  },
  async fetchProductById(id: string) {
    const response = await api.getProductById(id);
    if (response?.data?.product) {
      return normalizeProduct(response.data.product);
    }
    return null;
  },
  async fetchProductBySlug(slug: string) {
    const response = await api.getProduct(slug);
    if (response?.data?.product) {
      return normalizeProduct(response.data.product);
    }
    return null;
  },
  async fetchSimilarProducts(slug: string) {
    const response = await api.getSimilarProducts(slug);
    if (Array.isArray(response?.data?.products)) {
      return response.data.products.map(normalizeProduct);
    }
    return [];
  },
  async fetchBoughtTogetherProducts(slug: string) {
    const response = await api.getBoughtTogetherProducts(slug);
    if (Array.isArray(response?.data?.products)) {
      return response.data.products.map(normalizeProduct);
    }
    return [];
  },
  async search(query: string) {
    const response = await api.search(query);
    return {
      products: Array.isArray(response?.data?.products)
        ? response.data.products.map(normalizeProduct)
        : [],
      categories: Array.isArray(response?.data?.categories) ? response.data.categories : [],
      brands: Array.isArray(response?.data?.brands) ? response.data.brands : [],
    };
  },
  async syncUserData() {
    return syncUserData();
  },
  async bootstrap() {
    await syncPublicData();
    await syncCart().catch(() => undefined);
    await syncUserData();
  },
  async login(email: string, password: string) {
    const response = await api.login({ email, password });
    const user = normalizeUser(response?.data?.user);
    setCurrentUser(user);
    await mergeAndSyncCart();
    const localCompare = Storage.get<string[]>(COMPARE_KEY, []);
    if (localCompare.length > 0) {
      await api.syncCompare('', localCompare).catch(() => undefined);
    }
    await syncUserData();
    return user;
  },
  async register(payload: { email: string; password: string; firstName: string; lastName: string; phone: string }) {
    const response = await api.register(payload);
    const user = normalizeUser(response?.data?.user);
    setCurrentUser(user);
    await mergeAndSyncCart();
    const localCompare = Storage.get<string[]>(COMPARE_KEY, []);
    if (localCompare.length > 0) {
      await api.syncCompare('', localCompare).catch(() => undefined);
    }
    await syncUserData();
    return user;
  },
  async updateProfile(payload: { firstName: string; lastName: string; phone: string; email?: string; password?: string; currentPassword?: string }) {
    const response = await api.updateMe('', payload);
    const user = normalizeUser(response?.data?.user);
    setCurrentUser(user);
    notify();
    return user;
  },
  logout() {
    void api.logout().catch(() => undefined);
    clearUserData();
    void syncCart().catch(() => undefined);
    notify();
  },
  async deleteAccount() {
    await api.deleteMe();
    clearUserData();
    void syncCart().catch(() => undefined);
    notify();
  },
  toggleFavorite(id: string): boolean {
    const favorites = Store.favorites();
    const index = favorites.indexOf(id);
    let isAdded = false;

    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(id);
      isAdded = true;
    }

    Store.setFavorites(favorites);

    const action = isAdded ? api.addFavorite(id) : api.removeFavorite(id);
    void action.catch(async () => {
      await syncUserData().catch(() => undefined);
    });

    return isAdded;
  },
  isFavorite(id: string): boolean {
    return Store.favorites().includes(id);
  },
  addToCart(id: string, qty = 1) {
    const cart = Store.cart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, qty });
    Store.setCart(cart);

    void api.addCartItem(cartAuth(), id, qty).then((response) => {
      applyCart(response?.data?.cart);
    }).catch(async () => {
      await syncCart().catch(() => undefined);
    });
  },
  removeFromCart(id: string) {
    Store.setCart(Store.cart().filter((item) => item.id !== id));
    void api.removeCartItem(cartAuth(), id).then((response) => {
      applyCart(response?.data?.cart);
    }).catch(async () => {
      await syncCart().catch(() => undefined);
    });
  },
  updateCartQty(id: string, qty: number) {
    const nextQty = Math.max(1, qty);
    const cart = Store.cart();
    const item = cart.find((entry) => entry.id === id);
    if (item) {
      item.qty = nextQty;
      Store.setCart(cart);
    }

    void api.updateCartItem(cartAuth(), id, nextQty).then((response) => {
      applyCart(response?.data?.cart);
    }).catch(async () => {
      await syncCart().catch(() => undefined);
    });
  },
  async clearCart() {
    Store.setCart([]);
    try {
      const response = await api.clearCart(cartAuth());
      applyCart(response?.data?.cart);
    } catch {
      Store.setCart([]);
    }
  },
  toggleCompare(id: string): boolean {
    const list = Store.compare();
    const index = list.indexOf(id);
    let isAdded = false;

    if (index >= 0) {
      list.splice(index, 1);
    } else {
      if (list.length >= 4) return false;
      list.push(id);
      isAdded = true;
    }

    Store.setCompare(list);

    const action = isAdded ? api.addCompare(id) : api.removeCompare(id);
    void action.catch(async () => {
      await syncCompare().catch(() => undefined);
      notify();
    });

    return isAdded;
  },
  isInCompare(id: string): boolean {
    return Store.compare().includes(id);
  },
  async createOrder(payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    deliveryType?: 'pickup' | 'delivery';
    paymentMethod?: string;
    address?: string;
    comment?: string;
    items: Array<{ id: string; qty: number }>;
  }) {
    const response = await api.createOrder('', {
      customerFirstName: payload.firstName,
      customerLastName: payload.lastName,
      customerPhone: payload.phone,
      customerEmail: payload.email,
      shippingAddress: payload.address || '',
      paymentMethod: payload.paymentMethod || 'card_online',
      deliveryType: payload.deliveryType || 'pickup',
      comment: payload.comment || '',
      items: payload.items.map((item) => ({ productId: item.id, quantity: item.qty })),
    });
    await api.clearCart(cartAuth()).catch(() => undefined);
    Store.setCart([]);
    await syncUserData();
    return normalizeOrder(response?.data?.order);
  },
  async loadAdminOrders() {
    const response = await api.getAdminOrders();
    const orders = Array.isArray(response?.data?.orders)
      ? response.data.orders.map(normalizeOrder)
      : [];
    Store.setAdminOrders(orders);
    return orders;
  },
  async updateOrderStatus(id: string, status: OrderStatus) {
    const response = await api.updateOrderStatus(id, status);
    const updated = normalizeOrder(response?.data?.order);
    const current = Store.getAdminOrders().map((order) => order.id === updated.id ? updated : order);
    Store.setAdminOrders(current);
    return updated;
  },
  async createCategory(payload: { name: string; image?: string | null; parentId?: string | null; file?: File | null }) {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.parentId) formData.append('parentId', payload.parentId);
    if (payload.file) formData.append('image', payload.file);
    else if (payload.image) formData.append('image', payload.image);
    await api.createCategory('', formData);
    return syncPublicData();
  },
  async updateCategory(id: string, payload: { name?: string; image?: string | null; parentId?: string | null; file?: File | null }) {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name);
    if (payload.parentId !== undefined) formData.append('parentId', payload.parentId || '');
    if (payload.file) formData.append('image', payload.file);
    else if (payload.image !== undefined) formData.append('image', payload.image || '');
    await api.updateCategory('', id, formData);
    return syncPublicData();
  },
  async deleteCategory(id: string) {
    await api.deleteCategory(id);
    return syncPublicData();
  },
  async createBrand(payload: { name: string; country?: string | null }) {
    await api.createBrand('', payload);
    return syncPublicData();
  },
  async updateBrand(id: string, payload: { name?: string; country?: string | null }) {
    await api.updateBrand('', id, payload);
    return syncPublicData();
  },
  async deleteBrand(id: string) {
    await api.deleteBrand(id);
    return syncPublicData();
  },
  async createCountry(payload: { name: string; image?: string | null; file?: File | null }) {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.file) formData.append('image', payload.file);
    else if (payload.image) formData.append('image', payload.image);
    await api.createCountry('', formData);
    return syncPublicData();
  },
  async updateCountry(id: string, payload: { name?: string; image?: string | null; file?: File | null }) {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name);
    if (payload.file) formData.append('image', payload.file);
    else if (payload.image !== undefined) formData.append('image', payload.image || '');
    await api.updateCountry('', id, formData);
    return syncPublicData();
  },
  async deleteCountry(id: string) {
    await api.deleteCountry(id);
    return syncPublicData();
  },
  async loadUsers(params?: Record<string, string>) {
    const response = await api.getUsers('', params);
    return Array.isArray(response?.data?.users) ? response.data.users : [];
  },
  async createUser(payload: { email: string; password: string; firstName?: string; lastName?: string; phone?: string; role?: string }) {
    const response = await api.createUser('', payload);
    return response?.data?.user;
  },
  async updateUser(id: string, payload: Record<string, unknown>) {
    const response = await api.updateUser('', id, payload);
    return response?.data?.user;
  },
  async deleteUser(id: string) {
    await api.deleteUser(id);
  },
  async createProduct(product: Record<string, any>) {
    const response = await api.createProduct('', buildProductFormData(product));
    await syncPublicData();
    return normalizeProduct(response?.data?.product);
  },
  async updateProduct(id: string, product: Record<string, any>) {
    const response = await api.updateProduct('', id, buildProductFormData(product));
    await syncPublicData();
    return normalizeProduct(response?.data?.product);
  },
  async deleteProduct(id: string) {
    await api.deleteProduct(id);
    await syncPublicData();
  },
  subscribeToProducts(callback: () => void) {
    if (typeof window === 'undefined') return () => {};

    const handler = () => callback();
    window.addEventListener('storage', handler);
    window.addEventListener('products:update', handler);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('products:update', handler);
    };
  },

  async getNotifications() {
    try {
      const response = await api.getNotifications();
      return response?.data?.notifications || [];
    } catch {
      return [];
    }
  },

  async getNotificationUnreadCount() {
    try {
      const response = await api.getNotificationUnreadCount();
      return response?.data?.count || 0;
    } catch {
      return 0;
    }
  },

  async markNotificationAsRead(id: string) {
    await api.markNotificationAsRead(id);
  },

  async markAllNotificationsAsRead() {
    await api.markAllNotificationsAsRead();
  },
};
