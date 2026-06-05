import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('status') status?: string) {
    return this.productsService.findAll(category, status);
  }

  @Get('low-stock')
  findLowStock() {
    return this.productsService.findLowStock();
  }

  @Get('expiring')
  findExpiring(@Query('days') days?: string) {
    return this.productsService.findExpiringSoon(days ? parseInt(days) : 30);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Warehouse_Manager')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
