import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  supplier: {
    findUnique: jest.fn(),
  },
};

const NOW = new Date();
const FUTURE = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days ahead
const PAST   = new Date(NOW.getTime() - 5  * 24 * 60 * 60 * 1000); // 5 days ago

const PRODUCT = {
  id: 'prod-1',
  sku: 'SKU-001',
  name: 'Widget',
  category: 'Electronics',
  unit: 'pcs',
  costPrice: 10,
  stockQuantity: 50,
  minStock: 20,
  status: 'Active',
  hasExpiration: false,
  expirationDate: null,
  createdAt: NOW,
};

// ── Suite ─────────────────────────────────────────────────────
describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns all products when called with no filters', async () => {
      mockPrisma.product.findMany.mockResolvedValue([PRODUCT]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('filters by category', async () => {
      mockPrisma.product.findMany.mockResolvedValue([PRODUCT]);

      await service.findAll('Electronics');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'Electronics' } })
      );
    });

    it('filters by status', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findAll(undefined, 'Inactive');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'Inactive' } })
      );
    });

    it('filters by both category and status', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findAll('Electronics', 'Active');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'Electronics', status: 'Active' } })
      );
    });
  });

  // ── findOne ────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns a product when found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);

      const result = await service.findOne('prod-1');

      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Widget');
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findLowStock ───────────────────────────────────────────
  describe('findLowStock()', () => {
    it('returns only products where stockQuantity < minStock', async () => {
      const lowProduct  = { ...PRODUCT, id: 'p-low',  stockQuantity: 5,  minStock: 20 };
      const okProduct   = { ...PRODUCT, id: 'p-ok',   stockQuantity: 50, minStock: 20 };
      const exactProduct= { ...PRODUCT, id: 'p-exact',stockQuantity: 20, minStock: 20 };
      mockPrisma.product.findMany.mockResolvedValue([lowProduct, okProduct, exactProduct]);

      const result = await service.findLowStock();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p-low');
    });

    it('returns empty array when all products have sufficient stock', async () => {
      mockPrisma.product.findMany.mockResolvedValue([{ ...PRODUCT, stockQuantity: 100, minStock: 10 }]);

      const result = await service.findLowStock();

      expect(result).toHaveLength(0);
    });

    it('only queries Active products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findLowStock();

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'Active' } })
      );
    });
  });

  // ── findExpiringSoon ───────────────────────────────────────
  describe('findExpiringSoon()', () => {
    it('returns products expiring within the given days window', async () => {
      const expiring = { ...PRODUCT, hasExpiration: true, expirationDate: FUTURE };
      mockPrisma.product.findMany.mockResolvedValue([expiring]);

      const result = await service.findExpiringSoon(30);

      expect(result).toHaveLength(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hasExpiration: true }),
        })
      );
    });

    it('defaults to 30 days window when no argument supplied', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findExpiringSoon();

      const call = mockPrisma.product.findMany.mock.calls[0][0];
      const cutoff: Date = call.where.expirationDate.lte;
      const diffDays = Math.round((cutoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  // ── create ─────────────────────────────────────────────────
  describe('create()', () => {
    it('creates and returns a new product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null); // no duplicate SKU
      mockPrisma.product.create.mockResolvedValue(PRODUCT);
      mockPrisma.supplier.findUnique.mockResolvedValue({ id: 'sup-1', name: 'Acme' });

      const result = await service.create({
        sku: 'SKU-001', name: 'Widget', category: 'Electronics',
        unit: 'pcs', costPrice: 10, stockQuantity: 50, minStock: 20,
        supplierId: 'sup-1',
      });

      expect(result.sku).toBe('SKU-001');
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it('defaults status to Active when not provided', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(PRODUCT);
      mockPrisma.supplier.findUnique.mockResolvedValue({ id: 'sup-1', name: 'Acme' });

      await service.create({
        sku: 'SKU-002', name: 'Gadget', category: 'Electronics',
        unit: 'pcs', costPrice: 5, stockQuantity: 10, minStock: 2,
        supplierId: 'sup-1',
      });

      const createData = mockPrisma.product.create.mock.calls[0][0].data;
      expect(createData.status).toBe('Active');
    });

    it('parses expirationDate string into a Date object', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({ ...PRODUCT, hasExpiration: true });
      mockPrisma.supplier.findUnique.mockResolvedValue({ id: 'sup-1', name: 'Acme' });

      await service.create({
        sku: 'SKU-EXP', name: 'Milk', category: 'Food',
        unit: 'L', costPrice: 2, stockQuantity: 10, minStock: 2,
        hasExpiration: true, expirationDate: '2025-12-31',
        supplierId: 'sup-1',
      });

      const createData = mockPrisma.product.create.mock.calls[0][0].data;
      expect(createData.expirationDate).toBeInstanceOf(Date);
    });

    it('throws ConflictException when SKU already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);

      await expect(service.create({
        sku: 'SKU-001', name: 'Dup', category: 'X', unit: 'pcs',
        costPrice: 1, stockQuantity: 1, minStock: 0,
        supplierId: 'sup-1',
      })).rejects.toThrow(ConflictException);

      expect(mockPrisma.product.create).not.toHaveBeenCalled();
    });
  });

  // ── update ─────────────────────────────────────────────────
  describe('update()', () => {
    it('updates a product successfully', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      mockPrisma.product.findFirst.mockResolvedValue(null); // no SKU conflict
      mockPrisma.product.update.mockResolvedValue({ ...PRODUCT, name: 'Updated Widget' });

      const result = await service.update('prod-1', { name: 'Updated Widget' });

      expect(result.name).toBe('Updated Widget');
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new SKU already belongs to another product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      mockPrisma.product.findFirst.mockResolvedValue({ ...PRODUCT, id: 'prod-2' });

      await expect(service.update('prod-1', { sku: 'SKU-TAKEN' })).rejects.toThrow(ConflictException);
    });

    it('allows updating SKU to the same value (not a conflict)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      mockPrisma.product.findFirst.mockResolvedValue(null); // same product, no OTHER match
      mockPrisma.product.update.mockResolvedValue(PRODUCT);

      await expect(service.update('prod-1', { sku: 'SKU-001' })).resolves.toBeDefined();
    });
  });

  // ── remove ─────────────────────────────────────────────────
  describe('remove()', () => {
    it('deletes the product and returns success message', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      mockPrisma.product.delete.mockResolvedValue(PRODUCT);

      const result = await service.remove('prod-1');

      expect(result.message).toBe('Product deleted successfully');
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.product.delete).not.toHaveBeenCalled();
    });
  });
});
