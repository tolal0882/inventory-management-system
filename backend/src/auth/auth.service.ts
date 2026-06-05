import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(dto: LoginDto, ip?: string, device?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.status === 'Inactive') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.userActivityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'Login',
        ipAddress: ip || 'Unknown',
        device: device || 'Unknown',
        location: 'Unknown',
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const { password: _, ...userWithoutPassword } = user;
    return { access_token: token, user: userWithoutPassword };
  }

  async logout(userId: string, ip?: string, device?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.prisma.userActivityLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'Logout',
          ipAddress: ip || 'Unknown',
          device: device || 'Unknown',
          location: 'Unknown',
        },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Password changed successfully' };
  }

  // ── Forgot Password: Step 1 ─────────────────────────────
  async requestOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('No account found with that email address.');

    // Invalidate all previous unused OTPs for this email
    await this.prisma.otpRecord.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 40 * 1000); // 40 seconds

    await this.prisma.otpRecord.create({ data: { email, code, expiresAt } });

    await this.emailService.sendOtpEmail(email, code, user.name);

    return { message: 'Verification code sent to your email.' };
  }

  // ── Forgot Password: Step 2 ─────────────────────────────
  async verifyOtp(email: string, code: string) {
    const otp = await this.prisma.otpRecord.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired verification code.');

    await this.prisma.otpRecord.update({ where: { id: otp.id }, data: { used: true } });
    return { verified: true };
  }

  // ── Forgot Password: Step 3 ─────────────────────────────
  async resetPassword(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('No account found with that email address.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, workplace: true, department: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
