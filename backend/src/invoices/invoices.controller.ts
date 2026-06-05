import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('supplierId') supplierId?: string) {
    return this.invoicesService.findAll(status, supplierId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager', 'Inventory_Staff')
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    return this.invoicesService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager', 'Inventory_Staff')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
