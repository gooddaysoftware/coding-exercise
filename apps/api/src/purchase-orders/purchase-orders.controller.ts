import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PurchaseOrders } from '@prisma/client';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(): Promise<PurchaseOrders[]> {
    return this.purchaseOrdersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PurchaseOrders> {
    const purchaseOrder = await this.purchaseOrdersService.findOne(+id);
    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order with id ${id} does not exist.`);
    }
    return purchaseOrder;
  }
}
