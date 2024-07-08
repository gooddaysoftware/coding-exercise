import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PrismaService } from '../prisma.service';

describe('PurchaseOrdersService', () => {
  let purchaseOrdersService: PurchaseOrdersService;

  const prismaMock = {
    purchaseOrders: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    purchaseOrdersService = module.get<PurchaseOrdersService>(
      PurchaseOrdersService
    );

    prismaMock.purchaseOrders.findUnique.mockClear();
    prismaMock.purchaseOrders.findMany.mockClear();
  });

  it('should be defined', () => {
    expect(purchaseOrdersService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of purchase orders', async () => {
      const mockPOs = [
        {
          id: 123,
          vendor_name: 'Test Vendor 1',
          order_date: new Date(2024, 5, 1),
          expected_delivery_date: new Date(2024, 8, 1),
        },
        {
          id: 456,
          vendor_name: 'Test Vendor 2',
          order_date: new Date(2024, 6, 1),
          expected_delivery_date: new Date(2024, 9, 1),
        },
      ];

      prismaMock.purchaseOrders.findMany.mockResolvedValue(mockPOs);

      const result = await purchaseOrdersService.findAll();
      expect(result.length).toEqual(mockPOs.length);
      expect(result).toEqual(mockPOs);
      expect(prismaMock.purchaseOrders.findMany).toBeCalledTimes(1);
      expect(prismaMock.purchaseOrders.findMany).toBeCalledWith({
        include: { purchase_order_line_items: true },
      });
    });

    it('should return an empty array if no purchase orders are found', async () => {
      prismaMock.purchaseOrders.findMany.mockResolvedValue([]);

      const result = await purchaseOrdersService.findAll();
      expect(result).toEqual([]);
      expect(prismaMock.purchaseOrders.findMany).toBeCalledTimes(1);
      expect(prismaMock.purchaseOrders.findMany).toBeCalledWith({
        include: { purchase_order_line_items: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a purchase order with the requested id', async () => {
      const mockPO = {
        id: 123,
        vendor_name: 'Test Vendor',
        order_date: new Date(2024, 5, 1),
        expected_delivery_date: new Date(2024, 8, 1),
        purchase_order_line_items: [
          {
            id: 1,
            purchase_order_id: 123,
            item_id: 1,
            quantity: 5,
            unit_cost: 8,
          },
        ],
      };

      prismaMock.purchaseOrders.findUnique.mockResolvedValue(mockPO);

      const result = await purchaseOrdersService.findOne(mockPO.id);
      expect(result).toEqual(mockPO);
      expect(prismaMock.purchaseOrders.findUnique).toBeCalledTimes(1);
      expect(prismaMock.purchaseOrders.findUnique).toBeCalledWith({
        where: { id: mockPO.id },
        include: { purchase_order_line_items: true },
      });
    });

    it('should return null if puchase order does not exist', async () => {
      prismaMock.purchaseOrders.findUnique.mockResolvedValue(null);

      const invalidId = 111;

      const result = await purchaseOrdersService.findOne(invalidId);
      expect(result).toBeNull();
      expect(prismaMock.purchaseOrders.findUnique).toBeCalledTimes(1);
      expect(prismaMock.purchaseOrders.findUnique).toBeCalledWith({
        where: { id: invalidId },
        include: { purchase_order_line_items: true },
      });
    });
  });
});
