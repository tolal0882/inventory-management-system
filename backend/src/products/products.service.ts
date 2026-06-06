import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, status?: string) {
    return this.prisma.product.findMany({
      where: {
        ...(category && { category }),
        ...(status && { status: status as UserStatus }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findLowStock() {
    const products = await this.prisma.product.findMany({ where: { status: UserStatus.Active } });
    return products.filter(p => p.stockQuantity < p.minStock);
  }

  async findExpiringSoon(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.prisma.product.findMany({
      where: { hasExpiration: true, expirationDate: { lte: cutoff }, status: UserStatus.Active },
    });
  }

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException(`SKU "${dto.sku}" already exists`);
    const { status, expirationDate, ...rest } = dto;
    return this.prisma.product.create({
      data: {
        ...rest,
        status: (status as UserStatus) ?? UserStatus.Active,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.sku) {
      const exists = await this.prisma.product.findFirst({ where: { sku: dto.sku, NOT: { id } } });
      if (exists) throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }
    const { status, expirationDate, ...rest } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status: status as UserStatus }),
        ...(expirationDate && { expirationDate: new Date(expirationDate) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const [txCount, poCount, invItemCount] = await Promise.all([
      this.prisma.stockTransaction.count({ where: { productId: id } }),
      this.prisma.purchaseOrder.count({ where: { productId: id } }),
      this.prisma.invoiceItem.count({ where: { productId: id } }),
    ]);

    if (txCount > 0 || poCount > 0 || invItemCount > 0) {
      throw new ConflictException(
        'Cannot delete product with existing transactions or records. Deactivate the product instead.',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted successfully' };
  }
}
