// ============================================================
// src/app/services/api.ts
//
// Drop this file into your frontend project at:
//   src/app/services/api.ts
//
// This replaces all mock data with real backend API calls.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── Token helpers ───────────────────────────────────────────
const getToken = () => localStorage.getItem('access_token');
const setToken = (token: string) => localStorage.setItem('access_token', token);
const removeToken = () => localStorage.removeItem('access_token');

// ─── Base fetch wrapper ──────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    return data.user;
  },

  logout: async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => {});
    removeToken();
  },

  getMe: () => request<any>('/auth/me'),
};

// ─── Products ────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: { category?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/products${query ? '?' + query : ''}`);
  },
  getOne: (id: string) => request<any>(`/products/${id}`),
  getLowStock: () => request<any[]>('/products/low-stock'),
  getExpiring: (days = 30) => request<any[]>(`/products/expiring?days=${days}`),
  create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Suppliers ───────────────────────────────────────────────
export const suppliersApi = {
  getAll: () => request<any[]>('/suppliers'),
  getOne: (id: string) => request<any>(`/suppliers/${id}`),
  create: (data: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/suppliers/${id}`, { method: 'DELETE' }),
};

// ─── Transactions ────────────────────────────────────────────
export const transactionsApi = {
  getAll: (params?: { productId?: string; type?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/transactions${query ? '?' + query : ''}`);
  },
  getOne: (id: string) => request<any>(`/transactions/${id}`),
  create: (data: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/transactions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id: string) => request<any>(`/transactions/${id}`, { method: 'DELETE' }),
};

// ─── Invoices ────────────────────────────────────────────────
export const invoicesApi = {
  getAll: (params?: { status?: string; supplierId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/invoices${query ? '?' + query : ''}`);
  },
  getOne: (id: string) => request<any>(`/invoices/${id}`),
  create: (data: any) => request<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/invoices/${id}`, { method: 'DELETE' }),
};

// ─── Purchase Orders ─────────────────────────────────────────
export const purchaseOrdersApi = {
  getAll: (status?: string) => request<any[]>(`/purchase-orders${status ? '?status=' + status : ''}`),
  getOne: (id: string) => request<any>(`/purchase-orders/${id}`),
  create: (data: any) => request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/purchase-orders/${id}`, { method: 'DELETE' }),
};

// ─── Users ───────────────────────────────────────────────────
export const usersApi = {
  getAll: () => request<any[]>('/users'),
  getOne: (id: string) => request<any>(`/users/${id}`),
  create: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
};

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => request<any>('/dashboard/stats'),
  getStockMovement: (months = 6) => request<any[]>(`/dashboard/stock-movement?months=${months}`),
  getStockByCategory: () => request<any[]>('/dashboard/stock-by-category'),
};

// ─── Activity Logs ───────────────────────────────────────────
export const activityLogsApi = {
  getAll: (params?: { userId?: string; action?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/activity-logs${query ? '?' + query : ''}`);
  },
  getByUser: (userId: string) => request<any[]>(`/activity-logs/user/${userId}`),
};
