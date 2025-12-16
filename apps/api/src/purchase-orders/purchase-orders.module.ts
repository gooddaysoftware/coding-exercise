import {Module} from '@nestjs/common';
import {PurchaseOrdersService} from './purchase-orders.service';
import {PurchaseOrdersController} from './purchase-orders.controller';
import {PrismaService} from "../prisma.service";
import {ItemExistsConstraint} from './validators/item-exists.validator';

@Module({
  imports: [],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PrismaService, ItemExistsConstraint],
})
export class PurchaseOrdersModule {
}
