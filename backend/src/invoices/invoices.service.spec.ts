import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  invoice: {
    findMany:  jest.fn(),
    findUnique:jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
};

const RAW_INVOICE = {
  id: 'inv-1',
  invoiceNumber: 'INV-2024-1234',
  supplierId: 'sup-1',
  supplierName: 'Acme Corp',
  invoiceDate: new Date('2024-01-15'),
  dueDate: new Date('2024-02-15'),
  subtotal: 1000,
  tax: 100,
  totalAmount: 1100,
  status: 'Pending',
  notes: '',
  createdAt: new Date(),
  items: [{ id: 'item-1', description: 'Widget x10', quantity: 10, unitPrice: 100, total: 1000 }],
  createdBy: { name: 'Alice Admin' },
};

// ── Suite ─────────────────────────────────────────────────────
describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns invoices with createdBy as a string name', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([RAW_INVOICE]);

      const result = await service.findAll();

      expect(result[0].createdBy).toBe('Alice Admin');
    });

    it('falls back to "Unknown" when createdBy is null', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([{ ...RAW_INVOICE, createdBy: null }]);

      const result = await service.findAll();

      expect(result[0].createdBy).toBe('Unknown');
    });

    it('filters by status', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll('Paid');

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'Paid' } })
      );
    });

    it('filters by supplierId', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);

      await service.findAll(undefined, 'sup-1');

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { supplierId: 'sup-1' } })
      );
    });
  });

  // ── findOne ────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns a single invoice', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(RAW_INVOICE);

      const result = await service.findOne('inv-1');

      expect(result.id).toBe('inv-1');
      expect(result.createdBy).toBe('Alice Admin');
    });

    it('throws NotFoundException when invoice does not exist', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────
  describe('create()', () => {
    it('generates a unique invoice number (INV-YEAR-XXXX format)', async () => {
      mockPrisma.invoice.create.mockResolvedValue(RAW_INVOICE);

      await service.create({
        supplierId: 'sup-1',
        supplierName: 'Acme',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-15',
        subtotal: 1000, tax: 100, totalAmount: 1100,
        status: 'Draft',
        items: [{ productId: 'prod-1', productName: 'Widget', quantity: 1, unitPrice: 1000, totalPrice: 1000 }],
      }, 'user-1');

      const createData = mockPrisma.invoice.create.mock.calls[0][0].data;
      expect(createData.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('converts invoiceDate and dueDate strings to Date objects', async () => {
      mockPrisma.invoice.create.mockResolvedValue(RAW_INVOICE);

      await service.create({
        supplierId: 'sup-1',
        supplierName: 'Acme',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-15',
        subtotal: 1000, tax: 0, totalAmount: 1000,
        status: 'Draft',
        items: [],
      }, 'user-1');

      const createData = mockPrisma.invoice.create.mock.calls[0][0].data;
      expect(createData.invoiceDate).toBeInstanceOf(Date);
      expect(createData.dueDate).toBeInstanceOf(Date);
    });

    it('defaults status to Draft when not provided', async () => {
      mockPrisma.invoice.create.mockResolvedValue(RAW_INVOICE);

      await service.create({
        supplierId: 'sup-1',
        supplierName: 'Acme',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-15',
        subtotal: 100, tax: 0, totalAmount: 100,
        items: [],
      } as any, 'user-1');

      const createData = mockPrisma.invoice.create.mock.calls[0][0].data;
      expect(createData.status).toBe('Draft');
    });

    it('attaches createdById from the calling user', async () => {
      mockPrisma.invoice.create.mockResolvedValue(RAW_INVOICE);

      await service.create({
        supplierId: 'sup-1',
        supplierName: 'Acme',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-15',
        subtotal: 100, tax: 0, totalAmount: 100,
        status: 'Draft',
        items: [],
      }, 'user-99');

      const createData = mockPrisma.invoice.create.mock.calls[0][0].data;
      expect(createData.createdById).toBe('user-99');
    });
  });

  // ── update ─────────────────────────────────────────────────
  describe('update()', () => {
    it('updates invoice fields', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(RAW_INVOICE);
      mockPrisma.invoice.update.mockResolvedValue({ ...RAW_INVOICE, status: 'Paid' });

      const result = await service.update('inv-1', { status: 'Paid' });

      expect(mockPrisma.invoice.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when invoice does not exist', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { status: 'Paid' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────
  describe('remove()', () => {
    it('deletes invoice and returns success message', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(RAW_INVOICE);
      mockPrisma.invoice.delete.mockResolvedValue(RAW_INVOICE);

      const result = await service.remove('inv-1');

      expect(result.message).toBe('Invoice deleted successfully');
    });

    it('throws NotFoundException when invoice does not exist', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});
