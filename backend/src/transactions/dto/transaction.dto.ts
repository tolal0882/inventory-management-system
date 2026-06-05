import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsEnum(['IN', 'OUT', 'TRANSFER', 'SHRINKAGE']) type: string;
  @IsNumber() @Min(1) quantity: number;
  @IsString() @IsNotEmpty() warehouse: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() fromWarehouse?: string;
  @IsOptional() @IsString() toWarehouse?: string;
  @IsOptional() @IsEnum(['Damaged', 'Expired', 'Lost', 'Theft', 'Other']) shrinkageReason?: string;
}

export class UpdateTransactionStatusDto {
  @IsEnum(['Pending', 'Approved', 'Rejected']) status: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdateTransactionDto {
  @IsOptional() @IsNumber() @Min(1) quantity?: number;
  @IsOptional() @IsString() warehouse?: string;
  @IsOptional() @IsString() note?: string;
}
