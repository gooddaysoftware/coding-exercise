'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PurchaseOrderLineItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  unit_cost: string;
  created_at: Date;
  updated_at: Date;
}

interface PurchaseOrder {
  id: number;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  incoterms?: string;
  purchase_order_line_items: PurchaseOrderLineItem[];
}

type SortField = 'vendor' | 'order_date' | 'delivery_date' | 'quantity' | 'cost';
type SortDirection = 'asc' | 'desc';

function formatDate(dateString: string): string {
  // Extract date part to avoid timezone conversion issues
  const datePart = dateString.split('T')[0]; // "2026-01-02"
  const [year, month, day] = datePart.split('-');
  // Create date in local timezone to prevent day shifting
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function calculateTotal(lineItems: PurchaseOrderLineItem[]): string {
  const total = lineItems.reduce((sum, item) => {
    return sum + (Number(item.unit_cost) * item.quantity);
  }, 0);
  return total.toFixed(2);
}

function calculateTotalQuantity(lineItems: PurchaseOrderLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity, 0);
}

export default function Index() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('delivery_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    async function fetchData() {
      try {
        // Build query params
        const params = new URLSearchParams();

        // Map client sort fields to API fields (only for API-sortable fields)
        const apiSortableFields: Record<string, string> = {
          'vendor': 'vendor_name',
          'order_date': 'order_date',
          'delivery_date': 'expected_delivery_date',
        };

        // Only add sort params if the field is API-sortable
        if (apiSortableFields[sortField]) {
          params.append('sortBy', apiSortableFields[sortField]);
          params.append('sortOrder', sortDirection);
        }

        const url = `http://localhost:3100/api/purchase-orders${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, {cache: 'no-cache'});
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        const purchaseOrders = await res.json();
        setData(purchaseOrders);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = (() => {
    // For API-sortable fields, data is already sorted from the API
    const apiSortableFields = ['vendor', 'order_date', 'delivery_date'];
    if (apiSortableFields.includes(sortField)) {
      return data;
    }

    // For client-side sortable fields (quantity, cost), sort here
    return [...data].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'quantity':
          compareValue = calculateTotalQuantity(a.purchase_order_line_items) - calculateTotalQuantity(b.purchase_order_line_items);
          break;
        case 'cost':
          compareValue = Number(calculateTotal(a.purchase_order_line_items)) - Number(calculateTotal(b.purchase_order_line_items));
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  })();

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`btn btn-sm ${sortField === field ? 'btn-primary' : 'btn-ghost'}`}
    >
      {label}
      {sortField === field && (
        <span className="ml-1">
          {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Purchase Orders</h1>
        <Link href="/purchase-orders/create" className="btn btn-primary">
          Create New PO
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold mr-2">Sort by:</span>
            <SortButton field="delivery_date" label="Delivery Date" />
            <SortButton field="order_date" label="Order Date" />
            <SortButton field="vendor" label="Vendor" />
            <SortButton field="quantity" label="Quantity" />
            <SortButton field="cost" label="Cost" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : data.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <p className="text-slate-400">No purchase orders found. Create your first one!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedData.map((purchaseOrder: PurchaseOrder) => (
            <div
              key={purchaseOrder.id}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body py-4">
                <div className="flex items-center gap-6 mb-2">
                  <Link
                    href={`/purchase-orders/${purchaseOrder.id}`}
                    className="text-2xl font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    PO #{purchaseOrder.id}
                  </Link>

                  <div className="text-lg font-semibold min-w-[150px]">
                    {purchaseOrder.vendor_name}
                  </div>

                  <div className="text-center min-w-[100px]">
                    <div className="text-xs text-slate-400">Quantity</div>
                    <div className="font-bold">
                      {calculateTotalQuantity(purchaseOrder.purchase_order_line_items)}
                    </div>
                  </div>

                  <div className="text-center min-w-[100px]">
                    <div className="text-xs text-slate-400">Cost</div>
                    <div className="font-bold">
                      ${calculateTotal(purchaseOrder.purchase_order_line_items)}
                    </div>
                  </div>

                  <div className="text-center min-w-[120px]">
                    <div className="text-xs text-slate-400">Expected</div>
                    <div className="text-sm">
                      {formatDate(purchaseOrder.expected_delivery_date)}
                    </div>
                  </div>

                  <div className="text-center min-w-[120px]">
                    <div className="text-xs text-slate-400">Ordered</div>
                    <div className="text-sm">
                      {formatDate(purchaseOrder.order_date)}
                    </div>
                  </div>

                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-slate-400">Incoterms</div>
                    <div className="text-sm">
                      {purchaseOrder.incoterms || '-'}
                    </div>
                  </div>

                  <div className="ml-auto">
                    <Link
                      href={`/purchase-orders/${purchaseOrder.id}/edit`}
                      className="btn btn-primary btn-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <details className="collapse collapse-arrow bg-base-200">
                  <summary className="collapse-title font-semibold">
                    Line Items ({purchaseOrder.purchase_order_line_items.length})
                  </summary>
                  <div className="collapse-content">
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
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
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
