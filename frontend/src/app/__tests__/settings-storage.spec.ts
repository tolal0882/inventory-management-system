import { describe, it, expect, beforeEach } from 'vitest';

// ── Extracted pure functions from SettingsPage (duplicated here for isolated unit testing)
function loadFromStorage<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function saveToStorage(key: string, value: object) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

const GENERAL_DEFAULTS = {
  companyName: 'Inventory Pro Co.,Ltd.',
  timezone: 'asia-phnom-penh',
  currency: 'usd',
  language: 'en',
  lowStockThreshold: '20',
};

const NOTIF_DEFAULTS = {
  emailNotifications: true,
  lowStockAlerts: true,
  orderNotifications: true,
  pushNotifications: false,
  emailDigest: 'daily',
};

// ── Suite ─────────────────────────────────────────────────────
describe('Settings localStorage helpers', () => {
  beforeEach(() => localStorage.clear());

  // ── loadFromStorage ────────────────────────────────────────
  describe('loadFromStorage()', () => {
    it('returns defaults when key does not exist in localStorage', () => {
      const result = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);

      expect(result).toEqual(GENERAL_DEFAULTS);
    });

    it('merges stored values over defaults', () => {
      localStorage.setItem('inv_settings_general', JSON.stringify({ companyName: 'Custom Co.' }));

      const result = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);

      expect(result.companyName).toBe('Custom Co.');
      expect(result.timezone).toBe('asia-phnom-penh'); // still has default
    });

    it('returns all stored fields correctly', () => {
      const stored = { ...GENERAL_DEFAULTS, currency: 'khr', language: 'km' };
      localStorage.setItem('inv_settings_general', JSON.stringify(stored));

      const result = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);

      expect(result.currency).toBe('khr');
      expect(result.language).toBe('km');
    });

    it('returns defaults when stored JSON is malformed', () => {
      localStorage.setItem('inv_settings_general', '{ invalid json }');

      const result = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);

      expect(result).toEqual(GENERAL_DEFAULTS);
    });

    it('returns defaults when stored value is null (explicit localStorage.setItem(key, null))', () => {
      localStorage.setItem('inv_settings_general', 'null');

      // null is falsy so loadFromStorage returns defaults
      const result = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);

      expect(result).toEqual(GENERAL_DEFAULTS);
    });

    it('works with boolean fields (notification toggles)', () => {
      localStorage.setItem('inv_settings_notif', JSON.stringify({ ...NOTIF_DEFAULTS, pushNotifications: true }));

      const result = loadFromStorage('inv_settings_notif', NOTIF_DEFAULTS);

      expect(result.pushNotifications).toBe(true);
    });
  });

  // ── saveToStorage ──────────────────────────────────────────
  describe('saveToStorage()', () => {
    it('writes JSON-serialised object to localStorage', () => {
      saveToStorage('inv_test_key', { foo: 'bar', count: 42 });

      const raw = localStorage.getItem('inv_test_key');
      expect(JSON.parse(raw!)).toEqual({ foo: 'bar', count: 42 });
    });

    it('overwrites previous value when called again with the same key', () => {
      saveToStorage('inv_test_key', { version: 1 });
      saveToStorage('inv_test_key', { version: 2 });

      const raw = localStorage.getItem('inv_test_key');
      expect(JSON.parse(raw!).version).toBe(2);
    });

    it('roundtrip: save then load returns the same value', () => {
      const data = { ...NOTIF_DEFAULTS, emailDigest: 'weekly', pushNotifications: true };
      saveToStorage('inv_settings_notif_u1', data);

      const result = loadFromStorage('inv_settings_notif_u1', NOTIF_DEFAULTS);

      expect(result).toEqual(data);
    });
  });

  // ── Per-user key isolation ─────────────────────────────────
  describe('Per-user key isolation', () => {
    it('user A settings do not bleed into user B settings', () => {
      saveToStorage('inv_settings_notif_user-A', { ...NOTIF_DEFAULTS, emailDigest: 'hourly' });
      saveToStorage('inv_settings_notif_user-B', { ...NOTIF_DEFAULTS, emailDigest: 'weekly' });

      const userA = loadFromStorage('inv_settings_notif_user-A', NOTIF_DEFAULTS);
      const userB = loadFromStorage('inv_settings_notif_user-B', NOTIF_DEFAULTS);

      expect(userA.emailDigest).toBe('hourly');
      expect(userB.emailDigest).toBe('weekly');
    });

    it('shared GENERAL key is the same for all users', () => {
      saveToStorage('inv_settings_general', { ...GENERAL_DEFAULTS, companyName: 'Global Co.' });

      const forUserA = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);
      const forUserB = loadFromStorage('inv_settings_general', GENERAL_DEFAULTS);

      expect(forUserA.companyName).toBe('Global Co.');
      expect(forUserB.companyName).toBe('Global Co.');
    });
  });
});

