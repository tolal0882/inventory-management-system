import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionStatusDto, UpdateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(productId?: string, type?: string, status?: string) {
    return this.prisma.stockTransaction.findMany({
      where: {
        ...(productId && { productId }),
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
      },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const tx = await this.prisma.stockTransaction.findUnique({
      where: { id },
      include: { product: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async create(dto: CreateTransactionDto, userId: string, userName: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Always create as Pending — stock only updates on Approval
    return this.prisma.stockTransaction.create({
      data: {
        productId: dto.productId,
        productName: product.name,
        type: dto.type as any,
        quantity: dto.quantity,
        userId,
        userName,
        note: dto.note,
        status: 'Pending',
        warehouse: dto.warehouse,
        fromWarehouse: dto.fromWarehouse,
        toWarehouse: dto.toWarehouse,
        shrinkageReason: dto.shrinkageReason as any,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateTransactionStatusDto) {
    const transaction = await this.findOne(id);

    if (dto.status === 'Approved' && transaction.status === 'Pending') {
      // Check sufficient stock for OUT/SHRINKAGE before approving
      if (transaction.type === 'OUT' || transaction.type === 'SHRINKAGE') {
        const product = await this.prisma.product.findUnique({
          where: { id: transaction.productId },
        });
        if (product && product.stockQuantity < transaction.quantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${product.stockQuantity}, Required: ${transaction.quantity}`
          );
        }
      }

      // Calculate stock change
      let stockDelta = 0;
      if (transaction.type === 'IN') stockDelta = transaction.quantity;
      if (transaction.type === 'OUT' || transaction.type === 'SHRINKAGE') stockDelta = -transaction.quantity;

      // Update transaction status and stock together atomically
      const ops: any[] = [
        this.prisma.stockTransaction.update({
          where: { id },
          data: { status: 'Approved' },
        }),
      ];

      if (stockDelta !== 0) {
        ops.push(
          this.prisma.product.update({
            where: { id: transaction.productId },
            data: { stockQuantity: { increment: stockDelta } },
          })
        );
      }

      const [updated] = await this.prisma.$transaction(ops);
      return updated;
    }

    // Rejected or other status change — no stock update
    return this.prisma.stockTransaction.update({
      where: { id },
      data: {
        status: dto.status as any,
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findOne(id);
    return this.prisma.stockTransaction.update({
      where: { id },
      data: {
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.warehouse !== undefined && { warehouse: dto.warehouse }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.productName !== undefined && { productName: dto.productName }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.stockTransaction.delete({ where: { id } });
    return { message: 'Transaction deleted successfully' };
  }
}
