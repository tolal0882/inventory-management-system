import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

// Fields a user may change about their own account — notification prefs and
// personal security settings. Never includes role/status/email/password:
// this DTO is reached via /users/me/settings, which resolves the target
// user from the JWT, not from a URL param, so it can be safe to expose to
// every authenticated role instead of Admin-only.
export class UpdateOwnSettingsDto {
  @IsOptional() @IsBoolean() lowStockAlerts?: boolean;
  @IsOptional() @IsBoolean() orderNotifications?: boolean;
  @IsOptional() @IsBoolean() pushNotifications?: boolean;
  @IsOptional() @IsBoolean() twoFactorEnabled?: boolean;

  @IsOptional() @IsInt() @Min(5) @Max(480) sessionTimeoutMinutes?: number | null;

  @IsOptional() @IsString() @MaxLength(500) ipWhitelist?: string;

  @IsOptional() @IsBoolean() auditLoggingEnabled?: boolean;
}
