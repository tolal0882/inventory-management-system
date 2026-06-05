import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() contact: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() address: string;
  @IsOptional() productsSupplied?: string[];
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() contact?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() productsSupplied?: string[];
}
