'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PurchaseOrder, PurchaseOrderLineItem } from '../types';
import { formatDate, formatNumber, formatCurrency, calculateTotal, calculateTotalQuantity } from '../utils';

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

      <div className="paper-card p-5 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span className="po-stamp text-lg">PO #{purchaseOrder.id}</span>
          <div>
            <div className="meta-label">Vendor</div>
            <div className="text-lg font-semibold">{purchaseOrder.vendor_name}</div>
          </div>
        </div>

        <div className="form-separator" />

        {/* Order Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="meta-label">Order Date</div>
            <div className="text-sm">{formatDate(purchaseOrder.order_date)}</div>
          </div>
          <div>
            <div className="meta-label">Expected Delivery</div>
            <div className="text-sm">{formatDate(purchaseOrder.expected_delivery_date)}</div>
          </div>
          <div>
            <div className="meta-label">Incoterms</div>
            {purchaseOrder.incoterms ? (
              <span className="incoterms-badge">{purchaseOrder.incoterms}</span>
            ) : (
              <span className="text-sm text-slate-500">—</span>
            )}
          </div>
          <div>
            <div className="meta-label">Line Items</div>
            <div className="text-sm">{purchaseOrder.purchase_order_line_items.length} item{purchaseOrder.purchase_order_line_items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="po-table">
            <thead>
              <tr>
                <th>Item #</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Cost</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.purchase_order_line_items.map((lineItem: PurchaseOrderLineItem) => (
                <tr key={lineItem.id}>
                  <td className="font-mono text-sm">#{lineItem.item_id}</td>
                  <td className="text-right">{formatNumber(lineItem.quantity)}</td>
                  <td className="text-right">${formatCurrency(lineItem.unit_cost)}</td>
                  <td className="text-right font-medium">
                    ${formatCurrency(Number(lineItem.unit_cost) * lineItem.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-semibold">Total</td>
                <td className="text-right font-semibold">
                  {formatNumber(calculateTotalQuantity(purchaseOrder.purchase_order_line_items))}
                </td>
                <td></td>
                <td className="text-right font-bold text-primary text-lg">
                  ${calculateTotal(purchaseOrder.purchase_order_line_items)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
