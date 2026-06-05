import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Auditor')
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private activityLogsService: ActivityLogsService) {}

  @Get()
  findAll(@Query('userId') userId?: string, @Query('action') action?: string) {
    return this.activityLogsService.findAll(userId, action);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.activityLogsService.findByUser(userId);
  }
}
