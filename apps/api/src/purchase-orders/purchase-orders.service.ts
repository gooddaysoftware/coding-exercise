import { Injectable } from '@nestjs/common';
import { PurchaseOrders } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<PurchaseOrders[]> {
    return this.prisma.purchaseOrders.findMany({
      include: {
        purchase_order_line_items: true,
      },
    });
  }

  async findOne(id: number): Promise<PurchaseOrders> {
    return this.prisma.purchaseOrders.findUnique({
      where: {
        id: id,
      },
      include: {
        purchase_order_line_items: true,
      },
    });
  }
}
