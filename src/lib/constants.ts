import type {
  GSTRate,
  Unit,
  PaymentMode,
  InvoiceStatus,
  StockMovementType,
  Purchase,
  Payment,
  Return,
} from './types';

export const GST_RATES: GSTRate[] = [0, 5, 12, 18, 28];
export const DISCOUNT_PERCENTS: number[] = [0, 5, 10, 15, 20, 25, 30, 40, 50];
export const UNITS: Unit[] = ['PCS', 'BOX', 'KG', 'etc.'];
export const CATEGORIES: string[] = ['Electronics', 'Accessories', 'Furniture', 'Groceries', 'Stationery', 'Other'];
export const PAYMENT_MODES: PaymentMode[] = ['None', 'Cash', 'Bank', 'UPI'];
export const INVOICE_STATUSES: InvoiceStatus[] = ['Paid', 'Partially Paid', 'Unpaid'];
export const STOCK_MOVEMENT_TYPES: StockMovementType[] = [
  'Opening Stock',
  'Sales',
  'Purchase',
  'Adjustment',
];

export const STORAGE_KEYS = {
  ITEMS: 'items',
  PARTIES: 'parties',
  INVOICES: 'invoices',
  STOCK_MOVEMENTS: 'stockMovements',
  PURCHASES: 'purchases',
  PAYMENTS: 'payments',
  RETURNS: 'returns',
} as const;

export const INVOICE_PREFIX = 'INV';
export const PURCHASE_PREFIX = 'PUR';
export const PAYMENT_PREFIX = 'RCP';
export const RETURN_PREFIX = 'RET';
export const DATE_FORMAT = 'yyyy-MM-dd';

/** Next sequential purchase reference, e.g. PUR-001 → PUR-002. */
export function nextPurchaseNo(purchases: Purchase[]): string {
  const max = purchases.reduce((highest, p) => {
    const match = p.refNo?.match(/(\d+)\s*$/);
    if (!match) return highest;
    return Math.max(highest, parseInt(match[1], 10));
  }, 0);
  return `${PURCHASE_PREFIX}-${String(max + 1).padStart(3, '0')}`;
}

/** Next sequential payment reference, e.g. RCP-001 → RCP-002. */
export function nextPaymentNo(payments: Payment[]): string {
  const max = payments.reduce((highest, p) => {
    const match = p.refNo?.match(/(\d+)\s*$/);
    if (!match) return highest;
    return Math.max(highest, parseInt(match[1], 10));
  }, 0);
  return `${PAYMENT_PREFIX}-${String(max + 1).padStart(3, '0')}`;
}

/** Next sequential return reference, e.g. RET-001 → RET-002. */
export function nextReturnNo(returns: Return[]): string {
  const max = returns.reduce((highest, r) => {
    const match = r.refNo?.match(/(\d+)\s*$/);
    if (!match) return highest;
    return Math.max(highest, parseInt(match[1], 10));
  }, 0);
  return `${RETURN_PREFIX}-${String(max + 1).padStart(3, '0')}`;
}
