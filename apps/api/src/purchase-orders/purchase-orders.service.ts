import {Injectable} from '@nestjs/common';
import {Prisma, PurchaseOrders} from "@prisma/client";
import {PrismaService} from "../prisma.service";

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async purchaseOrder(
    purchaseOrderWhereUniqueInput: Prisma.PurchaseOrdersWhereUniqueInput
  ): Promise<PurchaseOrders | null> {
    
    return this.prisma.purchaseOrders.findUnique({
      where: purchaseOrderWhereUniqueInput,
      include: {purchase_order_line_items: true},
    });
  }

  async purchaseOrders(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.PurchaseOrdersWhereUniqueInput;
      where?: Prisma.PurchaseOrdersWhereInput;
      orderBy?: Prisma.PurchaseOrdersOrderByWithRelationInput;
    }
  ): Promise<PurchaseOrders[]> {

    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.purchaseOrders.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { purchase_order_line_items: true },
    });
  }

  async countPurchaseOrders(
    where?: Prisma.PurchaseOrdersWhereInput
  ): Promise<number> {
    return this.prisma.purchaseOrders.count({ where });
  }

  async getDistinctVendorNames(): Promise<string[]> {
    const results = await this.prisma.purchaseOrders.findMany({
      distinct: ['vendor_name'],
      select: { vendor_name: true },
      orderBy: { vendor_name: 'asc' },
    });
    return results.map(r => r.vendor_name);
  }

  async createPurchaseOrder(
    data: Prisma.PurchaseOrdersCreateInput
  ): Promise<PurchaseOrders> {
    
    return this.prisma.purchaseOrders.create({
      data,
    });
  }

  async updatePurchaseOrder(
    params: {
      where: Prisma.PurchaseOrdersWhereUniqueInput;
      data: Prisma.PurchaseOrdersUpdateInput;
    }
  ): Promise<PurchaseOrders> {
    
    const { where, data } = params;
    
    return this.prisma.purchaseOrders.update({
      data,
      where,
    });
  }

  async deletePurchaseOrder(
    where: Prisma.PurchaseOrdersWhereUniqueInput
  ): Promise<PurchaseOrders> {
    
    return this.prisma.purchaseOrders.delete({
      where,
    });
  }
}
