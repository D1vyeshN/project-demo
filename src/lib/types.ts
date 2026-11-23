export type GSTRate = 0 | 5 | 12 | 18 | 28;
export type Unit = 'PCS' | 'BOX' | 'KG' | 'etc.';
export type PaymentMode = 'None' | 'Cash' | 'Bank' | 'UPI' | 'etc.';
export type InvoiceStatus = 'Paid' | 'Partially Paid' | 'Unpaid';
export type StockMovementType = 'Opening Stock' | 'Sales' | 'Purchase' | 'Adjustment';

export interface Item {
  id: string;
  sku: string;
  name: string;
  category?: string;
  sellingPrice: number;
  gstRate: GSTRate;
  unit: Unit;
  openingStock: number;
  currentStock: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  openingOutstanding: number;
  currentOutstanding: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  itemId: string;
  sku: string;
  name: string;
  qty: number;
  rate: number;
  /** Discount percentage (0–100). `discount` below is the computed ₹ amount. */
  discountPercent: number;
  discount: number;
  gstRate: GSTRate;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  /** Optional payment due date (ISO). Falls back to `date` when absent. */
  dueDate?: string;
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gst: number;
  total: number;
  paymentMode: PaymentMode;
  amountReceived: number;
  /** Round-off difference when cash rounding applied (rounded − original) */
  roundOff?: number;
  status: InvoiceStatus;
  paymentRef?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: StockMovementType;
  qty: number;
  refId?: string;
  date: string;
  balance: number;
}

/**
 * Purchase = stock coming in (mockup screen 13 shows Purchase rows in Stock
 * Movements). Simple stock-in record: qty + optional rate, no PO lifecycle.
 */
export interface Purchase {
  id: string;
  /** Human-readable reference, e.g. "PUR-001". */
  refNo: string;
  itemId: string;
  itemName: string;
  qty: number;
  /** Optional unit cost for record-keeping. */
  rate?: number;
  note?: string;
  date: string;
  createdAt: string;
}

/** Payment received against a party (mockup screen 12 shows Payment rows). */
export interface Payment {
  id: string;
  /** Human-readable reference, e.g. "RCP-001". */
  refNo: string;
  partyId: string;
  invoiceId?: string; // linked invoice, if any
  amount: number;
  /** Round-off difference when cash rounding applied (rounded − original) */
  roundOff?: number;
  paymentMode: PaymentMode;
  paymentRef?: string; // e.g. UPI / cheque reference
  date: string;
  createdAt: string;
}

/** Sale return / credit note against a party (mockup screen 12 shows Return rows). */
export interface Return {
  id: string;
  /** Human-readable reference, e.g. "RET-001". */
  refNo: string;
  partyId: string;
  invoiceId?: string; // original invoice being returned, if any
  amount: number;
  reason?: string;
  date: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
