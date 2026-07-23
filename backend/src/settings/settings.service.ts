import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SYSTEM_SETTINGS_ID = 'system';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return this.prisma.systemSettings.upsert({
      where: { id: SYSTEM_SETTINGS_ID },
      update: {},
      create: { id: SYSTEM_SETTINGS_ID },
    });
  }

  async update(dto: UpdateSettingsDto) {
    return this.prisma.systemSettings.upsert({
      where: { id: SYSTEM_SETTINGS_ID },
      update: dto,
      create: { id: SYSTEM_SETTINGS_ID, ...dto },
    });
  }
}
