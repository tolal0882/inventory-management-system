import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionStatusDto, UpdateTransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.findAll(productId, type, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Inventory_Staff', 'Warehouse_Manager')
  create(@Body() dto: CreateTransactionDto, @Req() req: any) {
    return this.transactionsService.create(dto, req.user.id, req.user.name);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTransactionStatusDto) {
    return this.transactionsService.updateStatus(id, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
