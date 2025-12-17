import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from apps/api/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Seed faker for reproducible data
faker.seed(12345);

const prisma = new PrismaClient();

// Product categories with realistic item generators
const productCategories = [
  { name: 'T-Shirts', skuPrefix: 'TSH', priceRange: { min: 15, max: 45 } },
  { name: 'Jeans', skuPrefix: 'JNS', priceRange: { min: 40, max: 120 } },
  { name: 'Sneakers', skuPrefix: 'SNK', priceRange: { min: 60, max: 200 } },
  { name: 'Jackets', skuPrefix: 'JKT', priceRange: { min: 80, max: 250 } },
  { name: 'Accessories', skuPrefix: 'ACC', priceRange: { min: 10, max: 50 } },
];

const colors = ['Midnight Black', 'Ocean Blue', 'Forest Green', 'Crimson Red', 'Arctic White', 'Sunset Orange', 'Dusty Rose', 'Slate Gray'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const incoterms = ['FOB', 'CIF', 'DDP', 'EXW', 'DAP', 'FCA'];

function generateItemName(category: string): string {
  const style = faker.commerce.productAdjective();
  const color = faker.helpers.arrayElement(colors);
  return `${style} ${color} ${category.slice(0, -1)}`; // Remove plural 's'
}

function generatePrice(min: number, max: number): string {
  return faker.commerce.price({ min, max, dec: 2 });
}

async function main() {
  // Clear existing data
  await prisma.purchaseOrderLineItems.deleteMany();
  await prisma.purchaseOrders.deleteMany();
  await prisma.item.deleteMany();
  await prisma.parentItem.deleteMany();

  // Reset SQLite autoincrement sequences
  await prisma.$executeRawUnsafe(
    'DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?, ?)',
    'purchase_order_line_items',
    'purchase_orders',
    'items',
    'parent_items',
  );

  console.log('Seeding database with faker-generated data...\n');

  // Create parent items with varied items
  const allItems: { id: number; parentId: number; price: string }[] = [];
  let itemId = 1;

  for (let i = 0; i < productCategories.length; i++) {
    const category = productCategories[i];
    const itemCount = faker.number.int({ min: 3, max: 6 });
    const items: { name: string; sku: string; price: string; quantity: number }[] = [];

    for (let j = 0; j < itemCount; j++) {
      const price = generatePrice(category.priceRange.min, category.priceRange.max);
      items.push({
        name: generateItemName(category.name),
        sku: `${category.skuPrefix}-${faker.string.alphanumeric(6).toUpperCase()}`,
        price,
        quantity: faker.number.int({ min: 0, max: 100 }),
      });
    }

    const parent = await prisma.parentItem.create({
      data: {
        name: category.name,
        items: { create: items },
      },
      include: { items: true },
    });

    parent.items.forEach((item) => {
      allItems.push({ id: item.id, parentId: parent.id, price: item.price.toString() });
    });

    console.log(`Created "${category.name}" with ${items.length} items`);
    itemId += items.length;
  }

  console.log(`\nTotal: ${productCategories.length} parent items with ${allItems.length} items\n`);

  // Create purchase orders with realistic vendor names and dates
  const purchaseOrderCount = faker.number.int({ min: 8, max: 15 });
  const createdPOs: number[] = [];

  for (let i = 0; i < purchaseOrderCount; i++) {
    const orderDate = faker.date.between({
      from: new Date('2024-01-01'),
      to: new Date('2024-12-01'),
    });

    const deliveryDate = faker.date.between({
      from: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000), // At least 30 days later
      to: new Date(orderDate.getTime() + 120 * 24 * 60 * 60 * 1000), // Up to 120 days later
    });

    // Select random items for this PO (1-6 line items)
    const lineItemCount = faker.number.int({ min: 1, max: 6 });
    const selectedItems = faker.helpers.arrayElements(allItems, lineItemCount);

    const lineItems = selectedItems.map((item) => ({
      item_id: item.id,
      quantity: faker.number.int({ min: 10, max: 500 }),
      unit_cost: generatePrice(
        parseFloat(item.price) * 0.4,
        parseFloat(item.price) * 0.7,
      ), // Wholesale cost is 40-70% of retail
    }));

    const po = await prisma.purchaseOrders.create({
      data: {
        vendor_name: faker.company.name(),
        order_date: orderDate,
        expected_delivery_date: deliveryDate,
        incoterms: faker.helpers.arrayElement(incoterms),
        purchase_order_line_items: { create: lineItems },
      },
    });

    createdPOs.push(po.id);
    console.log(
      `Created PO #${po.id}: ${po.vendor_name} (${lineItems.length} items, ${po.incoterms})`,
    );
  }

  console.log(`\nCreated ${createdPOs.length} purchase orders`);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
