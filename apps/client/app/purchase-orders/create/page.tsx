'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Item, ParentItem, LineItemForm, PurchaseOrderFormData } from '../types';
import { formatIntegerInput, parseFormattedNumber, formatCurrency } from '../utils';

export default function CreatePurchaseOrder() {
  const router = useRouter();

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [vendorNames, setVendorNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    vendor_name: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    incoterms: '',
    line_items: [{ item_id: '', quantity: '1', unit_cost: '' }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, vendorsRes] = await Promise.all([
          fetch('http://localhost:3100/api/parent-items', { cache: 'no-cache' }),
          fetch('http://localhost:3100/api/purchase-orders/vendors', { cache: 'no-cache' })
        ]);

        if (!itemsRes.ok) throw new Error('Failed to fetch items');

        const parentItems: ParentItem[] = await itemsRes.json();
        const flatItems = parentItems.flatMap(parent => parent.items);
        setAllItems(flatItems);

        if (vendorsRes.ok) {
          const vendors = await vendorsRes.json();
          setVendorNames(vendors);
        }
      } catch (err) {
        setError('Failed to load items. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineItemChange = (index: number, field: keyof LineItemForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleQuantityChange = (index: number, value: string) => {
    const formatted = formatIntegerInput(value);
    handleLineItemChange(index, 'quantity', formatted);
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = allItems.find(item => item.id === Number(itemId));
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) =>
        i === index
          ? {
              ...item,
              item_id: itemId,
              unit_cost: selectedItem?.price || ''
            }
          : item
      )
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { item_id: '', quantity: '1', unit_cost: '' }]
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length <= 1) return;

    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.vendor_name.trim()) {
      return 'Vendor name is required';
    }

    if (!formData.order_date) {
      return 'Order date is required';
    }

    // Validate order date is not before today
    const orderDate = new Date(formData.order_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    if (orderDate < today) {
      return 'Order date cannot be before today';
    }

    if (!formData.expected_delivery_date) {
      return 'Expected delivery date is required';
    }

    // Validate date relationship
    const deliveryDate = new Date(formData.expected_delivery_date);
    if (deliveryDate < orderDate) {
      return 'Expected delivery date must be on or after the order date';
    }

    // Validate incoterms if provided
    if (formData.incoterms) {
      const validIncoterms = ['EXW', 'FCA', 'FOB', 'CIF', 'DDP'];
      if (!validIncoterms.includes(formData.incoterms)) {
        return 'Invalid incoterms. Must be one of: EXW, FCA, FOB, CIF, DDP';
      }
    }

    if (formData.line_items.length === 0) {
      return 'At least one line item is required';
    }

    for (let i = 0; i < formData.line_items.length; i++) {
      const item = formData.line_items[i];

      if (!item.item_id) {
        return `Line item ${i + 1}: Please select an item`;
      }

      const rawQty = parseFormattedNumber(item.quantity);
      const qty = Number(rawQty);
      if (!rawQty || qty < 1 || !Number.isInteger(qty)) {
        return `Line item ${i + 1}: Quantity must be a positive integer`;
      }

      const cost = Number(item.unit_cost);
      if (!item.unit_cost || cost <= 0) {
        return `Line item ${i + 1}: Unit cost must be a positive number`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vendor_name: formData.vendor_name,
        order_date: new Date(formData.order_date).toISOString(),
        expected_delivery_date: new Date(formData.expected_delivery_date).toISOString(),
        incoterms: formData.incoterms || undefined,
        line_items: formData.line_items.map(item => ({
          item_id: Number(item.item_id),
          quantity: Number(parseFormattedNumber(item.quantity)),
          unit_cost: item.unit_cost
        }))
      };

      const res = await fetch('http://localhost:3100/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create purchase order');
      }

      router.push('/purchase-orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Create Purchase Order</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="paper-card p-5 pb-8">
            <h2 className="text-lg font-semibold mb-4">Order Information</h2>

            <div className="form-separator" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text">Vendor Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter or select vendor name"
                  className="input input-bordered"
                  list="vendor-names"
                  value={formData.vendor_name}
                  onChange={(e) => handleFieldChange('vendor_name', e.target.value)}
                  required
                />
                <datalist id="vendor-names">
                  {vendorNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Order Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.order_date}
                  onChange={(e) => handleFieldChange('order_date', e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Expected Delivery Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.expected_delivery_date}
                  onChange={(e) => handleFieldChange('expected_delivery_date', e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Incoterms (Optional)</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.incoterms}
                  onChange={(e) => handleFieldChange('incoterms', e.target.value)}
                >
                  <option value="">Select Incoterms</option>
                  <option value="EXW">EXW - Ex Works</option>
                  <option value="FCA">FCA - Free Carrier</option>
                  <option value="FOB">FOB - Free On Board</option>
                  <option value="CIF">CIF - Cost, Insurance and Freight</option>
                  <option value="DDP">DDP - Delivered Duty Paid</option>
                </select>
              </div>
            </div>
          </div>

          <div className="paper-card p-5 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addLineItem}
              >
                Add Item
              </button>
            </div>

            <div className="form-separator" />

            <div className="overflow-x-auto mt-4">
              <table className="po-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Cost</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.line_items.map((lineItem, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="select select-bordered select-sm w-full min-w-[200px]"
                          value={lineItem.item_id}
                          onChange={(e) => handleItemSelect(index, e.target.value)}
                          required
                        >
                          <option value="">Select an item</option>
                          {allItems.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right">
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input input-bordered input-sm w-24 text-right"
                          value={lineItem.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          required
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="input input-bordered input-sm w-28 text-right"
                          value={lineItem.unit_cost}
                          onChange={(e) => handleLineItemChange(index, 'unit_cost', e.target.value)}
                          required
                        />
                      </td>
                      <td className="text-right font-medium">
                        ${formatCurrency(
                          Number(parseFormattedNumber(lineItem.quantity)) * Number(lineItem.unit_cost) || 0
                        )}
                      </td>
                      <td className="text-right">
                        {formData.line_items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => removeLineItem(index)}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.push('/purchase-orders')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating...
                </>
              ) : (
                'Create Purchase Order'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
