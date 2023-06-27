import { Test, TestingModule } from '@nestjs/testing';
import { ParentItemsService } from './parent-items.service';

describe('ParentItemsService', () => {
  let service: ParentItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParentItemsService],
    }).compile();

    service = module.get<ParentItemsService>(ParentItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
