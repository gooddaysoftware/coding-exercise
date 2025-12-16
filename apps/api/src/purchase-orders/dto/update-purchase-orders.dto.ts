import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase-orders.dto';

export class UpdatePurchaseOrdersV2Dto extends PartialType(CreatePurchaseOrderDto) {}
