import moment from 'moment';
import React from 'react';
import Currency from '../../components/Currency';
import { notFound } from 'next/navigation';


interface Props {
  params: {
    purchaseOrderId: number;
  };
}

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

async function getPurchaseOrderById(id: number): Promise<PurchaseOrder> {
  const res = await fetch('http://localhost:3100/api/purchase-orders/' + id, {
    cache: 'no-cache',
  });
  if (!res.ok) {
    notFound();
  }

  const body = res.json();
  return body;
}

export default async function PurchaseOrderDetailsPage({
  params: { purchaseOrderId },
}: Props) {
  const purchaseOrder = await getPurchaseOrderById(purchaseOrderId);

  return (
    <>
      <h1 className="text-2xl m-5">Purchase Order Details</h1>
      <div>Purchase Order Number: {purchaseOrderId}</div>
      <div>Vendor: {purchaseOrder.vendor_name}</div>
      <div>
        Order Date: {moment(purchaseOrder.order_date).format('YYYY-MM-DD')}
      </div>
      <div>
        Expected Delivery Date: {moment(purchaseOrder.expected_delivery_date).format('YYYY-MM-DD')}
      </div>

      <h2 className='text-xl m-5'>Line Items</h2>
      <table className="table">
        <thead className="bg-slate-200">
          <tr>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Item Id
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Quantity
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Unit Cost
            </th>
            <th className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400 text-left">
              Total Item Cost
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800">
          {purchaseOrder.purchase_order_line_items.map(
            (lineItem: PurchaseOrderLineItem) => (
              <tr key={lineItem.id}>
                <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                  {lineItem.item_id}
                </td>
                <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                  {lineItem.quantity}
                </td>
                <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                  <Currency value={lineItem.unit_cost} />
                </td>
                <td className="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                  <Currency value={lineItem.unit_cost * lineItem.quantity} />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </>
  );
}
