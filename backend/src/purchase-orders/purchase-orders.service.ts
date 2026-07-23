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

  private generateInvoiceNumber() {
    const now = new Date();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${now.getFullYear()}-${rand}`;
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

  async create(dto: CreatePurchaseOrderDto, userId: string, userName: string) {
    const orderNumber = this.generateOrderNumber();
    const expectedDelivery = new Date(dto.expectedDelivery);

    // Creating a PO immediately pulls it into Stock In/Out (as a pending
    // stock-in awaiting approval) and auto-generates the matching invoice.
    // Both stay in sync with the PO via updateStatus() in TransactionsService.
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          ...dto,
          orderNumber,
          expectedDelivery,
          status: 'Sent',
          createdById: userId,
        },
      });

      await tx.stockTransaction.create({
        data: {
          productId: dto.productId,
          productName: dto.productName,
          type: 'IN',
          quantity: dto.quantity,
          userId,
          userName,
          note: `Auto-generated from Purchase Order ${orderNumber}`,
          status: 'Pending',
          warehouse: 'Main Warehouse',
          purchaseOrderId: order.id,
        },
      });

      await tx.invoice.create({
        data: {
          invoiceNumber: this.generateInvoiceNumber(),
          supplierId: dto.supplierId,
          supplierName: dto.supplierName,
          invoiceDate: new Date(),
          dueDate: expectedDelivery,
          subtotal: dto.totalAmount,
          tax: 0,
          totalAmount: dto.totalAmount,
          status: 'Pending',
          notes: `Auto-generated from Purchase Order ${orderNumber}`,
          createdById: userId,
          purchaseOrderId: order.id,
          items: {
            create: [{
              productId: dto.productId,
              productName: dto.productName,
              quantity: dto.quantity,
              unitPrice: dto.unitPrice,
              totalPrice: dto.totalAmount,
            }],
          },
        },
      });

      return order;
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
