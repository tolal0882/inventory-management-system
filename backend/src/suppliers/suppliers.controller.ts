import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  findAll() { return this.suppliersService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.suppliersService.findOne(id); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager', 'Inventory_Staff')
  create(@Body() dto: CreateSupplierDto) { return this.suppliersService.create(dto); }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager', 'Inventory_Staff')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) { return this.suppliersService.remove(id); }
}
