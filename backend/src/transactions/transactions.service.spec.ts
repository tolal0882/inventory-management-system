import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  stockTransaction: {
    findMany:  jest.fn(),
    findUnique:jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    update:     jest.fn(),
  },
  $transaction: jest.fn(),
};

const PRODUCT = {
  id: 'prod-1',
  name: 'Widget',
  sku: 'SKU-001',
  stockQuantity: 100,
  minStock: 10,
};

const TX_PENDING_IN = {
  id: 'tx-1',
  productId: 'prod-1',
  productName: 'Widget',
  type: 'IN',
  quantity: 30,
  status: 'Pending',
  userId: 'u-1',
  userName: 'Alice',
  warehouse: 'WH-A',
  note: null,
  date: new Date(),
};

const TX_PENDING_OUT = { ...TX_PENDING_IN, id: 'tx-2', type: 'OUT', quantity: 20 };
const TX_SHRINKAGE   = { ...TX_PENDING_IN, id: 'tx-3', type: 'SHRINKAGE', quantity: 5 };
const TX_APPROVED    = { ...TX_PENDING_IN, id: 'tx-4', status: 'Approved' };

// ── Suite ─────────────────────────────────────────────────────
describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns all transactions with no filters', async () => {
      mockPrisma.stockTransaction.findMany.mockResolvedValue([TX_PENDING_IN]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.stockTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('filters by productId', async () => {
      mockPrisma.stockTransaction.findMany.mockResolvedValue([]);

      await service.findAll('prod-1');

      expect(mockPrisma.stockTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: 'prod-1' } })
      );
    });

    it('filters by type', async () => {
      mockPrisma.stockTransaction.findMany.mockResolvedValue([]);

      await service.findAll(undefined, 'IN');

      expect(mockPrisma.stockTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: 'IN' } })
      );
    });

    it('filters by status', async () => {
      mockPrisma.stockTransaction.findMany.mockResolvedValue([]);

      await service.findAll(undefined, undefined, 'Pending');

      expect(mockPrisma.stockTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'Pending' } })
      );
    });
  });

  // ── findOne ────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns a transaction when found', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_IN);

      const result = await service.findOne('tx-1');

      expect(result.id).toBe('tx-1');
    });

    it('throws NotFoundException when transaction not found', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────
  describe('create()', () => {
    it('creates a transaction with Pending status regardless of input', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      mockPrisma.stockTransaction.create.mockResolvedValue(TX_PENDING_IN);

      const result = await service.create(
        { productId: 'prod-1', type: 'IN', quantity: 30, warehouse: 'WH-A' },
        'u-1', 'Alice',
      );

      const createData = mockPrisma.stockTransaction.create.mock.calls[0][0].data;
      expect(createData.status).toBe('Pending');
    });

    it('uses product name from DB in the transaction record', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      mockPrisma.stockTransaction.create.mockResolvedValue(TX_PENDING_IN);

      await service.create(
        { productId: 'prod-1', type: 'IN', quantity: 5, warehouse: 'WH-A' },
        'u-1', 'Alice',
      );

      const createData = mockPrisma.stockTransaction.create.mock.calls[0][0].data;
      expect(createData.productName).toBe('Widget');
    });

    it('throws NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.create(
        { productId: 'ghost', type: 'IN', quantity: 5, warehouse: 'WH-A' },
        'u-1', 'Alice',
      )).rejects.toThrow(NotFoundException);

      expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
    });
  });

  // ── updateStatus ───────────────────────────────────────────
  describe('updateStatus()', () => {
    it('approving an IN transaction increments stock via $transaction', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_IN);
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT);
      const updatedTx = { ...TX_PENDING_IN, status: 'Approved' };
      mockPrisma.$transaction.mockResolvedValue([updatedTx, PRODUCT]);

      const result = await service.updateStatus('tx-1', { status: 'Approved' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const ops = mockPrisma.$transaction.mock.calls[0][0];
      // Two operations: update transaction + update product stock
      expect(ops).toHaveLength(2);
    });

    it('approving an OUT transaction decrements stock', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_OUT);
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT); // stock: 100, need: 20 — OK
      const updatedTx = { ...TX_PENDING_OUT, status: 'Approved' };
      mockPrisma.$transaction.mockResolvedValue([updatedTx, PRODUCT]);

      await service.updateStatus('tx-2', { status: 'Approved' });

      const stockUpdateOp = mockPrisma.$transaction.mock.calls[0][0][1];
      // The second prisma call should be a product.update with a negative increment
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stockQuantity: { increment: -20 } },
        })
      );
    });

    it('approving a SHRINKAGE transaction decrements stock', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_SHRINKAGE);
      mockPrisma.product.findUnique.mockResolvedValue(PRODUCT); // stock: 100 > 5
      mockPrisma.$transaction.mockResolvedValue([{ ...TX_SHRINKAGE, status: 'Approved' }, PRODUCT]);

      await service.updateStatus('tx-3', { status: 'Approved' });

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stockQuantity: { increment: -5 } },
        })
      );
    });

    it('throws BadRequestException when approving OUT with insufficient stock', async () => {
      const lowStock = { ...PRODUCT, stockQuantity: 5 };
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_OUT); // needs 20
      mockPrisma.product.findUnique.mockResolvedValue(lowStock); // only 5

      await expect(service.updateStatus('tx-2', { status: 'Approved' }))
        .rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when approving SHRINKAGE with insufficient stock', async () => {
      const lowStock = { ...PRODUCT, stockQuantity: 3 };
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_SHRINKAGE); // needs 5
      mockPrisma.product.findUnique.mockResolvedValue(lowStock); // only 3

      await expect(service.updateStatus('tx-3', { status: 'Approved' }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejecting a transaction does NOT touch stock', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_OUT);
      mockPrisma.stockTransaction.update.mockResolvedValue({ ...TX_PENDING_OUT, status: 'Rejected' });

      await service.updateStatus('tx-2', { status: 'Rejected' });

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('does not update stock when approving an already-approved transaction', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_APPROVED); // already Approved
      mockPrisma.stockTransaction.update.mockResolvedValue(TX_APPROVED);

      await service.updateStatus('tx-4', { status: 'Approved' });

      // Because status !== 'Pending', it falls through to the basic update — no $transaction
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('ghost', { status: 'Approved' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── update ─────────────────────────────────────────────────
  describe('update()', () => {
    it('updates allowed fields (quantity, warehouse, note)', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_IN);
      mockPrisma.stockTransaction.update.mockResolvedValue({ ...TX_PENDING_IN, quantity: 50 });

      const result = await service.update('tx-1', { quantity: 50, note: 'Updated' });

      expect(mockPrisma.stockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: 50, note: 'Updated' },
        })
      );
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { quantity: 10 })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────
  describe('remove()', () => {
    it('deletes the transaction and returns success message', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(TX_PENDING_IN);
      mockPrisma.stockTransaction.delete.mockResolvedValue(TX_PENDING_IN);

      const result = await service.remove('tx-1');

      expect(result.message).toBe('Transaction deleted successfully');
    });

    it('throws NotFoundException when transaction does not exist', async () => {
      mockPrisma.stockTransaction.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});
