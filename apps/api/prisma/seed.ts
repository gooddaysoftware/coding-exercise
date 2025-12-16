import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from apps/api/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.purchaseOrderLineItems.deleteMany();
  await prisma.purchaseOrders.deleteMany();
  await prisma.item.deleteMany();
  await prisma.parentItem.deleteMany();

  // Reset SQLite autoincrement sequences
  await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?, ?)',
    'purchase_order_line_items', 'purchase_orders', 'items', 'parent_items');

  console.log('Seeding database...');

  // Seed parent items with nested item creation
  const tshirtParent = await prisma.parentItem.create({
    data: {
      id: 1,
      name: 'T-shirt',
      items: {
        create: [
          { name: 'Red shirt', sku: 'sh-1', price: '10.00', quantity: 10 },
          { name: 'Blue shirt', sku: 'sh-2', price: '10.00', quantity: 10 },
          { name: 'Green shirt', sku: 'sh-3', price: '10.00', quantity: 10 },
        ],
      },
    },
  });

  const pantsParent = await prisma.parentItem.create({
    data: {
      id: 2,
      name: 'Pants',
      items: {
        create: [
          { name: 'Red pants', sku: 'pa-1', price: '20.00', quantity: 10 },
          { name: 'Blue pants', sku: 'pa-2', price: '20.00', quantity: 10 },
          { name: 'Green pants', sku: 'pa-3', price: '20.00', quantity: 10 },
        ],
      },
    },
  });
  console.log(`Created ${2} parent items with ${6} items`);

  // Seed purchase orders with JavaScript Date objects
  const po1 = await prisma.purchaseOrders.create({
    data: {
      vendor_name: 'Levis',
      order_date: new Date('2023-01-01T12:00:00.000Z'),
      expected_delivery_date: new Date('2023-03-10T12:00:00.000Z'),
      incoterms: 'FOB',
      purchase_order_line_items: {
        create: [
          { item_id: 1, quantity: 10, unit_cost: '10.00' },
          { item_id: 2, quantity: 10, unit_cost: '10.00' },
          { item_id: 3, quantity: 10, unit_cost: '10.00' },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrders.create({
    data: {
      vendor_name: 'Bonobos',
      order_date: new Date('2023-02-01T12:00:00.000Z'),
      expected_delivery_date: new Date('2023-04-10T12:00:00.000Z'),
      incoterms: 'CIF',
      purchase_order_line_items: {
        create: [
          { item_id: 4, quantity: 10, unit_cost: '20.00' },
          { item_id: 5, quantity: 10, unit_cost: '20.00' },
          { item_id: 6, quantity: 10, unit_cost: '20.00' },
        ],
      },
    },
  });

  const po3 = await prisma.purchaseOrders.create({
    data: {
      vendor_name: 'Scotch and Soda',
      order_date: new Date('2023-03-01T12:00:00.000Z'),
      expected_delivery_date: new Date('2023-05-10T12:00:00.000Z'),
      incoterms: 'DDP',
      purchase_order_line_items: {
        create: [
          { item_id: 1, quantity: 10, unit_cost: '10.00' },
          { item_id: 2, quantity: 10, unit_cost: '10.00' },
          { item_id: 3, quantity: 10, unit_cost: '10.00' },
          { item_id: 4, quantity: 10, unit_cost: '20.00' },
          { item_id: 5, quantity: 10, unit_cost: '20.00' },
          { item_id: 6, quantity: 10, unit_cost: '20.00' },
        ],
      },
    },
  });

  console.log(`Created purchase orders: ${po1.id}, ${po2.id}, ${po3.id}`);
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
