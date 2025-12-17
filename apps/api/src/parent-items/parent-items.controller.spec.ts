import { Test, TestingModule } from '@nestjs/testing';
import { ParentItemsController } from './parent-items.controller';
import { ParentItemsService } from './parent-items.service';
import { PrismaService } from '../prisma.service';

describe('ParentItemsController', () => {
  let controller: ParentItemsController;

  const mockPrismaService = {
    parentItem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentItemsController],
      providers: [
        ParentItemsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ParentItemsController>(ParentItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
