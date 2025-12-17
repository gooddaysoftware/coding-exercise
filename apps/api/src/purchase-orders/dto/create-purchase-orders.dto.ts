import { IsDecimal, IsInt, IsString, IsNotEmpty, IsDateString, IsArray, Min, ValidateNested, IsOptional, IsIn, ArrayMinSize, registerDecorator, ValidationOptions, ValidationArguments, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemExistsConstraint } from '../validators/item-exists.validator';

// Custom validator for positive decimal values
export function IsPositiveDecimal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveDecimal',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          const numValue = Number(value);
          return typeof value === 'string' && !isNaN(numValue) && numValue > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a positive decimal number`;
        }
      }
    });
  };
}

// Custom validator for date relationship
export function IsAfterOrEqual(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterOrEqual',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];

          if (!value || !relatedValue) return true; // Skip if either date is missing (handled by @IsDateString)

          const date1 = new Date(relatedValue as string);
          const date2 = new Date(value as string);

          return date2 >= date1;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be on or after ${relatedPropertyName}`;
        }
      }
    });
  };
}

// Custom validator for date not before today
export function IsNotBeforeToday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotBeforeToday',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value) return true; // Skip if date is missing (handled by @IsDateString)

          const orderDate = new Date(value as string);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day

          return orderDate >= today;
        },
        defaultMessage() {
          return 'Order date cannot be before today';
        }
      }
    });
  };
}

export class CreateLineItemDto {
  @IsInt()
  @Validate(ItemExistsConstraint)
  item_id: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsDecimal()
  @IsPositiveDecimal()
  unit_cost: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  vendor_name: string;

  @IsDateString()
  @IsNotBeforeToday()
  order_date: string;

  @IsDateString()
  @IsAfterOrEqual('order_date', { message: 'Expected delivery date must be on or after the order date' })
  expected_delivery_date: string;

  @IsOptional()
  @IsString()
  @IsIn(['EXW', 'FOB', 'CIF', 'DDP', 'FCA'])
  incoterms?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one line item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  line_items: CreateLineItemDto[];
}
