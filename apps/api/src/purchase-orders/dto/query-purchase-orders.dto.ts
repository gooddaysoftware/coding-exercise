import { IsOptional, IsString, IsInt, Min, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPurchaseOrdersDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // Sorting
  @IsOptional()
  @IsString()
  @IsIn(['vendor_name', 'order_date', 'expected_delivery_date', 'created_at', 'updated_at'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';

  // Filtering
  @IsOptional()
  @IsString()
  vendor_name?: string;

  @IsOptional()
  @IsDateString()
  order_date_from?: string;

  @IsOptional()
  @IsDateString()
  order_date_to?: string;

  @IsOptional()
  @IsDateString()
  expected_delivery_date_from?: string;

  @IsOptional()
  @IsDateString()
  expected_delivery_date_to?: string;
}
