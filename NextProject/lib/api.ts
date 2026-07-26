const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: HttpMethod;
  token?: string | null;
  guestId?: string | null;
};

const buildHeaders = (options: RequestOptions) => {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.guestId) {
    headers.set('X-Guest-Id', options.guestId);
  }

  return headers;
};

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

const attemptRefresh = async (): Promise<string> => {
  if (typeof window === 'undefined') throw new Error('No refresh available');

  const refreshToken = localStorage.getItem('hd_refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        localStorage.removeItem('hd_token');
        localStorage.removeItem('hd_refresh_token');
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      const newToken = data.token as string;
      const newRefreshToken = data.refreshToken as string;

      localStorage.setItem('hd_token', newToken);
      localStorage.setItem('hd_refresh_token', newRefreshToken);

      return newToken;
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
  });

  if (response.status === 401 && retryOn401 && options.token) {
    try {
      const newToken = await attemptRefresh();
      return request<T>(path, { ...options, token: newToken }, false);
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hd_token');
        localStorage.removeItem('hd_refresh_token');
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

const withAuth = (token?: string | null, guestId?: string | null) => ({ token: token || null, guestId: guestId || null });

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
  refresh: (refreshToken: string) => request<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false),
  logout: (refreshToken: string) => request<any>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false),
  verifyAdmin: (token: string) => request<any>('/auth/verify-admin', { token }),
  getMe: (token: string) => request<any>('/auth/me', { token }),
  updateMe: (token: string, payload: Record<string, unknown>) => request<any>('/auth/me', { method: 'PATCH', token, body: JSON.stringify(payload) }),
  deleteMe: (token: string) => request<any>('/auth/me', { method: 'DELETE', token }),
  getFavorites: (token: string) => request<any>('/favorites', { token }),
  addFavorite: (token: string, productId: string) => request<any>('/favorites', { method: 'POST', token, body: JSON.stringify({ productId }) }),
  removeFavorite: (token: string, productId: string) => request<any>(`/favorites/${productId}`, { method: 'DELETE', token }),
  getCompare: (token: string) => request<any>('/compare', { token }),
  addCompare: (token: string, productId: string) => request<any>('/compare', { method: 'POST', token, body: JSON.stringify({ productId }) }),
  removeCompare: (token: string, productId: string) => request<any>(`/compare/${productId}`, { method: 'DELETE', token }),
  syncCompare: (token: string, productIds: string[]) => request<any>('/compare/sync', { method: 'POST', token, body: JSON.stringify({ productIds }) }),
  getCart: (auth: { token?: string | null; guestId?: string | null }) => request<any>('/cart', withAuth(auth.token, auth.guestId)),
  addCartItem: (auth: { token?: string | null; guestId?: string | null }, productId: string, quantity = 1) => request<any>('/cart/items', { method: 'POST', ...withAuth(auth.token, auth.guestId), body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (auth: { token?: string | null; guestId?: string | null }, productId: string, quantity: number) => request<any>(`/cart/items/${productId}`, { method: 'PATCH', ...withAuth(auth.token, auth.guestId), body: JSON.stringify({ quantity }) }),
  removeCartItem: (auth: { token?: string | null; guestId?: string | null }, productId: string) => request<any>(`/cart/items/${productId}`, { method: 'DELETE', ...withAuth(auth.token, auth.guestId) }),
  clearCart: (auth: { token?: string | null; guestId?: string | null }) => request<any>('/cart', { method: 'DELETE', ...withAuth(auth.token, auth.guestId) }),
  mergeGuestCart: (token: string, guestId: string) => request<any>('/cart/merge', { method: 'POST', token, body: JSON.stringify({ guestId }) }),
  getMyOrders: (token: string) => request<any>('/orders/my-orders', { token }),
  createOrder: (token: string, payload: Record<string, unknown>) => request<any>('/orders', { method: 'POST', token, body: JSON.stringify(payload) }),
  getAdminOrders: (token: string) => request<any>('/orders?limit=200', { token }),
  updateOrderStatus: (token: string, id: string, status: string) => request<any>(`/orders/${id}/status`, { method: 'PATCH', token, body: JSON.stringify({ status }) }),
  createCategory: (token: string, payload: FormData) => request<any>('/categories', { method: 'POST', token, body: payload }),
  updateCategory: (token: string, id: string, payload: FormData) => request<any>(`/categories/${id}`, { method: 'PATCH', token, body: payload }),
  deleteCategory: (token: string, id: string) => request<any>(`/categories/${id}`, { method: 'DELETE', token }),
  createCountry: (token: string, payload: FormData) => request<any>('/countries', { method: 'POST', token, body: payload }),
  updateCountry: (token: string, id: string, payload: FormData) => request<any>(`/countries/${id}`, { method: 'PATCH', token, body: payload }),
  deleteCountry: (token: string, id: string) => request<any>(`/countries/${id}`, { method: 'DELETE', token }),
  createBrand: (token: string, payload: Record<string, unknown>) => request<any>('/brands', { method: 'POST', token, body: JSON.stringify(payload) }),
  updateBrand: (token: string, id: string, payload: Record<string, unknown>) => request<any>(`/brands/${id}`, { method: 'PATCH', token, body: JSON.stringify(payload) }),
  deleteBrand: (token: string, id: string) => request<any>(`/brands/${id}`, { method: 'DELETE', token }),
  createProduct: (token: string, payload: FormData) => request<any>('/products', { method: 'POST', token, body: payload }),
  updateProduct: (token: string, id: string, payload: FormData) => request<any>(`/products/${id}`, { method: 'PATCH', token, body: payload }),
  deleteProduct: (token: string, id: string) => request<any>(`/products/${id}`, { method: 'DELETE', token }),
  getUsers: (token: string) => request<any>('/users', { token }),
  getUserById: (token: string, id: string) => request<any>(`/users/${id}`, { token }),
  createUser: (token: string, payload: Record<string, unknown>) => request<any>('/users', { method: 'POST', token, body: JSON.stringify(payload) }),
  updateUser: (token: string, id: string, payload: Record<string, unknown>) => request<any>(`/users/${id}`, { method: 'PATCH', token, body: JSON.stringify(payload) }),
  deleteUser: (token: string, id: string) => request<any>(`/users/${id}`, { method: 'DELETE', token }),
  getNotifications: (token: string) => request<any>('/notifications', { token }),
  getNotificationUnreadCount: (token: string) => request<any>('/notifications/unread-count', { token }),
  markNotificationAsRead: (token: string, id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH', token }),
  markAllNotificationsAsRead: (token: string) => request<any>('/notifications/read-all', { method: 'PATCH', token }),
};
