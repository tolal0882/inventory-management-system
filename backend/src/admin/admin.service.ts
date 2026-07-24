import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BACKUP_VERSION = 1;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async clearData() {
    await this.prisma.$transaction([
      this.prisma.invoiceItem.deleteMany(),
      this.prisma.invoice.deleteMany(),
      this.prisma.purchaseOrder.deleteMany(),
      this.prisma.stockTransaction.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.supplier.deleteMany(),
      this.prisma.otpRecord.deleteMany(),
      this.prisma.userActivityLog.deleteMany(),
    ]);
    return { message: 'All inventory data has been cleared. User accounts were preserved.' };
  }

  // Backs up inventory data only — not users, OTP codes, or the activity
  // log — matching the same scope clearData() operates on.
  async backup() {
    const [suppliers, products, purchaseOrders, stockTransactions, invoices, systemSettings] =
      await Promise.all([
        this.prisma.supplier.findMany(),
        this.prisma.product.findMany(),
        this.prisma.purchaseOrder.findMany(),
        this.prisma.stockTransaction.findMany(),
        this.prisma.invoice.findMany({ include: { items: true } }),
        this.prisma.systemSettings.findUnique({ where: { id: 'system' } }),
      ]);

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: { suppliers, products, purchaseOrders, stockTransactions, invoices, systemSettings },
    };
  }

  async restore(backup: any) {
    if (!backup || backup.version !== BACKUP_VERSION || !backup.data) {
      throw new BadRequestException('Invalid or unsupported backup file.');
    }
    const { suppliers, products, purchaseOrders, stockTransactions, invoices, systemSettings } =
      backup.data;
    const arrays = { suppliers, products, purchaseOrders, stockTransactions, invoices };
    for (const [key, value] of Object.entries(arrays)) {
      if (!Array.isArray(value)) {
        throw new BadRequestException(`Invalid backup file: missing "${key}" array.`);
      }
    }

    const invoiceItems = invoices.flatMap((inv: any) =>
      (inv.items || []).map((item: any) => ({ ...item, invoiceId: inv.id })),
    );
    const invoicesWithoutItems = invoices.map(({ items, ...rest }: any) => rest);

    try {
      await this.prisma.$transaction([
        // Clear existing inventory data first (same scope as clearData)
        this.prisma.invoiceItem.deleteMany(),
        this.prisma.invoice.deleteMany(),
        this.prisma.purchaseOrder.deleteMany(),
        this.prisma.stockTransaction.deleteMany(),
        this.prisma.product.deleteMany(),
        this.prisma.supplier.deleteMany(),

        // Restore in dependency order: parents before children
        this.prisma.supplier.createMany({ data: suppliers }),
        this.prisma.product.createMany({ data: products }),
        this.prisma.purchaseOrder.createMany({ data: purchaseOrders }),
        this.prisma.stockTransaction.createMany({ data: stockTransactions }),
        this.prisma.invoice.createMany({ data: invoicesWithoutItems }),
        this.prisma.invoiceItem.createMany({ data: invoiceItems }),

        ...(systemSettings
          ? [
              this.prisma.systemSettings.upsert({
                where: { id: 'system' },
                update: systemSettings,
                create: systemSettings,
              }),
            ]
          : []),
      ]);
    } catch (err: any) {
      throw new BadRequestException(
        `Restore failed: ${err.message}. This usually means the backup references a user account that no longer exists — nothing was changed.`,
      );
    }

    return { message: 'Data restored from backup successfully.' };
  }
}
