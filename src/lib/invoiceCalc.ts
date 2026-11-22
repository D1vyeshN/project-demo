import type { GSTRate, Invoice, InvoiceItem } from '../lib/types';
import { INVOICE_PREFIX } from './constants';

export function calcLine(
  qty: number,
  rate: number,
  discountPercent: number,
  gstRate: GSTRate
) {
  const lineSubtotal = qty * rate;
  const pct = Math.min(100, Math.max(0, discountPercent || 0));
  const discountAmount = (lineSubtotal * pct) / 100;
  const taxableAmount = lineSubtotal - discountAmount;
  const gst = (taxableAmount * gstRate) / 100;
  const amount = taxableAmount + gst;
  return { lineSubtotal, discountAmount, taxableAmount, gst, amount };
}

export function calcInvoice(items: InvoiceItem[]) {
  let subtotal = 0;
  let discount = 0;
  let taxableAmount = 0;
  let gst = 0;
  let total = 0;

  for (const it of items) {
    const line = calcLine(it.qty, it.rate, it.discountPercent ?? 0, it.gstRate);
    subtotal += line.lineSubtotal;
    discount += line.discountAmount;
    taxableAmount += line.taxableAmount;
    gst += line.gst;
    total += line.amount;
  }

  return { subtotal, discount, taxableAmount, gst, total };
}

/**
 * Backward-compatible normaliser: older invoices stored only a ₹ discount.
 * Derives the percentage and refreshes the computed ₹ discount / line amount.
 */
export function normalizeInvoiceItem(it: InvoiceItem): InvoiceItem {
  const rawPct =
    it.discountPercent ??
    (it.qty * it.rate > 0 ? (it.discount / (it.qty * it.rate)) * 100 : 0);
  const pct = Math.round(Math.min(100, Math.max(0, rawPct)) * 100) / 100;
  const line = calcLine(it.qty, it.rate, pct, it.gstRate);
  return {
    ...it,
    discountPercent: pct,
    discount: line.discountAmount,
    amount: line.amount,
  };
}

/** Next sequential invoice number, e.g. INV-005 → INV-006. */
export function nextInvoiceNo(invoices: Invoice[]): string {
  const max = invoices.reduce((highest, inv) => {
    const match = inv.invoiceNo?.match(/(\d+)\s*$/);
    if (!match) return highest;
    return Math.max(highest, parseInt(match[1], 10));
  }, 0);

  return `${INVOICE_PREFIX}-${String(max + 1).padStart(3, '0')}`;
}

export function statusFrom(amountReceived: number, total: number) {
  if (amountReceived <= 0) return 'Unpaid';
  if (amountReceived >= total) return 'Paid';
  return 'Partially Paid';
}
