import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async clearData() {
    await this.prisma.$transaction([
      this.prisma.invoiceItem.deleteMany(),
      this.prisma.invoice.deleteMany(),
      this.prisma.purchaseOrder.deleteMany(),
      this.prisma.stockTransaction.deleteMany(),
      this.prisma.supplierProduct.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.supplier.deleteMany(),
      this.prisma.otpRecord.deleteMany(),
      this.prisma.userActivityLog.deleteMany(),
    ]);
    return { message: 'All inventory data has been cleared. User accounts were preserved.' };
  }
}