// ── Dashboard stat calculations ────────────────────────────────
describe('Dashboard stat calculations (pure logic)', () => {
  const products = [
    { stockQuantity: 5,   minStock: 10, costPrice: 20, hasExpiration: false, expirationDate: null, status: 'Active' },
    { stockQuantity: 50,  minStock: 10, costPrice: 10, hasExpiration: false, expirationDate: null, status: 'Active' },
    { stockQuantity: 0,   minStock: 5,  costPrice: 5,  hasExpiration: false, expirationDate: null, status: 'Active' },
  ];

  it('calculates totalStockValue = sum(stockQuantity * costPrice)', () => {
    const totalValue = products.reduce((s, p) => s + p.stockQuantity * p.costPrice, 0);
    // (5*20) + (50*10) + (0*5) = 100 + 500 + 0 = 600
    expect(totalValue).toBe(600);
  });

  it('counts low stock items (stockQuantity < minStock)', () => {
    const low = products.filter(p => p.stockQuantity < p.minStock);
    // p[0]: 5 < 10 ✓, p[1]: 50 >= 10 ✗, p[2]: 0 < 5 ✓
    expect(low).toHaveLength(2);
  });

  it('sums total stock across all products', () => {
    const total = products.reduce((s, p) => s + p.stockQuantity, 0);
    expect(total).toBe(55);
  });
});

// ── Transaction audit trail mapping ───────────────────────────
describe('Audit trail mapping (ReportsPage logic)', () => {
  const NOW = new Date('2024-06-15T10:30:00Z');

  const transactions = [
    {
      id: 'tx-1',
      date: NOW,
      type: 'IN',
      productName: 'Widget',
      quantity: 50,
      warehouse: 'WH-A',
      userName: 'Alice',
      user: 'alice',
      note: 'Monthly restock',
      status: 'Approved',
    },
    {
      id: 'tx-2',
      date: NOW,
      type: 'OUT',
      productName: 'Gadget',
      quantity: 10,
      warehouse: 'WH-B',
      userName: '',
      user: 'bob',
      note: null,
      status: 'Pending',
    },
  ];

  function mapToAuditTrail(txns: typeof transactions) {
    return txns.map(t => ({
      id: t.id,
      timestamp: new Date(t.date).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      action: `Stock ${t.type}`,
      user: t.userName || t.user || '—',
      details: [
        t.productName,
        `Qty: ${t.quantity}`,
        `Warehouse: ${t.warehouse}`,
        t.note ? `Note: ${t.note}` : null,
        `Status: ${t.status}`,
      ].filter(Boolean).join(' | '),
    }));
  }

  it('maps type to action with "Stock" prefix', () => {
    const trail = mapToAuditTrail(transactions);

    expect(trail[0].action).toBe('Stock IN');
    expect(trail[1].action).toBe('Stock OUT');
  });

  it('falls back to user field when userName is empty', () => {
    const trail = mapToAuditTrail(transactions);

    expect(trail[0].user).toBe('Alice');   // has userName
    expect(trail[1].user).toBe('bob');     // falls back to user
  });

  it('omits Note from details when note is null', () => {
    const trail = mapToAuditTrail(transactions);

    expect(trail[1].details).not.toContain('Note');
  });

  it('includes Note in details when note is present', () => {
    const trail = mapToAuditTrail(transactions);

    expect(trail[0].details).toContain('Note: Monthly restock');
  });

  it('preserves all transaction IDs', () => {
    const trail = mapToAuditTrail(transactions);

    expect(trail.map(t => t.id)).toEqual(['tx-1', 'tx-2']);
  });
});
