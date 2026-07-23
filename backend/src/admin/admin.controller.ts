import { Body, Controller, Delete, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Delete('clear-data')
  @Roles('Admin')
  clearData() {
    return this.adminService.clearData();
  }

  @Get('backup')
  @Roles('Admin')
  async backup(@Res() res: Response) {
    const data = await this.adminService.backup();
    const filename = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  @Post('restore')
  @Roles('Admin')
  restore(@Body() backup: any) {
    return this.adminService.restore(backup);
  }
}
