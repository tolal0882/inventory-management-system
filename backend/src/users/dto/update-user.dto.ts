import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['Admin', 'Inventory_Staff', 'Warehouse_Manager', 'Auditor'])
  role?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive', 'Pending', 'PendingDeletion'])
  status?: string;

  @IsOptional()
  @IsString()
  workplace?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  lowStockAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  orderNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  sessionTimeoutMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ipWhitelist?: string;

  @IsOptional()
  @IsBoolean()
  auditLoggingEnabled?: boolean;
}
