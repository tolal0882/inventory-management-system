import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsInt() @Min(0) @Max(200) lowStockThresholdPercent?: number;
  @IsOptional() @IsString() defaultCategory?: string;
}
