import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findMany:  jest.fn(),
    findUnique:jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
};

const BASE_USER = {
  id: 'u-1', name: 'Bob', email: 'bob@example.com',
  role: 'Inventory_Staff', status: 'Active',
  workplace: 'WH-A', department: 'Ops', createdAt: new Date(),
};

// ── Suite ─────────────────────────────────────────────────────
describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────
  describe('findAll()', () => {
    it('Admin: queries with empty where (sees all users)', async () => {
      mockPrisma.user.findMany.mockResolvedValue([BASE_USER]);

      await service.findAll('Admin');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('Warehouse_Manager: queries only Inventory_Staff', async () => {
      mockPrisma.user.findMany.mockResolvedValue([BASE_USER]);

      await service.findAll('Warehouse_Manager');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'Inventory_Staff' } })
      );
    });

    it('Auditor: queries with empty where (sees all)', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll('Auditor');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });

  // ── findOne ────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns a user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      const result = await service.findOne('u-1');

      expect(result.id).toBe('u-1');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────
  describe('create()', () => {
    it('Admin creates a user with specified role and Active status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...BASE_USER, role: 'Auditor', status: 'Active' });

      const result = await service.create(
        { name: 'Carol', email: 'carol@example.com', password: 'pass123', role: 'Auditor' },
        'Admin',
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'Auditor', status: 'Active' }),
        })
      );
    });

    it('Warehouse_Manager always creates Inventory_Staff with Pending status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...BASE_USER, role: 'Inventory_Staff', status: 'Pending' });

      await service.create(
        { name: 'Dave', email: 'dave@example.com', password: 'pass123', role: 'Admin' }, // role ignored
        'Warehouse_Manager',
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'Inventory_Staff', status: 'Pending' }),
        })
      );
    });

    it('hashes the password before saving', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(BASE_USER);

      await service.create(
        { name: 'Eve', email: 'eve@example.com', password: 'mySecret', role: 'Inventory_Staff' },
        'Admin',
      );

      const savedPassword = mockPrisma.user.create.mock.calls[0][0].data.password;
      expect(savedPassword).not.toBe('mySecret');
      expect(bcrypt.compareSync('mySecret', savedPassword)).toBe(true);
    });

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await expect(service.create(
        { name: 'Dup', email: 'bob@example.com', password: 'pw', role: 'Inventory_Staff' },
        'Admin',
      )).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ── approve ────────────────────────────────────────────────
  describe('approve()', () => {
    it('sets status to Active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...BASE_USER, status: 'Pending' });
      mockPrisma.user.update.mockResolvedValue({ ...BASE_USER, status: 'Active' });

      const result = await service.approve('u-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'Active' } })
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.approve('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  // ── requestDelete ──────────────────────────────────────────
  describe('requestDelete()', () => {
    it('sets status to PendingDeletion for Inventory_Staff', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER); // role = Inventory_Staff
      mockPrisma.user.update.mockResolvedValue({ ...BASE_USER, status: 'PendingDeletion' });

      await service.requestDelete('u-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PendingDeletion' } })
      );
    });

    it('throws ForbiddenException when trying to delete non-Inventory_Staff user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...BASE_USER, role: 'Admin' });

      await expect(service.requestDelete('u-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when trying to delete Warehouse_Manager', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...BASE_USER, role: 'Warehouse_Manager' });

      await expect(service.requestDelete('u-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ── cancelDelete ───────────────────────────────────────────
  describe('cancelDelete()', () => {
    it('sets status back to Active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...BASE_USER, status: 'PendingDeletion' });
      mockPrisma.user.update.mockResolvedValue({ ...BASE_USER, status: 'Active' });

      await service.cancelDelete('u-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'Active' } })
      );
    });
  });

  // ── update ─────────────────────────────────────────────────
  describe('update()', () => {
    it('updates user fields successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({ ...BASE_USER, name: 'Bob Updated' });

      const result = await service.update('u-1', { name: 'Bob Updated' });

      expect(result.name).toBe('Bob Updated');
    });

    it('hashes password when updating it', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(BASE_USER);

      await service.update('u-1', { password: 'newSecret' });

      const savedPassword = mockPrisma.user.update.mock.calls[0][0].data.password;
      expect(bcrypt.compareSync('newSecret', savedPassword)).toBe(true);
    });

    it('throws ConflictException when new email is taken by another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);
      mockPrisma.user.findFirst.mockResolvedValue({ ...BASE_USER, id: 'u-2' }); // another user

      await expect(service.update('u-1', { email: 'taken@example.com' }))
        .rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────
  describe('remove()', () => {
    it('deletes the user and returns success message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);
      mockPrisma.user.delete.mockResolvedValue(BASE_USER);

      const result = await service.remove('u-1');

      expect(result.message).toBe('User deleted successfully');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u-1' } });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
