import { Test, TestingModule } from '@nestjs/testing';
import { ParentItemsService } from './parent-items.service';
import { PrismaService } from '../prisma.service';

describe('ParentItemsService', () => {
  let service: ParentItemsService;

  const mockPrismaService = {
    parentItem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentItemsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ParentItemsService>(ParentItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
