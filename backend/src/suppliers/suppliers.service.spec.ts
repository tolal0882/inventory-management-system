import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
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
  product: {
    findMany:   jest.fn(),
    findFirst:  jest.fn(),
    update:     jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockProductsService = {
  createFromSupplierName: jest.fn(),
};

const RAW_SUPPLIER = {
  id: 'sup-1',
  name: 'Acme Corp',
  contact: 'John',
  email: 'acme@example.com',
  address: '123 Main St',
  createdAt: new Date(),
  suppliedProducts: [
    { id: 'prod-1', name: 'Widget' },
    { id: 'prod-2', name: 'Gadget' },
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
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();

    // Sensible defaults so tests that don't touch products don't need boilerplate
    mockPrisma.product.findMany.mockResolvedValue([]);
    mockPrisma.product.findFirst.mockResolvedValue(null);
  });

  // ── findAll ────────────────────────────────────────────────
  describe('findAll()', () => {
    it('maps suppliedProducts relation into productsSupplied array of names', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([RAW_SUPPLIER]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].productsSupplied).toEqual(['Widget', 'Gadget']);
    });

    it('returns empty array when no suppliers exist', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });

    it('supplier with no products has an empty productsSupplied array', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([{ ...RAW_SUPPLIER, suppliedProducts: [] }]);

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
      expect(result.productsSupplied).toEqual(['Widget', 'Gadget']);
    });

    it('throws NotFoundException when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────
  describe('create()', () => {
    it('creates supplier without touching products when productsSupplied is empty', async () => {
      mockPrisma.supplier.create.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplier.findUnique.mockResolvedValue({ ...RAW_SUPPLIER, suppliedProducts: [] });

      await service.create({ name: 'Acme', contact: 'J', email: 'a@b.com', address: '123' });

      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
      expect(mockProductsService.createFromSupplierName).not.toHaveBeenCalled();
    });

    it('auto-creates a product for each new name in productsSupplied', async () => {
      mockPrisma.supplier.create.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.product.findMany.mockResolvedValue([]); // nothing linked yet
      mockPrisma.product.findFirst.mockResolvedValue(null); // no unlinked match

      await service.create({
        name: 'Acme', contact: 'J', email: 'a@b.com', address: '123',
        productsSupplied: ['Widget', 'Gadget'],
      });

      expect(mockProductsService.createFromSupplierName).toHaveBeenCalledTimes(2);
      expect(mockProductsService.createFromSupplierName).toHaveBeenCalledWith('sup-1', 'Widget');
      expect(mockProductsService.createFromSupplierName).toHaveBeenCalledWith('sup-1', 'Gadget');
    });

    it('links an existing unlinked product instead of creating a duplicate', async () => {
      mockPrisma.supplier.create.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.supplier.findUnique.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-9', name: 'Widget' });

      await service.create({
        name: 'Acme', contact: 'J', email: 'a@b.com', address: '123',
        productsSupplied: ['Widget'],
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-9' },
        data: { supplierId: 'sup-1' },
      });
      expect(mockProductsService.createFromSupplierName).not.toHaveBeenCalled();
    });
  });

  // ── update ─────────────────────────────────────────────────
  describe('update()', () => {
    it('updates supplier fields', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValueOnce(RAW_SUPPLIER).mockResolvedValueOnce(RAW_SUPPLIER);
      mockPrisma.supplier.update.mockResolvedValue({ ...RAW_SUPPLIER, name: 'Updated Corp' });

      await service.update('sup-1', { name: 'Updated Corp' });

      expect(mockPrisma.supplier.update).toHaveBeenCalled();
    });

    it('unlinks products whose name is no longer in the list', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValueOnce(RAW_SUPPLIER).mockResolvedValueOnce(RAW_SUPPLIER);
      mockPrisma.supplier.update.mockResolvedValue(RAW_SUPPLIER);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', name: 'Widget' },
        { id: 'prod-2', name: 'Gadget' },
      ]);

      await service.update('sup-1', { productsSupplied: ['Widget'] });

      expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['prod-2'] } },
        data: { supplierId: null },
      });
    });

    it('does NOT touch product links when productsSupplied is not in the DTO', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValueOnce(RAW_SUPPLIER).mockResolvedValueOnce(RAW_SUPPLIER);
      mockPrisma.supplier.update.mockResolvedValue(RAW_SUPPLIER);

      await service.update('sup-1', { name: 'Only Name Change' });

      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.product.updateMany).not.toHaveBeenCalled();
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
