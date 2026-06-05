import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi, productsApi, suppliersApi, transactionsApi, invoicesApi, usersApi } from './api';

// ── Setup ─────────────────────────────────────────────────────
const TOKEN = 'test-jwt-token';

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(message: string, status = 400) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', mockFetch({}));
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// ── authApi ───────────────────────────────────────────────────
describe('authApi', () => {
  describe('login()', () => {
    it('stores access_token in localStorage and returns user', async () => {
      vi.stubGlobal('fetch', mockFetch({ access_token: TOKEN, user: { id: 'u1', name: 'Alice' } }));

      const user = await authApi.login('alice@example.com', 'password123');

      expect(localStorage.getItem('access_token')).toBe(TOKEN);
      expect(user.name).toBe('Alice');
    });

    it('sends POST to /auth/login with email and password', async () => {
      const spy = mockFetch({ access_token: TOKEN, user: { id: 'u1' } });
      vi.stubGlobal('fetch', spy);

      await authApi.login('alice@example.com', 'pw');

      const [url, opts] = spy.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ email: 'alice@example.com', password: 'pw' });
    });

    it('throws an error when credentials are invalid (401)', async () => {
      vi.stubGlobal('fetch', mockFetchError('Invalid email or password', 401));

      await expect(authApi.login('bad@example.com', 'wrong')).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout()', () => {
    it('removes access_token from localStorage', async () => {
      localStorage.setItem('access_token', TOKEN);
      vi.stubGlobal('fetch', mockFetch({ message: 'Logged out' }));

      await authApi.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('does not throw even when server call fails (graceful)', async () => {
      localStorage.setItem('access_token', TOKEN);
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await expect(authApi.logout()).resolves.toBeUndefined();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('changePassword()', () => {
    it('sends POST to /auth/change-password with correct body', async () => {
      const spy = mockFetch({ message: 'Password changed successfully' });
      vi.stubGlobal('fetch', spy);
      localStorage.setItem('access_token', TOKEN);

      await authApi.changePassword('oldPass', 'newPass123');

      const [url, opts] = spy.mock.calls[0];
      expect(url).toContain('/auth/change-password');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ currentPassword: 'oldPass', newPassword: 'newPass123' });
    });

    it('sends Authorization header with Bearer token', async () => {
      const spy = mockFetch({ message: 'ok' });
      vi.stubGlobal('fetch', spy);
      localStorage.setItem('access_token', TOKEN);

      await authApi.changePassword('old', 'new123');

      const [, opts] = spy.mock.calls[0];
      expect(opts.headers['Authorization']).toBe(`Bearer ${TOKEN}`);
    });

    it('throws when server returns error', async () => {
      vi.stubGlobal('fetch', mockFetchError('Current password is incorrect', 400));
      localStorage.setItem('access_token', TOKEN);

      await expect(authApi.changePassword('wrong', 'new123')).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('getMe()', () => {
    it('sends GET to /auth/me with Authorization header', async () => {
      const spy = mockFetch({ id: 'u1', email: 'alice@example.com' });
      vi.stubGlobal('fetch', spy);
      localStorage.setItem('access_token', TOKEN);

      await authApi.getMe();

      const [url, opts] = spy.mock.calls[0];
      expect(url).toContain('/auth/me');
      expect(opts.headers['Authorization']).toBe(`Bearer ${TOKEN}`);
    });
  });
});

// ── productsApi ───────────────────────────────────────────────
describe('productsApi', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', TOKEN);
  });

  describe('getAll()', () => {
    it('sends GET to /products', async () => {
      const spy = mockFetch([]);
      vi.stubGlobal('fetch', spy);

      await productsApi.getAll();

      expect(spy.mock.calls[0][0]).toContain('/products');
    });

    it('appends query params when filters are provided', async () => {
      const spy = mockFetch([]);
      vi.stubGlobal('fetch', spy);

      await productsApi.getAll({ category: 'Electronics', status: 'Active' });

      const url: string = spy.mock.calls[0][0];
      expect(url).toContain('category=Electronics');
      expect(url).toContain('status=Active');
    });
  });

  describe('create()', () => {
    it('sends POST to /products with product data', async () => {
      const spy = mockFetch({ id: 'p1' });
      vi.stubGlobal('fetch', spy);

      const data = { sku: 'SKU-001', name: 'Widget', category: 'Electronics', unit: 'pcs', costPrice: 10, stockQuantity: 50, minStock: 5 };
      await productsApi.create(data);

      const [url, opts] = spy.mock.calls[0];
      expect(url).toContain('/products');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual(data);
    });
  });

  describe('update()', () => {
    it('sends PUT to /products/:id', async () => {
      const spy = mockFetch({ id: 'p1', name: 'Updated' });
      vi.stubGlobal('fetch', spy);

      await productsApi.update('p1', { name: 'Updated' });

      const [url, opts] = spy.mock.calls[0];
      expect(url).toContain('/products/p1');
      expect(opts.method).toBe('PUT');
    });
  });

  describe('delete()', () => {
    it('sends DELETE to /products/:id', async () => {
      const spy = mockFetch({ message: 'Product deleted successfully' });
      vi.stubGlobal('fetch', spy);

      await productsApi.delete('p1');

      const [url, opts] = spy.mock.calls[0];
      expect(url).toContain('/products/p1');
      expect(opts.method).toBe('DELETE');
    });
  });

  describe('getLowStock()', () => {
    it('sends GET to /products/low-stock', async () => {
      const spy = mockFetch([]);
      vi.stubGlobal('fetch', spy);

      await productsApi.getLowStock();

      expect(spy.mock.calls[0][0]).toContain('/products/low-stock');
    });
  });

  describe('getExpiring()', () => {
    it('sends GET to /products/expiring?days=30 by default', async () => {
      const spy = mockFetch([]);
      vi.stubGlobal('fetch', spy);

      await productsApi.getExpiring();

      expect(spy.mock.calls[0][0]).toContain('/products/expiring?days=30');
    });

    it('allows custom days parameter', async () => {
      const spy = mockFetch([]);
      vi.stubGlobal('fetch', spy);

      await productsApi.getExpiring(7);

      expect(spy.mock.calls[0][0]).toContain('days=7');
    });
  });
});

// ── suppliersApi ──────────────────────────────────────────────
describe('suppliersApi', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', TOKEN);
    vi.stubGlobal('fetch', mockFetch([]));
  });

  it('getAll sends GET to /suppliers', async () => {
    const spy = mockFetch([]);
    vi.stubGlobal('fetch', spy);

    await suppliersApi.getAll();

    expect(spy.mock.calls[0][0]).toContain('/suppliers');
  });

  it('create sends POST to /suppliers', async () => {
    const spy = mockFetch({ id: 's1' });
    vi.stubGlobal('fetch', spy);

    await suppliersApi.create({ name: 'Acme', contact: 'J', email: 'a@b.com', address: '123' });

    expect(spy.mock.calls[0][1].method).toBe('POST');
  });

  it('delete sends DELETE to /suppliers/:id', async () => {
    const spy = mockFetch({ message: 'Supplier deleted successfully' });
    vi.stubGlobal('fetch', spy);

    await suppliersApi.delete('s1');

    const [url, opts] = spy.mock.calls[0];
    expect(url).toContain('/suppliers/s1');
    expect(opts.method).toBe('DELETE');
  });
});

// ── usersApi ──────────────────────────────────────────────────
describe('usersApi', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', TOKEN);
  });

  it('approve sends PUT to /users/:id/approve', async () => {
    const spy = mockFetch({ id: 'u1', status: 'Active' });
    vi.stubGlobal('fetch', spy);

    await usersApi.approve('u1');

    const [url, opts] = spy.mock.calls[0];
    expect(url).toContain('/users/u1/approve');
    expect(opts.method).toBe('PUT');
  });

  it('requestDelete sends PUT to /users/:id/request-delete', async () => {
    const spy = mockFetch({ id: 'u1', status: 'PendingDeletion' });
    vi.stubGlobal('fetch', spy);

    await usersApi.requestDelete('u1');

    expect(spy.mock.calls[0][0]).toContain('/users/u1/request-delete');
  });

  it('cancelDelete sends PUT to /users/:id/cancel-delete', async () => {
    const spy = mockFetch({ id: 'u1', status: 'Active' });
    vi.stubGlobal('fetch', spy);

    await usersApi.cancelDelete('u1');

    expect(spy.mock.calls[0][0]).toContain('/users/u1/cancel-delete');
  });
});

// ── General error handling ─────────────────────────────────────
describe('request() error handling', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', TOKEN);
  });

  it('throws Error with message from response body on non-2xx', async () => {
    vi.stubGlobal('fetch', mockFetchError('Product not found', 404));

    await expect(productsApi.getOne('ghost')).rejects.toThrow('Product not found');
  });

  it('falls back to HTTP status message when body has no message field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }));

    await expect(productsApi.getOne('any')).rejects.toThrow('HTTP 500');
  });

  it('includes Authorization header when token exists', async () => {
    const spy = mockFetch([]);
    vi.stubGlobal('fetch', spy);

    await productsApi.getAll();

    expect(spy.mock.calls[0][1].headers['Authorization']).toBe(`Bearer ${TOKEN}`);
  });

  it('omits Authorization header when no token is stored', async () => {
    localStorage.removeItem('access_token');
    const spy = mockFetch([]);
    vi.stubGlobal('fetch', spy);

    await productsApi.getAll();

    expect(spy.mock.calls[0][1].headers['Authorization']).toBeUndefined();
  });
});
