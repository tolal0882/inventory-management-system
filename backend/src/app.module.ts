import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TransactionsModule } from './transactions/transactions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SuppliersModule,
    TransactionsModule,
    InvoicesModule,
    PurchaseOrdersModule,
    DashboardModule,
    ActivityLogsModule,
  ],
})
export class AppModule {}
