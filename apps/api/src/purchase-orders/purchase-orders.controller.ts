import {Body, Controller, Get, Param, Patch, Post, Query} from '@nestjs/common';
import {PurchaseOrdersService} from './purchase-orders.service';
import {PurchaseOrders as PurchaseOrdersModel} from '@prisma/client';
import {CreatePurchaseOrderDto} from './dto/create-purchase-orders.dto';
import {UpdatePurchaseOrdersV2Dto} from './dto/update-purchase-orders.dto';
import {QueryPurchaseOrdersDto} from './dto/query-purchase-orders.dto';
import {Prisma} from '@prisma/client';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {
  }

  // TODO: add parameter validation
  @Get(':id')
  async getPurchaseOrderById(
    @Param('id') id: string
  ): Promise<PurchaseOrdersModel | null> {
    return this.purchaseOrdersService.purchaseOrder({ id: Number(id) });
  }

  @Get()
  async getPurchaseOrders(
    @Query() query: QueryPurchaseOrdersDto
  ): Promise<PurchaseOrdersModel[]> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'asc',
      vendor_name,
      order_date_from,
      order_date_to,
      expected_delivery_date_from,
      expected_delivery_date_to,
    } = query;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Build orderBy clause
    const orderBy: Prisma.PurchaseOrdersOrderByWithRelationInput | undefined = sortBy
      ? { [sortBy]: sortOrder }
      : undefined;

    // Build where clause for filtering
    const where: Prisma.PurchaseOrdersWhereInput = {};

    if (vendor_name) {
      where.vendor_name = {
        contains: vendor_name,
      };
    }

    if (order_date_from || order_date_to) {
      where.order_date = {};
      if (order_date_from) {
        where.order_date.gte = new Date(order_date_from);
      }
      if (order_date_to) {
        where.order_date.lte = new Date(order_date_to);
      }
    }

    if (expected_delivery_date_from || expected_delivery_date_to) {
      where.expected_delivery_date = {};
      if (expected_delivery_date_from) {
        where.expected_delivery_date.gte = new Date(expected_delivery_date_from);
      }
      if (expected_delivery_date_to) {
        where.expected_delivery_date.lte = new Date(expected_delivery_date_to);
      }
    }

    return this.purchaseOrdersService.purchaseOrders({
      skip,
      take,
      orderBy,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Post()
  async createPurchaseOrder(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto
  ): Promise<PurchaseOrdersModel> {
    const { vendor_name, order_date, expected_delivery_date, incoterms, line_items } = createPurchaseOrderDto;

    return this.purchaseOrdersService.createPurchaseOrder({
      vendor_name,
      order_date,
      expected_delivery_date,
      incoterms,
      purchase_order_line_items: {
        create: line_items.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      },
    });
  }

  @Patch(':id')
  async updatePurchaseOrder(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrdersV2Dto
  ): Promise<PurchaseOrdersModel> {
    const { line_items, ...updateData } = updatePurchaseOrderDto;

    return this.purchaseOrdersService.updatePurchaseOrder({
      where: { id: Number(id) },
      data: {
        ...updateData,
        ...(line_items && {
          purchase_order_line_items: {
            deleteMany: {},
            create: line_items.map(item => ({
              item_id: item.item_id,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
            })),
          },
        }),
      },
    });
  }
}
