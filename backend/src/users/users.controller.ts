import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('Admin', 'Auditor', 'Warehouse_Manager')
  findAll(@Req() req: any) {
    return this.usersService.findAll(req.user.role);
  }

  @Get(':id')
  @Roles('Admin', 'Auditor')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('Admin', 'Warehouse_Manager')
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.usersService.create(dto, req.user.role);
  }

  @Put(':id/approve')
  @Roles('Admin')
  approve(@Param('id') id: string) {
    return this.usersService.approve(id);
  }

  @Put(':id/request-delete')
  @Roles('Warehouse_Manager')
  requestDelete(@Param('id') id: string) {
    return this.usersService.requestDelete(id);
  }

  @Put(':id/cancel-delete')
  @Roles('Admin')
  cancelDelete(@Param('id') id: string) {
    return this.usersService.cancelDelete(id);
  }

  @Put(':id')
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
