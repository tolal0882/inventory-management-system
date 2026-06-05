import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${year}-${rand}`;
  }

  async findAll(status?: string, supplierId?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(supplierId && { supplierId }),
      },
      include: {
        items: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(inv => ({
      ...inv,
      createdBy: inv.createdBy?.name || 'Unknown',
    }));
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        supplier: true,
        createdBy: { select: { name: true } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return {
      ...invoice,
      createdBy: invoice.createdBy?.name || 'Unknown',
    };
  }

  async create(dto: CreateInvoiceDto, userId: string) {
    const { items, ...rest } = dto;
    const invoice = await this.prisma.invoice.create({
      data: {
        ...rest,
        invoiceNumber: this.generateInvoiceNumber(),
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: new Date(dto.dueDate),
        status: (dto.status as any) || 'Draft',
        createdById: userId,
        items: { create: items },
      },
      include: {
        items: true,
        createdBy: { select: { name: true } },
      },
    });

    return {
      ...invoice,
      createdBy: invoice.createdBy?.name || 'Unknown',
    };
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.findOne(id);
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.invoiceDate && { invoiceDate: new Date(dto.invoiceDate) }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        status: dto.status as any,
      },
      include: {
        items: true,
        createdBy: { select: { name: true } },
      },
    });

    return {
      ...invoice,
      createdBy: invoice.createdBy?.name || 'Unknown',
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.invoice.delete({ where: { id } });
    return { message: 'Invoice deleted successfully' };
  }
}
