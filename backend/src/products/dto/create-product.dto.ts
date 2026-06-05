import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @IsNumber()
  @Min(0)
  minStock: number;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsBoolean()
  hasExpiration?: boolean;
}
