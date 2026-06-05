import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.purchaseOrdersService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager')
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.purchaseOrdersService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
