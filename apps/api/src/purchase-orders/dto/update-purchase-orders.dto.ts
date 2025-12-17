import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase-orders.dto';

// Update DTO that excludes order_date (order date cannot be changed after creation)
export class UpdatePurchaseOrdersV2Dto extends PartialType(
  OmitType(CreatePurchaseOrderDto, ['order_date'] as const)
) {}
