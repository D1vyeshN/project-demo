import type { GSTRate, Invoice, InvoiceItem } from '@/lib/types';
import { INVOICE_PREFIX } from '@/lib/constants';

export function calcLine(
  qty: number,
  rate: number,
  discountPercent: number,
  gstRate: GSTRate
) {
  const lineSubtotal = Number((qty * rate).toFixed(2));
  const pct = Math.min(100, Math.max(0, discountPercent || 0));
  const discountAmount = Number(((lineSubtotal * pct) / 100).toFixed(2));
  const taxableAmount = Number((lineSubtotal - discountAmount).toFixed(2));
  const gst = Number(((taxableAmount * gstRate) / 100).toFixed(2));
  const amount = Number((taxableAmount + gst).toFixed(2));
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
    subtotal = Number((subtotal + line.lineSubtotal).toFixed(2));
    discount = Number((discount + line.discountAmount).toFixed(2));
    taxableAmount = Number((taxableAmount + line.taxableAmount).toFixed(2));
    gst = Number((gst + line.gst).toFixed(2));
    total = Number((total + line.amount).toFixed(2));
  }

  return { subtotal, discount, taxableAmount, gst, total };
}

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

export function nextInvoiceNo(invoices: Invoice[]): string {
  const existing = new Set(
    invoices.map((inv) => inv.invoiceNo).filter(Boolean)
  );
  let num = 1;
  invoices.forEach((inv) => {
    const match = inv.invoiceNo?.match(/(\d+)\s*$/);
    if (match) {
      num = Math.max(num, parseInt(match[1], 10) + 1);
    }
  });
  // Increment until we find a unique number
  while (existing.has(`${INVOICE_PREFIX}-${String(num).padStart(3, '0')}`)) {
    num++;
  }
  return `${INVOICE_PREFIX}-${String(num).padStart(3, '0')}`;
}

export function statusFrom(amountReceived: number, total: number) {
  if (amountReceived <= 0) return 'Unpaid';
  if (amountReceived >= total) return 'Paid';
  return 'Partially Paid';
}
