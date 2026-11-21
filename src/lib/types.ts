export type GSTRate = 0 | 5 | 12 | 18 | 28;
export type Unit = 'PCS' | 'BOX' | 'KG' | 'etc.';
export type PaymentMode = 'Cash' | 'Bank' | 'UPI' | 'etc.';
export type InvoiceStatus = 'Paid' | 'Partially Paid' | 'Unpaid';
export type StockMovementType = 'Opening Stock' | 'Sales' | 'Purchase' | 'Adjustment';

export interface Item {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  gstRate: GSTRate;
  unit: Unit;
  openingStock: number;
  currentStock: number;
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
  discount: number;
  gstRate: GSTRate;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
