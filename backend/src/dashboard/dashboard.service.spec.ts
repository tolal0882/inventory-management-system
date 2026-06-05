import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  product: { findMany: jest.fn() },
  supplier: { count: jest.fn() },
  purchaseOrder: { count: jest.fn() },
  stockTransaction: { findMany: jest.fn() },
};

const NOW = new Date();
const FUTURE_10  = new Date(NOW.getTime() + 10  * 864e5);
const FUTURE_40  = new Date(NOW.getTime() + 40  * 864e5); // outside 30-day window
const PAST_5     = new Date(NOW.getTime() - 5   * 864e5); // expired

// ── Suite ─────────────────────────────────────────────────────
describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  // ── getStats ───────────────────────────────────────────────
  describe('getStats()', () => {
    const PRODUCTS = [
      { id: 'p1', name: 'A', stockQuantity: 5,  minStock: 10, costPrice: 20, hasExpiration: false, expirationDate: null },
      { id: 'p2', name: 'B', stockQuantity: 50, minStock: 10, costPrice: 10, hasExpiration: true,  expirationDate: FUTURE_10 },
      { id: 'p3', name: 'C', stockQuantity: 30, minStock: 10, costPrice: 5,  hasExpiration: true,  expirationDate: FUTURE_40 },
      { id: 'p4', name: 'D', stockQuantity: 20, minStock: 10, costPrice: 8,  hasExpiration: true,  expirationDate: PAST_5 },
    ];

    beforeEach(() => {
      mockPrisma.product.findMany.mockResolvedValue(PRODUCTS);
      mockPrisma.supplier.count.mockResolvedValue(3);
      mockPrisma.purchaseOrder.count.mockResolvedValue(2);
      mockPrisma.stockTransaction.findMany.mockResolvedValue([
        { type: 'IN',        quantity: 50, date: new Date() },
        { type: 'OUT',       quantity: 20, date: new Date() },
        { type: 'SHRINKAGE', quantity: 8,  date: new Date() },
      ]);
    });

    it('counts products correctly', async () => {
      const stats = await service.getStats();
      expect(stats.totalProducts).toBe(4);
    });

    it('sums total stock across all products', async () => {
      const stats = await service.getStats();
      // 5 + 50 + 30 + 20 = 105
      expect(stats.totalStock).toBe(105);
    });

    it('calculates total stock value (stockQuantity * costPrice)', async () => {
      const stats = await service.getStats();
      // (5*20) + (50*10) + (30*5) + (20*8) = 100 + 500 + 150 + 160 = 910
      expect(stats.totalStockValue).toBe(910);
    });

    it('counts low stock items (stockQuantity < minStock)', async () => {
      const stats = await service.getStats();
      // Only p1 has stockQuantity(5) < minStock(10)
      expect(stats.lowStockItems).toBe(1);
    });

    it('returns totalSuppliers from supplier.count', async () => {
      const stats = await service.getStats();
      expect(stats.totalSuppliers).toBe(3);
    });

    it('returns pendingOrders from purchaseOrder.count', async () => {
      const stats = await service.getStats();
      expect(stats.pendingOrders).toBe(2);
    });

    it('counts expired items (expirationDate in the past)', async () => {
      const stats = await service.getStats();
      // Only p4 has expirationDate in the past
      expect(stats.expiredItems).toBe(1);
    });

    it('counts items expiring within 30 days (not yet expired)', async () => {
      const stats = await service.getStats();
      // p2 expires in 10 days (inside window), p3 in 40 days (outside), p4 is already expired
      expect(stats.expiringItems).toBe(1);
    });

    it('sums shrinkage quantity from recent transactions', async () => {
      const stats = await service.getStats();
      expect(stats.shrinkageThisMonth).toBe(8);
    });

    it('returns recentTransactions list', async () => {
      const stats = await service.getStats();
      expect(Array.isArray(stats.recentTransactions)).toBe(true);
      expect(stats.recentTransactions).toHaveLength(3);
    });
  });

  // ── getStockMovement ───────────────────────────────────────
  describe('getStockMovement()', () => {
    it('returns one bucket per month for the requested range', async () => {
      mockPrisma.stockTransaction.findMany.mockResolvedValue([]);

      const result = await service.getStockMovement(6);

      expect(result).toHaveLength(6);
    });

    it('each bucket has month, stockIn, stockOut fields', async () => {
      mockPrisma.stockTransaction.findMany.mockResolvedValue([]);

      const result = await service.getStockMovement(3);

      result.forEach(bucket => {
        expect(bucket).toHaveProperty('month');
        expect(bucket).toHaveProperty('stockIn');
        expect(bucket).toHaveProperty('stockOut');
      });
    });

    it('correctly bins IN and OUT transactions into their month bucket', async () => {
      const thisMonth = new Date();
      mockPrisma.stockTransaction.findMany.mockResolvedValue([
        { type: 'IN',  quantity: 100, date: thisMonth },
        { type: 'OUT', quantity: 40,  date: thisMonth },
        { type: 'IN',  quantity: 60,  date: thisMonth },
      ]);

      const result = await service.getStockMovement(1);

      expect(result[0].stockIn).toBe(160);
      expect(result[0].stockOut).toBe(40);
    });

    it('SHRINKAGE and TRANSFER are not counted in stockIn/stockOut', async () => {
      const thisMonth = new Date();
      mockPrisma.stockTransaction.findMany.mockResolvedValue([
        { type: 'SHRINKAGE', quantity: 10, date: thisMonth },
        { type: 'TRANSFER',  quantity: 5,  date: thisMonth },
      ]);

      const result = await service.getStockMovement(1);

      expect(result[0].stockIn).toBe(0);
      expect(result[0].stockOut).toBe(0);
    });
  });

  // ── getStockByCategory ─────────────────────────────────────
  describe('getStockByCategory()', () => {
    it('groups products by category with stock and value totals', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { category: 'Electronics', stockQuantity: 50, costPrice: 10 },
        { category: 'Electronics', stockQuantity: 30, costPrice: 20 },
        { category: 'Food',        stockQuantity: 100, costPrice: 2 },
      ]);

      const result = await service.getStockByCategory();

      const electronics = result.find(r => r.category === 'Electronics');
      const food = result.find(r => r.category === 'Food');

      expect(electronics.stock).toBe(80);
      expect(electronics.value).toBe(50 * 10 + 30 * 20); // 500 + 600 = 1100
      expect(food.stock).toBe(100);
      expect(food.value).toBe(200);
    });

    it('returns empty array when no products exist', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await service.getStockByCategory();

      expect(result).toHaveLength(0);
    });
  });
});
