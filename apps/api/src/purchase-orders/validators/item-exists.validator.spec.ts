import { ItemExistsConstraint } from './item-exists.validator';
import { PrismaService } from '../../prisma.service';

describe('ItemExistsConstraint', () => {
  let validator: ItemExistsConstraint;
  let prismaService: PrismaService;

  beforeEach(() => {
    // Mock PrismaService
    prismaService = {
      item: {
        findUnique: jest.fn(),
      },
    } as any;

    validator = new ItemExistsConstraint(prismaService);
  });

  it('should return true when item exists', async () => {
    const mockItem = {
      id: 1,
      name: 'Test Item',
      sku: 'TEST-001',
      price: '10.00',
      quantity: 100,
      parent_item_id: 1,
    };

    jest.spyOn(prismaService.item, 'findUnique').mockResolvedValue(mockItem as any);

    const result = await validator.validate(1, {} as any);

    expect(result).toBe(true);
    expect(prismaService.item.findUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

  it('should return false when item does not exist', async () => {
    jest.spyOn(prismaService.item, 'findUnique').mockResolvedValue(null);

    const result = await validator.validate(999, {} as any);

    expect(result).toBe(false);
    expect(prismaService.item.findUnique).toHaveBeenCalledWith({
      where: { id: 999 }
    });
  });

  it('should return false when database query fails', async () => {
    jest.spyOn(prismaService.item, 'findUnique').mockRejectedValue(new Error('Database error'));

    const result = await validator.validate(1, {} as any);

    expect(result).toBe(false);
  });

  it('should return correct error message', () => {
    const mockArgs = {
      value: 999,
      property: 'item_id',
      constraints: {},
      targetName: 'CreateLineItemDto',
      object: {},
    } as any;

    const message = validator.defaultMessage(mockArgs);

    expect(message).toBe('Item with id 999 does not exist');
  });
});
