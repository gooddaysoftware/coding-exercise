import { Test, TestingModule } from '@nestjs/testing';
import { ParentItemsController } from './parent-items.controller';
import { ParentItemsService } from './parent-items.service';

describe('ParentItemsController', () => {
  let controller: ParentItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentItemsController],
      providers: [ParentItemsService],
    }).compile();

    controller = module.get<ParentItemsController>(ParentItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
