import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { NotFoundError } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

describe('PurchaseOrdersController', () => {
  let purchaseOrdersController: PurchaseOrdersController;

  const mockPurchaseOrdersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        {
          provide: PurchaseOrdersService,
          useValue: mockPurchaseOrdersService,
        },
      ],
    }).compile();

    purchaseOrdersController = module.get<PurchaseOrdersController>(
      PurchaseOrdersController
    );

    mockPurchaseOrdersService.findOne.mockClear();
    mockPurchaseOrdersService.findAll.mockClear();
  });

  it('should be defined', () => {
    expect(purchaseOrdersController).toBeDefined();
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

      jest
        .spyOn(mockPurchaseOrdersService, 'findAll')
        .mockResolvedValue(mockPOs);

      const result = await purchaseOrdersController.findAll();
      expect(result.length).toEqual(mockPOs.length);
      expect(result).toEqual(mockPOs);
      expect(mockPurchaseOrdersService.findAll).toBeCalledTimes(1);
    });

    it('should return an empty array if no purchase orders are found', async () => {
      jest.spyOn(mockPurchaseOrdersService, 'findAll').mockResolvedValue([]);

      const result = await purchaseOrdersController.findAll();
      expect(result).toEqual([]);
      expect(mockPurchaseOrdersService.findAll).toBeCalledTimes(1);
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

      mockPurchaseOrdersService.findOne.mockResolvedValue(mockPO);

      const result = await purchaseOrdersController.findOne(mockPO.id.toString());
      expect(result).toEqual(mockPO);
      expect(mockPurchaseOrdersService.findOne).toBeCalledTimes(1);
    });

    it('should throw exception if puchase order does not exist', async () => {
      mockPurchaseOrdersService.findOne.mockResolvedValue(null);

      const invalidId = 111;

      await expect(purchaseOrdersController.findOne(invalidId.toString())).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPurchaseOrdersService.findOne).toBeCalledTimes(1);
    });
  });
});
