import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

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
}
