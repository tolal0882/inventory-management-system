import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      include: { products: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return suppliers.map(s => ({
      ...s,
      productsSupplied: s.products.map(p => p.productId),
    }));
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { products: { include: { product: true } } },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return { ...supplier, productsSupplied: supplier.products.map(p => p.productId) };
  }

  async create(dto: CreateSupplierDto) {
    const { productsSupplied, ...rest } = dto;
    return this.prisma.supplier.create({
      data: {
        ...rest,
        ...(productsSupplied?.length && {
          products: {
            create: productsSupplied.map(pid => ({ productId: pid })),
          },
        }),
      },
    });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    const { productsSupplied, ...rest } = dto;

    if (productsSupplied !== undefined) {
      await this.prisma.supplierProduct.deleteMany({ where: { supplierId: id } });
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...rest,
        ...(productsSupplied !== undefined && {
          products: {
            create: productsSupplied.map(pid => ({ productId: pid })),
          },
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Supplier deleted successfully' };
  }
}
