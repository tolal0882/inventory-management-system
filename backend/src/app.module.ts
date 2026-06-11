import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
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
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
