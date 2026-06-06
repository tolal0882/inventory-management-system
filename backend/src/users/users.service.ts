import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const SELECT_USER = {
  id: true, name: true, email: true, role: true, status: true,
  workplace: true, department: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(requesterRole?: string) {
    const where = requesterRole === 'Warehouse_Manager'
      ? { role: UserRole.Inventory_Staff }
      : {};
    return this.prisma.user.findMany({
      where,
      select: SELECT_USER,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SELECT_USER });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto, creatorRole?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');
    const hashed = await bcrypt.hash(dto.password, 10);
    const { role, ...rest } = dto;
    const isWM = creatorRole === 'Warehouse_Manager';
    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashed,
        role: isWM ? UserRole.Inventory_Staff : (role as UserRole),
        status: isWM ? UserStatus.Pending : UserStatus.Active,
      },
      select: SELECT_USER,
    });
  }

  async approve(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.Active },
      select: SELECT_USER,
    });
  }

  async requestDelete(id: string) {
    const user = await this.findOne(id);
    if (user.role !== UserRole.Inventory_Staff) {
      throw new ForbiddenException('Can only request deletion of Inventory Staff users');
    }
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.PendingDeletion },
      select: SELECT_USER,
    });
  }

  async cancelDelete(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.Active },
      select: SELECT_USER,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const exists = await this.prisma.user.findFirst({ where: { email: dto.email, NOT: { id } } });
      if (exists) throw new ConflictException('Email already in use');
    }
    const { role, status, password, ...rest } = dto;
    const data: any = { ...rest };
    if (role) data.role = role as UserRole;
    if (status) data.status = status as UserStatus;
    if (password) data.password = await bcrypt.hash(password, 10);
    return this.prisma.user.update({ where: { id }, data, select: SELECT_USER });
  }

  async remove(id: string) {
    await this.findOne(id);

    const [txCount, poCount, invCount] = await Promise.all([
      this.prisma.stockTransaction.count({ where: { userId: id } }),
      this.prisma.purchaseOrder.count({ where: { createdById: id } }),
      this.prisma.invoice.count({ where: { createdById: id } }),
    ]);

    if (txCount > 0 || poCount > 0 || invCount > 0) {
      throw new ConflictException(
        'Cannot delete user with existing transactions or records. Deactivate the user instead.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.userActivityLog.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);

    return { message: 'User deleted successfully' };
  }
}
