'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PurchaseOrder, PurchaseOrderLineItem } from '../types';
import { formatDate, calculateTotal, calculateTotalQuantity } from '../utils';

export default function PurchaseOrderDetail() {
  const params = useParams();
  const id = params.id as string;

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPurchaseOrder() {
      try {
        const res = await fetch(`http://localhost:3100/api/purchase-orders/${id}`, {
          cache: 'no-cache'
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Purchase order not found');
          }
          throw new Error('Failed to fetch purchase order');
        }

        const data = await res.json();
        setPurchaseOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="text-xl text-error">Error</h2>
          <p>{error || 'Purchase order not found'}</p>
          <div className="card-actions justify-center mt-4">
            <Link href="/purchase-orders" className="btn btn-primary">
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Purchase Order #{purchaseOrder.id}</h1>
        <div className="flex gap-2">
          <Link href="/purchase-orders" className="btn btn-ghost">
            Back to List
          </Link>
          <Link href={`/purchase-orders/${id}/edit`} className="btn btn-primary">
            Edit
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Order Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Vendor Name</div>
                <div className="text-lg font-semibold">{purchaseOrder.vendor_name}</div>
              </div>

              <div>
                <div className="text-sm text-slate-400">Incoterms</div>
                <div className="text-lg font-semibold">
                  {purchaseOrder.incoterms || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400">Order Date</div>
                <div className="text-lg font-semibold">
                  {formatDate(purchaseOrder.order_date)}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400">Expected Delivery Date</div>
                <div className="text-lg font-semibold">
                  {formatDate(purchaseOrder.expected_delivery_date)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Line Items</h2>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.purchase_order_line_items.map((lineItem: PurchaseOrderLineItem) => (
                    <tr key={lineItem.id}>
                      <td>#{lineItem.item_id}</td>
                      <td>{lineItem.quantity}</td>
                      <td>${Number(lineItem.unit_cost).toFixed(2)}</td>
                      <td className="text-right">
                        ${(Number(lineItem.unit_cost) * lineItem.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divider my-2"></div>

            <div className="flex justify-end gap-8">
              <div>
                <div className="text-sm text-slate-400">Total Quantity</div>
                <div className="text-xl font-bold">
                  {calculateTotalQuantity(purchaseOrder.purchase_order_line_items)} items
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Total Cost</div>
                <div className="text-2xl font-bold">
                  ${calculateTotal(purchaseOrder.purchase_order_line_items)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
