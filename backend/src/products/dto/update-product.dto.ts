import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsNumber() @Min(0) stockQuantity?: number;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsEnum(['Active', 'Inactive']) status?: string;
  @IsOptional() @IsString() expirationDate?: string;
  @IsOptional() @IsBoolean() hasExpiration?: boolean;
  @IsOptional() @IsString() supplierId?: string;
}
