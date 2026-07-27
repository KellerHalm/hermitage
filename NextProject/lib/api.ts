const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: HttpMethod;
  token?: string | null;
};

const buildHeaders = (options: RequestOptions) => {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const attemptRefresh = async (): Promise<void> => {
  if (typeof window === 'undefined') throw new Error('No refresh available');

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

async function request<T>(path: string, options: RequestOptions = {}, retryOn401 = true): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: buildHeaders(options),
    body: options.body,
    cache: 'no-store',
    credentials: 'include',
  });

  if (response.status === 401 && retryOn401) {
    try {
      await attemptRefresh();
      return request<T>(path, options, false);
    } catch {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
  }

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const payload = await response.json();
      message = payload.message || payload.error || payload.status || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const buildAssetUrl = (value?: string | null) => {
  if (!value) return `${API_ORIGIN}/uploads/images/product-fallback.svg`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
};

type ProductQuery = {
  page?: number;
  limit?: number;
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: string;
  color?: string;
  material?: string;
  country?: string;
  search?: string;
  sort?: string;
  isNew?: string | boolean;
  isSale?: string | boolean;
};

const buildQuery = (params?: ProductQuery) => {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

const withAuth = (token?: string | null) => ({ token: token || null });

export const api = {
  origin: API_ORIGIN,
  listProducts: (params?: ProductQuery) => request<any>(`/products${buildQuery(params)}`),
  listCategories: () => request<any>('/categories'),
  getCategoryBySlug: (slug: string) => request<any>(`/categories/slug/${slug}`),
  listBrands: () => request<any>('/brands'),
  listCountries: () => request<any>('/countries'),
  getProduct: (slug: string) => request<any>(`/products/${slug}`),
  getProductById: (id: string) => request<any>(`/products/by-id/${id}`),
  getSimilarProducts: (slug: string) => request<any>(`/products/${slug}/similar`),
  getBoughtTogetherProducts: (slug: string) => request<any>(`/products/${slug}/bought-together`),
  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
  login: (payload: { email: string; password: string }) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { email: string; password: string; firstName: string; lastName: string; phone: string }) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  refresh: () => request<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({}) }, false),
  logout: () => request<any>('/auth/logout', { method: 'POST', body: JSON.stringify({}) }, false),
  verifyAdmin: () => request<any>('/auth/verify-admin'),
  getMe: () => request<any>('/auth/me'),
  updateMe: (token: string, payload: Record<string, unknown>) => request<any>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteMe: () => request<any>('/auth/me', { method: 'DELETE' }),
  getFavorites: () => request<any>('/favorites'),
  addFavorite: (productId: string) => request<any>('/favorites', { method: 'POST', body: JSON.stringify({ productId }) }),
  removeFavorite: (productId: string) => request<any>(`/favorites/${productId}`, { method: 'DELETE' }),
  getCompare: () => request<any>('/compare'),
  addCompare: (productId: string) => request<any>('/compare', { method: 'POST', body: JSON.stringify({ productId }) }),
  removeCompare: (productId: string) => request<any>(`/compare/${productId}`, { method: 'DELETE' }),
  syncCompare: (token: string, productIds: string[]) => request<any>('/compare/sync', { method: 'POST', body: JSON.stringify({ productIds }) }),
  getCart: (auth: { token?: string | null }) => request<any>('/cart', withAuth(auth.token)),
  addCartItem: (auth: { token?: string | null }, productId: string, quantity = 1) => request<any>('/cart/items', { method: 'POST', ...withAuth(auth.token), body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (auth: { token?: string | null }, productId: string, quantity: number) => request<any>(`/cart/items/${productId}`, { method: 'PATCH', ...withAuth(auth.token), body: JSON.stringify({ quantity }) }),
  removeCartItem: (auth: { token?: string | null }, productId: string) => request<any>(`/cart/items/${productId}`, { method: 'DELETE', ...withAuth(auth.token) }),
  clearCart: (auth: { token?: string | null }) => request<any>('/cart', { method: 'DELETE', ...withAuth(auth.token) }),
  mergeGuestCart: (token: string) => request<any>('/cart/merge', { method: 'POST', body: JSON.stringify({}) }),
  getMyOrders: () => request<any>('/orders/my-orders'),
  createOrder: (token: string, payload: Record<string, unknown>) => request<any>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminOrders: () => request<any>('/orders?limit=200'),
  updateOrderStatus: (id: string, status: string) => request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createCategory: (token: string, payload: FormData) => request<any>('/categories', { method: 'POST', body: payload }),
  updateCategory: (token: string, id: string, payload: FormData) => request<any>(`/categories/${id}`, { method: 'PATCH', body: payload }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),
  createCountry: (token: string, payload: FormData) => request<any>('/countries', { method: 'POST', body: payload }),
  updateCountry: (token: string, id: string, payload: FormData) => request<any>(`/countries/${id}`, { method: 'PATCH', body: payload }),
  deleteCountry: (id: string) => request<any>(`/countries/${id}`, { method: 'DELETE' }),
  createBrand: (token: string, payload: Record<string, unknown>) => request<any>('/brands', { method: 'POST', body: JSON.stringify(payload) }),
  updateBrand: (token: string, id: string, payload: Record<string, unknown>) => request<any>(`/brands/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteBrand: (id: string) => request<any>(`/brands/${id}`, { method: 'DELETE' }),
  createProduct: (token: string, payload: FormData) => request<any>('/products', { method: 'POST', body: payload }),
  updateProduct: (token: string, id: string, payload: FormData) => request<any>(`/products/${id}`, { method: 'PATCH', body: payload }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
  getUsers: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/users${qs}`);
  },
  getUserById: (token: string, id: string) => request<any>(`/users/${id}`),
  createUser: (token: string, payload: Record<string, unknown>) => request<any>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (token: string, id: string, payload: Record<string, unknown>) => request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteUser: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
  getNotifications: () => request<any>('/notifications'),
  getNotificationUnreadCount: () => request<any>('/notifications/unread-count'),
  markNotificationAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
};
