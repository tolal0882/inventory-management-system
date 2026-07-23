import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOwnSettingsDto } from './dto/update-own-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // No @Roles — every authenticated user may edit their own settings.
  // Must stay above ':id' routes and must never accept an id param.
  @UseGuards(JwtAuthGuard)
  @Put('me/settings')
  updateMySettings(@Req() req: any, @Body() dto: UpdateOwnSettingsDto) {
    return this.usersService.updateOwnSettings(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Auditor', 'Warehouse_Manager')
  findAll(@Req() req: any) {
    return this.usersService.findAll(req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Auditor')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Warehouse_Manager')
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.usersService.create(dto, req.user.role);
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  approve(@Param('id') id: string) {
    return this.usersService.approve(id);
  }

  @Put(':id/request-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Warehouse_Manager')
  requestDelete(@Param('id') id: string) {
    return this.usersService.requestDelete(id);
  }

  @Put(':id/cancel-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  cancelDelete(@Param('id') id: string) {
    return this.usersService.cancelDelete(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
