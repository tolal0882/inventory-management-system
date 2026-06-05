import { Controller, Post, Get, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const device = req.headers['user-agent'];
    return this.authService.login(dto, ip, device);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const device = req.headers['user-agent'];
    return this.authService.logout(req.user.id, ip, device);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  // ── Forgot Password flow (no JWT required) ──────────────
  @Post('request-otp')
  @HttpCode(200)
  requestOtp(@Body() dto: { email: string }) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() dto: { email: string; code: string }) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: { email: string; newPassword: string }) {
    return this.authService.resetPassword(dto.email, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
