import type { GSTRate, InvoiceItem } from '../lib/types';

export function calcLine(
  qty: number,
  rate: number,
  discount: number,
  gstRate: GSTRate
) {
  const lineSubtotal = qty * rate;
  const discountAmount =
    discount > lineSubtotal ? lineSubtotal : discount;
  const taxableAmount = lineSubtotal - discountAmount;
  const gst = (taxableAmount * gstRate) / 100;
  const amount = taxableAmount + gst;
  return { lineSubtotal, discountAmount, taxableAmount, gst, amount };
}

export function calcInvoice(items: InvoiceItem[]) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const discount = items.reduce((s, it) => s + it.discount, 0);
  const taxableAmount = items.reduce(
    (s, it) => s + (it.qty * it.rate - it.discount),
    0
  );
  const gst = items.reduce(
    (s, it) => s + calcLine(it.qty, it.rate, it.discount, it.gstRate).gst,
    0
  );
  const total = items.reduce(
    (s, it) => s + calcLine(it.qty, it.rate, it.discount, it.gstRate).amount,
    0
  );
  return { subtotal, discount, taxableAmount, gst, total };
}

export function statusFrom(amountReceived: number, total: number) {
  if (amountReceived <= 0) return 'Unpaid';
  if (amountReceived >= total) return 'Paid';
  return 'Partially Paid';
}
