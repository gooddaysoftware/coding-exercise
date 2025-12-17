import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { PrismaService } from '../../prisma.service';

@ValidatorConstraint({ name: 'ItemExists', async: true })
@Injectable()
export class ItemExistsConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(itemId: number, _args: ValidationArguments) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { id: itemId }
      });
      return !!item;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Item with id ${args.value} does not exist`;
  }
}
