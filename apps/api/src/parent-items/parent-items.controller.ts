import {Controller, Get} from '@nestjs/common';
import {ParentItemsService} from './parent-items.service';

@Controller('parent-items')
export class ParentItemsController {
  constructor(private readonly parentItemsService: ParentItemsService) {
  }

  @Get()
  findAll() {
    return this.parentItemsService.findAll();
  }
}
