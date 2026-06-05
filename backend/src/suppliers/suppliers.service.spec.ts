import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  supplier: {
    findMany:  jest.fn(),
    findUnique:jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  supplierProduct: {
    deleteMany: jest.fn(),
  },
};

const RAW_SUPPLIER = {
  id: 'sup-1',
  name: 'Acme Corp',
  contact: 'John',
  email: 'acme@example.com',
  address: '123 Main St',
  createdAt: new Date(),
  products: [
    { productId: 'prod-1', product: { id: 'prod-1', name: 'Widget' } },
    { productId: 'prod-2', product: { id: 'prod-2', name: 'Gadget' } },
  ],
};

// ── Suite ─────────────────────────────────────────────────────
describe('SuppliersService', () => {
  let service: SuppliersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────
  describe('findAll()', () => {
    it('maps products relation into productsSupplied array of IDs', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([RAW_SUPPLIER]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].productsSupplied).toEqual(['prod-1', 'prod-2']);
      // The service spreads the raw record — productsSupplied is the ID array derived from products
      expect(result[0].productsSupplied).toHaveLength(2);
    });

    it('returns empty array when no suppliers exist', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });

    it('supplier with no products has an empty productsSupplied array', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([{ ...RAW_SUPPLIER, products: [] }]);

      const result = await service.findAll();

      expect(result[0].productsSupplied).toEqual([]);
    });
  });

  // ── findOne ────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns supplier with productsSupplied array', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);

      const result = await service.findOne('sup-1');

      expect(result.id).toBe('sup-1');
      expect(result.productsSupplied).toHaveLength(2);
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────
  describe('create()', () => {
    it('creates supplier without product links when productsSupplied is empty', async () => {
      mockPrisma.supplier.create.mockResolvedValue(RAW_SUPPLIER);

      await service.create({ name: 'Acme', contact: 'J', email: 'a@b.com', address: '123' });

      const createData = mockPrisma.supplier.create.mock.calls[0][0].data;
      expect(createData).not.toHaveProperty('products');
    });

    it('creates supplier with product links when productsSupplied is provided', async () => {
      mockPrisma.supplier.create.mockResolvedValue(RAW_SUPPLIER);

      await service.create({
        name: 'Acme', contact: 'J', email: 'a@b.com', address: '123',
        productsSupplied: ['prod-1', 'prod-2'],
      });

      const createData = mockPrisma.supplier.create.mock.calls[0][0].data;
      expect(createData.products.create).toHaveLength(2);
      expect(createData.products.create[0].productId).toBe('prod-1');
    });
  });

  // ── update ─────────────────────────────────────────────────
  describe('update()', () => {
    it('updates supplier fields', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplierProduct.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.supplier.update.mockResolvedValue({ ...RAW_SUPPLIER, name: 'Updated Corp' });

      const result = await service.update('sup-1', { name: 'Updated Corp' });

      expect(mockPrisma.supplier.update).toHaveBeenCalled();
    });

    it('replaces all product links when productsSupplied is provided', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplierProduct.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.supplier.update.mockResolvedValue(RAW_SUPPLIER);

      await service.update('sup-1', { productsSupplied: ['prod-3'] });

      expect(mockPrisma.supplierProduct.deleteMany).toHaveBeenCalledWith({ where: { supplierId: 'sup-1' } });
      const updateData = mockPrisma.supplier.update.mock.calls[0][0].data;
      expect(updateData.products.create).toHaveLength(1);
      expect(updateData.products.create[0].productId).toBe('prod-3');
    });

    it('does NOT delete product links when productsSupplied is not in the DTO', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplier.update.mockResolvedValue(RAW_SUPPLIER);

      await service.update('sup-1', { name: 'Only Name Change' });

      expect(mockPrisma.supplierProduct.deleteMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────
  describe('remove()', () => {
    it('deletes supplier and returns success message', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplier.delete.mockResolvedValue(RAW_SUPPLIER);

      const result = await service.remove('sup-1');

      expect(result.message).toBe('Supplier deleted successfully');
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});
