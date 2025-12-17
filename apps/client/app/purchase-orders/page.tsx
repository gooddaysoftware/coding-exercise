'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PurchaseOrder, PurchaseOrderLineItem, PaginationMeta, PaginatedResponse } from './types';
import { formatDate, formatNumber, formatCurrency, calculateTotal, calculateTotalQuantity } from './utils';

type SortField = 'vendor' | 'order_date' | 'delivery_date' | 'quantity' | 'cost';
type SortDirection = 'asc' | 'desc';
const PAGE_SIZE = 5;

export default function Index() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('delivery_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [vendorFilter, setVendorFilter] = useState('');
  const [vendorNames, setVendorNames] = useState<string[]>([]);

  // Fetch vendor names for autocomplete
  useEffect(() => {
    async function fetchVendorNames() {
      try {
        const res = await fetch('http://localhost:3100/api/purchase-orders/vendors');
        if (res.ok) {
          const names = await res.json();
          setVendorNames(names);
        }
      } catch (error) {
        console.error('Error fetching vendor names:', error);
      }
    }
    fetchVendorNames();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        params.append('page', String(currentPage));
        params.append('limit', String(PAGE_SIZE));

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

        // Add vendor filter if set
        if (vendorFilter.trim()) {
          params.append('vendor_name', vendorFilter.trim());
        }

        const url = `http://localhost:3100/api/purchase-orders?${params.toString()}`;
        const res = await fetch(url, {cache: 'no-cache'});
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        const response: PaginatedResponse<PurchaseOrder> = await res.json();
        setData(response.data);
        setPagination(response.meta);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sortField, sortDirection, currentPage, vendorFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Helper to calculate raw total for sorting (without formatting)
  const calculateRawTotal = (lineItems: PurchaseOrderLineItem[]) => {
    return lineItems.reduce((sum, item) => sum + (Number(item.unit_cost) * item.quantity), 0);
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
          compareValue = calculateRawTotal(a.purchase_order_line_items) - calculateRawTotal(b.purchase_order_line_items);
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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Filter:</span>
              <input
                type="text"
                placeholder="Search by vendor..."
                className="input input-sm input-bordered w-48"
                list="vendor-names"
                value={vendorFilter}
                onChange={(e) => {
                  setVendorFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <datalist id="vendor-names">
                {vendorNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {vendorFilter && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setVendorFilter('');
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="border-l border-base-300 h-6 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Sort by:</span>
              <SortButton field="delivery_date" label="Delivery Date" />
              <SortButton field="order_date" label="Order Date" />
              <SortButton field="vendor" label="Vendor" />
              <SortButton field="quantity" label="Quantity" />
              <SortButton field="cost" label="Cost" />
            </div>
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
            <p className="text-slate-400">
              {vendorFilter
                ? `No purchase orders found for "${vendorFilter}".`
                : 'No purchase orders found. Create your first one!'}
            </p>
          </div>
        </div>
      ) : (
        <>
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
                      {formatNumber(calculateTotalQuantity(purchaseOrder.purchase_order_line_items))}
                    </div>
                  </div>

                  <div className="text-center min-w-[100px]">
                    <div className="text-xs text-slate-400">Cost</div>
                    <div className="font-bold">
                      ${calculateTotal(purchaseOrder.purchase_order_line_items)}
                    </div>
                  </div>

                  <div className="text-center min-w-[120px]">
                    <div className="text-xs text-slate-400">Arriving</div>
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

                <details className="collapse collapse-arrow bg-base-200">
                  <summary className="collapse-title font-semibold">
                    Order Details ({purchaseOrder.purchase_order_line_items.length} items)
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
                              <td>{formatNumber(lineItem.quantity)}</td>
                              <td>${formatCurrency(lineItem.unit_cost)}</td>
                              <td className="text-right">
                                ${formatCurrency(Number(lineItem.unit_cost) * lineItem.quantity)}
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and pages around current
                  return page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, arr) => (
                  <span key={page} className="flex items-center">
                    {index > 0 && arr[index - 1] !== page - 1 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button
                      className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </span>
                ))}
            </div>

            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              ›
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage === pagination.totalPages}
            >
              »
            </button>

            <span className="text-sm text-slate-400 ml-4">
              {formatNumber(pagination.total)} total
            </span>
          </div>
        )}
        </>
      )}
    </div>
  );
}
