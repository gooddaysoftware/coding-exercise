import { PurchaseOrderLineItem } from './types';

/**
 * Formats a number with commas as thousands separators.
 * Handles integers, decimals, and floats.
 * @param value - The number or string representation of a number to format
 * @param decimals - Optional number of decimal places (default: auto-detect)
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | string, decimals?: number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  if (decimals !== undefined) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return num.toLocaleString('en-US');
}

/**
 * Formats a number as currency with commas and 2 decimal places.
 * @param value - The number or string representation of a number to format
 * @returns Formatted currency string (without $ symbol)
 */
export function formatCurrency(value: number | string): string {
  return formatNumber(value, 2);
}

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
  return formatCurrency(total);
}

export function calculateTotalQuantity(lineItems: PurchaseOrderLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Formats an integer input value with commas as user types.
 * Only allows digits, strips everything else.
 * @param value - The raw input value
 * @returns Formatted string with commas
 */
export function formatIntegerInput(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  // Parse and format with commas
  const num = parseInt(digits, 10);
  return num.toLocaleString('en-US');
}

/**
 * Parses a formatted number string (with commas) back to a number string.
 * @param value - The formatted value (e.g., "1,234")
 * @returns Plain number string (e.g., "1234")
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, '');
}
