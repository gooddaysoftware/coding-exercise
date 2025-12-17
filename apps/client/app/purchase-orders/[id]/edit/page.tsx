'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Item {
  id: number;
  parent_item_id: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
}

interface ParentItem {
  id: number;
  name: string;
  items: Item[];
}

interface LineItemForm {
  item_id: string;
  quantity: string;
  unit_cost: string;
}

interface FormData {
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  incoterms: string;
  line_items: LineItemForm[];
}

interface PurchaseOrderLineItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  unit_cost: string;
}

interface PurchaseOrder {
  id: number;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  incoterms?: string;
  purchase_order_line_items: PurchaseOrderLineItem[];
}

export default function EditPurchaseOrder() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    vendor_name: '',
    order_date: '',
    expected_delivery_date: '',
    incoterms: '',
    line_items: [{ item_id: '', quantity: '1', unit_cost: '' }]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch items
        const itemsRes = await fetch('http://localhost:3100/api/parent-items', {
          cache: 'no-cache'
        });
        if (!itemsRes.ok) throw new Error('Failed to fetch items');

        const parentItems: ParentItem[] = await itemsRes.json();
        const flatItems = parentItems.flatMap(parent => parent.items);
        setAllItems(flatItems);

        // Fetch existing PO
        const poRes = await fetch(`http://localhost:3100/api/purchase-orders/${id}`, {
          cache: 'no-cache'
        });

        if (!poRes.ok) {
          if (poRes.status === 404) {
            throw new Error('Purchase order not found');
          }
          throw new Error('Failed to fetch purchase order');
        }

        const po: PurchaseOrder = await poRes.json();

        // Pre-populate form with existing data
        setFormData({
          vendor_name: po.vendor_name,
          order_date: new Date(po.order_date).toISOString().split('T')[0],
          expected_delivery_date: new Date(po.expected_delivery_date).toISOString().split('T')[0],
          incoterms: po.incoterms || '',
          line_items: po.purchase_order_line_items.map(item => ({
            item_id: String(item.item_id),
            quantity: String(item.quantity),
            unit_cost: item.unit_cost
          }))
        });
      } catch (err) {
        setInitialLoadError(err instanceof Error ? err.message : 'Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

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

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = allItems.find(item => item.id === Number(itemId));
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) =>
        i === index
          ? {
              ...item,
              item_id: itemId,
              unit_cost: selectedItem?.price || item.unit_cost
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

    // order_date validation removed - field is disabled and cannot be changed

    if (!formData.expected_delivery_date) {
      return 'Expected delivery date is required';
    }

    // Validate date relationship (delivery date must still be after order date)
    const orderDate = new Date(formData.order_date);
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

      const qty = Number(item.quantity);
      if (!item.quantity || qty < 1 || !Number.isInteger(qty)) {
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
        // order_date is not included - cannot be changed after creation
        expected_delivery_date: new Date(formData.expected_delivery_date).toISOString(),
        incoterms: formData.incoterms || undefined,
        line_items: formData.line_items.map(item => ({
          item_id: Number(item.item_id),
          quantity: Number(item.quantity),
          unit_cost: item.unit_cost
        }))
      };

      const res = await fetch(`http://localhost:3100/api/purchase-orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update purchase order');
      }

      router.push(`/purchase-orders/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (initialLoadError) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="text-xl text-error">Error</h2>
          <p>{initialLoadError}</p>
          <div className="card-actions justify-center mt-4">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Edit Purchase Order #{id}</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Order Information</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Vendor Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter vendor name"
                className="input input-bordered"
                value={formData.vendor_name}
                onChange={(e) => handleFieldChange('vendor_name', e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Order Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={formData.order_date}
                disabled
                title="Order date cannot be changed after creation"
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

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Line Items</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addLineItem}
              >
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.line_items.map((lineItem, index) => (
                <div key={index} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Item {index + 1}</h3>
                    {formData.line_items.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-error btn-sm"
                        onClick={() => removeLineItem(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Item</span>
                      </label>
                      <select
                        className="select select-bordered"
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
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Quantity</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input input-bordered"
                        value={lineItem.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Unit Cost</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="input input-bordered"
                        value={lineItem.unit_cost}
                        onChange={(e) => handleLineItemChange(index, 'unit_cost', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push(`/purchase-orders/${id}`)}
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
                Updating...
              </>
            ) : (
              'Update Purchase Order'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
