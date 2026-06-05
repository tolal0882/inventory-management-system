import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats() { return this.dashboardService.getStats(); }

  @Get('stock-movement')
  getStockMovement(@Query('months') months?: string) {
    return this.dashboardService.getStockMovement(months ? parseInt(months) : 6);
  }

  @Get('stock-by-category')
  getStockByCategory() { return this.dashboardService.getStockByCategory(); }
}
