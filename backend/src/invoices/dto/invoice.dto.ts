import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsString() @IsNotEmpty() productName: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsNumber() @Min(0) totalPrice: number;
}

export class CreateInvoiceDto {
  @IsString() @IsNotEmpty() supplierId: string;
  @IsString() @IsNotEmpty() supplierName: string;
  @IsString() @IsNotEmpty() invoiceDate: string;
  @IsString() @IsNotEmpty() dueDate: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceItemDto) items: InvoiceItemDto[];
  @IsNumber() @Min(0) subtotal: number;
  @IsNumber() @Min(0) tax: number;
  @IsNumber() @Min(0) totalAmount: number;
  @IsOptional() @IsEnum(['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled']) status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() attachmentUrl?: string;
}

export class UpdateInvoiceDto {
  @IsOptional() @IsString() invoiceDate?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsEnum(['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled']) status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @IsNumber() @Min(0) tax?: number;
  @IsOptional() @IsNumber() @Min(0) totalAmount?: number;
}
