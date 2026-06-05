import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const thirtyDaysAhead = new Date(now);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const [
      products,
      totalSuppliers,
      pendingOrders,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.product.findMany({ where: { status: 'Active' } }),
      this.prisma.supplier.count(),
      this.prisma.purchaseOrder.count({ where: { status: { in: ['Draft', 'Sent'] } } }),
      this.prisma.stockTransaction.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const lowStockItems = products.filter(p => p.stockQuantity < p.minStock).length;
    const totalStockValue = products.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);

    const expiredItems = products.filter(
      p => p.hasExpiration && p.expirationDate && p.expirationDate < now
    ).length;

    const expiringItems = products.filter(
      p => p.hasExpiration && p.expirationDate &&
           p.expirationDate >= now && p.expirationDate <= thirtyDaysAhead
    ).length;

    const shrinkageThisMonth = recentTransactions
      .filter(t => t.type === 'SHRINKAGE')
      .reduce((sum, t) => sum + t.quantity, 0);

    return {
      totalProducts,
      totalStock,
      totalStockValue,
      lowStockItems,
      totalSuppliers,
      expiredItems,
      expiringItems,
      pendingOrders,
      shrinkageThisMonth,
      recentTransactions,
    };
  }

  async getStockMovement(months = 6) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const transactions = await this.prisma.stockTransaction.findMany({
      where: { date: { gte: start } },
      select: { type: true, quantity: true, date: true },
    });

    const buckets: Record<string, { month: string; stockIn: number; stockOut: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = { month: monthNames[d.getMonth()], stockIn: 0, stockOut: 0 };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets[key]) {
        if (t.type === 'IN') buckets[key].stockIn += t.quantity;
        else if (t.type === 'OUT') buckets[key].stockOut += t.quantity;
      }
    });

    return Object.values(buckets);
  }

  async getStockByCategory() {
    const products = await this.prisma.product.findMany({
      where: { status: 'Active' },
      select: { category: true, stockQuantity: true, costPrice: true },
    });

    const categoryMap: Record<string, { category: string; stock: number; value: number }> = {};
    products.forEach(p => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = { category: p.category, stock: 0, value: 0 };
      }
      categoryMap[p.category].stock += p.stockQuantity;
      categoryMap[p.category].value += p.stockQuantity * p.costPrice;
    });

    return Object.values(categoryMap);
  }
}
