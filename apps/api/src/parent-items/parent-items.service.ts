import {Injectable} from '@nestjs/common';
import {ParentItem} from "@prisma/client";
import {PrismaService} from "../prisma.service";

@Injectable()
export class ParentItemsService {
  constructor(private prisma: PrismaService) {
  }

  async findAll(): Promise<ParentItem[]> {
    return this.prisma.parentItem.findMany({include: {items: true}});
  }
}
