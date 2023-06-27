import {Module} from '@nestjs/common';
import {ParentItemsService} from './parent-items.service';
import {ParentItemsController} from './parent-items.controller';
import {PrismaService} from "../prisma.service";

@Module({
  imports: [],
  controllers: [ParentItemsController],
  providers: [ParentItemsService, PrismaService],
})
export class ParentItemsModule {
}
