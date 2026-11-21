import type {
  GSTRate,
  Unit,
  PaymentMode,
  InvoiceStatus,
  StockMovementType,
} from './types';

export const GST_RATES: GSTRate[] = [0, 5, 12, 18, 28];
export const UNITS: Unit[] = ['PCS', 'BOX', 'KG', 'etc.'];
export const CATEGORIES: string[] = ['Electronics', 'Accessories', 'Furniture', 'Groceries', 'Stationery', 'Other'];
export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'Bank', 'UPI', 'etc.'];
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
} as const;

export const INVOICE_PREFIX = 'INV';
export const DATE_FORMAT = 'yyyy-MM-dd';
