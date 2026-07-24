import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() contact: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() address: string;
  @IsOptional() @IsArray() @IsString({ each: true }) productsSupplied?: string[];
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() contact?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) productsSupplied?: string[];
}
