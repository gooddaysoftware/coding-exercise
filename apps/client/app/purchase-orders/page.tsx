import Link from 'next/link';
import moment from 'moment';
import { sort } from 'fast-sort';
import Currency from '../components/Currency';

interface PurchaseOrderLineItem {
  id: number;
  item_id: number;
  quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
}

interface PurchaseOrder {
  id: number;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  created_at: string;
  updated_at: string;
  purchase_order_line_items: PurchaseOrderLineItem[];
}

async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const res = await fetch('http://localhost:3100/api/purchase-orders', {
    cache: 'no-cache',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  const body = res.json();
  return body;
}

export default async function Index() {
  const purchaseOrders = await getPurchaseOrders();

  const sortedPurchaseOrders = sort(purchaseOrders).asc(
    (po) => po.expected_delivery_date
  );

  return (
    <>
      <div>
        <h1 className="text-2xl m-5">Purchase Orders</h1>
      </div>
      <table className="table">
        <thead className="bg-slate-200">
          <tr>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Purchase Order Id
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Vendor
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Order Date
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Expected Delivery Date
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Total Item Quantity
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Total Price
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800">
          {sortedPurchaseOrders.map((purchaseOrder: PurchaseOrder) => (
            <tr key={purchaseOrder.id}>
              <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                <Link
                  href={'/purchase-orders/' + purchaseOrder.id}
                  className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                >
                  {purchaseOrder.id}
                </Link>
              </td>
              <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                {purchaseOrder.vendor_name}
              </td>
              <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                {moment(purchaseOrder.order_date).format('YYYY-MM-DD')}
              </td>
              <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                {moment(purchaseOrder.expected_delivery_date).format(
                  'YYYY-MM-DD'
                )}
              </td>
              <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                {purchaseOrder.purchase_order_line_items
                  .map((item) => item.quantity)
                  .reduce((prev, next) => prev + next)}
              </td>
              <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                <Currency
                  value={purchaseOrder.purchase_order_line_items
                    .map((item) => item.unit_cost * item.quantity)
                    .reduce((prev, next) => prev + next)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
