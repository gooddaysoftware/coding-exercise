import { PurchaseOrderLineItem } from './types';

export function formatDate(dateString: string): string {
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

export function calculateTotal(lineItems: PurchaseOrderLineItem[]): string {
  const total = lineItems.reduce((sum, item) => {
    return sum + (Number(item.unit_cost) * item.quantity);
  }, 0);
  return total.toFixed(2);
}

export function calculateTotalQuantity(lineItems: PurchaseOrderLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity, 0);
}
