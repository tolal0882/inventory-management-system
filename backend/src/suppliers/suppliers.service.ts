import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      include: { suppliedProducts: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return suppliers.map(s => ({
      ...s,
      productsSupplied: s.suppliedProducts.map(p => p.name),
    }));
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { suppliedProducts: true },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return { ...supplier, productsSupplied: supplier.suppliedProducts.map(p => p.name) };
  }

  async create(dto: CreateSupplierDto) {
    const { productsSupplied, ...rest } = dto;
    const supplier = await this.prisma.supplier.create({ data: rest });

    if (productsSupplied?.length) {
      await this.syncProductsSupplied(supplier.id, productsSupplied);
    }

    return this.findOne(supplier.id);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    const { productsSupplied, ...rest } = dto;

    const supplier = await this.prisma.supplier.update({ where: { id }, data: rest });

    if (productsSupplied !== undefined) {
      await this.syncProductsSupplied(id, productsSupplied);
    }

    return this.findOne(supplier.id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Supplier deleted successfully' };
  }

  // Reconciles this supplier's "Products Supplied" name list against the
  // actual Product records linked via supplierId: names no longer in the
  // list get unlinked (not deleted), names not yet linked either adopt a
  // matching unlinked product or get auto-created (SKU auto, rest blank).
  private async syncProductsSupplied(supplierId: string, names: string[]) {
    const wantedByLower = new Map<string, string>();
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      const lower = name.toLowerCase();
      if (!wantedByLower.has(lower)) wantedByLower.set(lower, name);
    }
    const wanted = [...wantedByLower.values()];
    const wantedLower = new Set(wantedByLower.keys());

    const currentlyLinked = await this.prisma.product.findMany({
      where: { supplierId },
      select: { id: true, name: true },
    });

    const toUnlink = currentlyLinked.filter(p => !wantedLower.has(p.name.toLowerCase()));
    if (toUnlink.length) {
      await this.prisma.product.updateMany({
        where: { id: { in: toUnlink.map(p => p.id) } },
        data: { supplierId: null },
      });
    }

    const alreadyLinkedLower = new Set(
      currentlyLinked
        .filter(p => wantedLower.has(p.name.toLowerCase()))
        .map(p => p.name.toLowerCase()),
    );

    for (const name of wanted) {
      if (alreadyLinkedLower.has(name.toLowerCase())) continue;

      const unlinkedMatch = await this.prisma.product.findFirst({
        where: { supplierId: null, name: { equals: name, mode: 'insensitive' } },
      });

      if (unlinkedMatch) {
        await this.prisma.product.update({
          where: { id: unlinkedMatch.id },
          data: { supplierId },
        });
      } else {
        await this.productsService.createFromSupplierName(supplierId, name);
      }
    }
  }
}
