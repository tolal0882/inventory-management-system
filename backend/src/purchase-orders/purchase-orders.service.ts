import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNumber() {
    const now = new Date();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${rand}`;
  }

  async findAll(status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { ...(status && { status: status as any }) },
      include: { product: { select: { name: true, sku: true } }, supplier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { product: true, supplier: true, createdBy: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundException(`Purchase Order ${id} not found`);
    return order;
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    return this.prisma.purchaseOrder.create({
      data: {
        ...dto,
        orderNumber: this.generateOrderNumber(),
        expectedDelivery: new Date(dto.expectedDelivery),
        status: (dto.status as any) || 'Draft',
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    await this.findOne(id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.expectedDelivery && { expectedDelivery: new Date(dto.expectedDelivery) }),
        status: dto.status as any,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return { message: 'Purchase order deleted successfully' };
  }
}
