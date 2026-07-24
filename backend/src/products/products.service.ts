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

  // Generates a unique "SKU-00001"-style code, skipping any numbers already taken.
  async generateSku() {
    const count = await this.prisma.product.count();
    let n = count + 1;
    let sku = `SKU-${String(n).padStart(5, '0')}`;
    while (await this.prisma.product.findUnique({ where: { sku } })) {
      n += 1;
      sku = `SKU-${String(n).padStart(5, '0')}`;
    }
    return sku;
  }

  // Creates a bare-bones product from a supplier's "Products Supplied" list:
  // only SKU (auto) and name are known, everything else is a placeholder
  // the user fills in later from the Products page.
  async createFromSupplierName(supplierId: string, name: string) {
    const sku = await this.generateSku();
    return this.prisma.product.create({
      data: {
        sku,
        name,
        category: 'Other',
        unit: 'Piece',
        costPrice: 0,
        stockQuantity: 0,
        minStock: 0,
        supplierId,
      },
    });
  }

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException(`SKU "${dto.sku}" already exists`);

    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException(`Supplier ${dto.supplierId} not found`);

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
    const { status, expirationDate, supplierId, ...rest } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status: status as UserStatus }),
        ...(expirationDate && { expirationDate: new Date(expirationDate) }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
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
