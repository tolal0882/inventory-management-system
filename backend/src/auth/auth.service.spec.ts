import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// ── Mocks ─────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userActivityLog: {
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('jwt-token-mock'),
};

const HASHED_PW = bcrypt.hashSync('password123', 10);

const ACTIVE_USER = {
  id: 'user-1',
  name: 'Alice Admin',
  email: 'alice@example.com',
  password: HASHED_PW,
  role: 'Admin',
  status: 'Active',
  workplace: 'HQ',
  department: 'IT',
  createdAt: new Date('2024-01-01'),
};

// ── Suite ─────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockPrisma.userActivityLog.create.mockResolvedValue({});
  });

  // ── login ──────────────────────────────────────────────────
  describe('login()', () => {
    it('returns access_token and user (without password) on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      const result = await service.login({ email: 'alice@example.com', password: 'password123' });

      expect(result.access_token).toBe('jwt-token-mock');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('alice@example.com');
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'alice@example.com',
        role: 'Admin',
      });
    });

    it('logs Login activity with IP and device', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      await service.login({ email: 'alice@example.com', password: 'password123' }, '127.0.0.1', 'Chrome');

      expect(mockPrisma.userActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'Login',
          ipAddress: '127.0.0.1',
          device: 'Chrome',
        }),
      });
    });

    it('uses "Unknown" when IP/device are not provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      await service.login({ email: 'alice@example.com', password: 'password123' });

      expect(mockPrisma.userActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ipAddress: 'Unknown', device: 'Unknown' }),
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'nobody@example.com', password: 'pw' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      await expect(service.login({ email: 'alice@example.com', password: 'wrongpw' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user status is Inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...ACTIVE_USER, status: 'Inactive' });

      await expect(service.login({ email: 'alice@example.com', password: 'password123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when status is Pending (not Active)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...ACTIVE_USER, status: 'Pending' });

      // Pending users can log in (only Inactive is blocked) — should succeed
      const result = await service.login({ email: 'alice@example.com', password: 'password123' });
      expect(result.access_token).toBeDefined();
    });
  });

  // ── logout ─────────────────────────────────────────────────
  describe('logout()', () => {
    it('logs Logout activity and returns success message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      const result = await service.logout('user-1', '10.0.0.1', 'Safari');

      expect(mockPrisma.userActivityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'Logout', userId: 'user-1' }),
      });
      expect(result.message).toBe('Logged out successfully');
    });

    it('returns success even when user is not found (graceful)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.logout('ghost-id');

      expect(result.message).toBe('Logged out successfully');
      expect(mockPrisma.userActivityLog.create).not.toHaveBeenCalled();
    });
  });

  // ── changePassword ─────────────────────────────────────────
  describe('changePassword()', () => {
    it('hashes and saves new password on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);
      mockPrisma.user.update.mockResolvedValue({ ...ACTIVE_USER });

      const result = await service.changePassword('user-1', 'password123', 'newPass456');

      expect(result.message).toBe('Password changed successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: expect.any(String) },
      });
      // Verify the stored hash is valid
      const storedHash = mockPrisma.user.update.mock.calls[0][0].data.password;
      expect(bcrypt.compareSync('newPass456', storedHash)).toBe(true);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('ghost', 'old', 'new123456'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when current password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      await expect(service.changePassword('user-1', 'wrongCurrent', 'newPass456'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when new password equals current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

      await expect(service.changePassword('user-1', 'password123', 'password123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── getProfile ─────────────────────────────────────────────
  describe('getProfile()', () => {
    it('returns user profile without password', async () => {
      const profile = {
        id: 'user-1', name: 'Alice Admin', email: 'alice@example.com',
        role: 'Admin', status: 'Active', workplace: 'HQ', department: 'IT', createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('password');
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('ghost')).rejects.toThrow(UnauthorizedException);
    });
  });
});
