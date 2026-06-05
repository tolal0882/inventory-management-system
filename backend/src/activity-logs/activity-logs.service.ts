import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, action?: string) {
    return this.prisma.userActivityLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action: action as any }),
      },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.userActivityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
