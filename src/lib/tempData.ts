import type {
  Item,
  Party,
  Invoice,
  InvoiceItem,
  Purchase,
  Payment,
  Return,
  StockMovement,
} from './types';
import {
  GST_RATES,
  UNITS,
  CATEGORIES,
  PAYMENT_MODES,
  INVOICE_STATUSES,
  STOCK_MOVEMENT_TYPES,
  INVOICE_PREFIX,
  PURCHASE_PREFIX,
  PAYMENT_PREFIX,
  RETURN_PREFIX,
} from './constants';

// Random generators
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem(): Omit<Item, 'id' | 'createdAt' | 'updatedAt'> {
  const categories = CATEGORIES.filter((c) => c !== 'Other');
  const category = categories[randomInt(0, categories.length - 1)];
  const unit = UNITS[randomInt(0, UNITS.length - 1)];
  const gstRate = GST_RATES[randomInt(0, GST_RATES.length - 1)];
  const skuNum = randomInt(1, 9999).toString().padStart(4, '0');

  let name: string;
  let sellingPrice: number;
  let currentStock: number;

  switch (category) {
    case 'Electronics':
      name = `Electronics Item ${skuNum}`;
      sellingPrice = randomFloat(1000, 50000);
      currentStock = randomInt(0, 100);
      break;
    case 'Furniture':
      name = `Furniture ${skuNum}`;
      sellingPrice = randomFloat(2000, 15000);
      currentStock = randomInt(1, 50);
      break;
    case 'Groceries':
      name = `Grocery ${skuNum}`;
      sellingPrice = randomFloat(50, 500);
      currentStock = randomInt(10, 200);
      break;
    case 'Accessories':
      name = `Accessory ${skuNum}`;
      sellingPrice = randomFloat(200, 2000);
      currentStock = randomInt(0, 150);
      break;
    case 'Stationery':
      name = `Stationery ${skuNum}`;
      sellingPrice = randomFloat(10, 500);
      currentStock = randomInt(5, 100);
      break;
    default:
      name = `Other Item ${skuNum}`;
      sellingPrice = randomFloat(100, 1000);
      currentStock = randomInt(0, 50);
  }

  const openingStock = currentStock + randomInt(0, 50);

  return {
    sku: `SKU-${skuNum}`,
    name,
    category,
    sellingPrice,
    gstRate,
    unit,
    openingStock,
    currentStock,
    description: `${name} - Random test item`,
    imageUrl: '',
  };
}

const firstNames = [
  'Amit', 'Priya', 'Raj', 'Sneha', 'Kumar', 'Anjali', 'Vikram', 'Pooja',
  'Deepak', 'Neha', 'Ramesh', 'Kavita', 'Suresh', 'Meet', 'Harsh', 'Ishita',
  'Rahul', 'Shreya', 'Mohit', 'Riya', 'Vishal', 'Nandini', 'Arjun', 'Sia',
  'Kunal', 'Tara', 'Manoj', 'Esha', 'Dinesh', 'Latika', 'Guruvayurappa', 'Meera',
];

const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Desai', 'Mehta', 'Joshi', 'Reddy',
  'Iyer', 'Chauhan', 'Verma', 'Shroff', 'Gupta', 'Chatterjee', 'Banerjee',
  'Saxena', 'Trivedi', 'Patwardhan', 'Deshmukh', 'Kulkarni',
];

function randomParty(): Omit<Party, 'id' | 'createdAt' | 'updatedAt'> {
  const firstName = firstNames[randomInt(0, firstNames.length - 1)];
  const lastName = lastNames[randomInt(0, lastNames.length - 1)];
  const name = `${firstName} ${lastName}`;
  const phone = `9${randomInt(800000000, 999999999)}`;

  const hasGstin = Math.random() > 0.4;
  const gstin = hasGstin
    ? `${randomInt(20, 29)}${Array(5).fill(0).map(() => randomInt(0, 9)).join('')}${firstName.substring(0, 3).toUpperCase()}${randomInt(0, 99999)}${randomInt(0, 9)}`
    : undefined;

  const openingOutstanding = Math.abs(randomFloat(-50000, 50000));

  return {
    name,
    phone,
    gstin,
    address: `${randomInt(1, 100)}, ${Array(4).fill(0).map(() => String.fromCharCode(randomInt(65, 90))).join('')} Road, City`,
    openingOutstanding,
    currentOutstanding: openingOutstanding,
  };
}

/**
 * Generate invoice item
 */
function randomInvoiceItem(): InvoiceItem {
  const skuNum = randomInt(1, 9999).toString().padStart(4, '0');
  const qty = randomInt(1, 10);
  const rate = randomFloat(100, 5000);
  const discountPercent = randomInt(0, 50);
  const gstRate = GST_RATES[randomInt(0, GST_RATES.length - 1)];
  const amount = Number((rate * qty * (1 - discountPercent / 100) * (1 + gstRate / 100)).toFixed(2));

  return {
    itemId: `item-${randomInt(1, 999)}`,
    sku: `SKU-${skuNum}`,
    name: `Item ${skuNum}`,
    qty,
    rate,
    discountPercent,
    discount: Number((rate * qty * discountPercent / 100).toFixed(2)),
    gstRate,
    amount,
  };
}

/**
 * Generate a random invoice
 */
function randomInvoice(items: InvoiceItem[], parties: Party[]): Invoice {
  const invoiceNo = `${INVOICE_PREFIX}-${randomInt(100, 999)}`;
  const party = parties[randomInt(0, parties.length - 1)];
  const date = new Date().toISOString().split('T')[0];

  const subtotal = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const discount = Number((subtotal * randomInt(0, 20) / 100).toFixed(2));
  const taxableAmount = Number((subtotal - discount).toFixed(2));
  const gstRate = party.gstin !== undefined ? 18 : 12;
  const gst = Number((taxableAmount * gstRate / 100).toFixed(2));
  const total = Number((taxableAmount + gst).toFixed(2));

  return {
    id: `inv-${randomInt(1000, 9999)}`,
    invoiceNo,
    date,
    dueDate: undefined,
    partyId: party.id,
    partyName: party.name,
    items,
    subtotal,
    discount,
    taxableAmount,
    gst,
    total,
    paymentMode: PAYMENT_MODES[randomInt(0, PAYMENT_MODES.length - 1)],
    amountReceived: randomFloat(0, total),
    status: INVOICE_STATUSES[randomInt(0, INVOICE_STATUSES.length - 1)],
    paymentRef: undefined,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a random purchase
 */
function randomPurchase(): Purchase {
  const purchaseNo = `${PURCHASE_PREFIX}-${randomInt(100, 999)}`;
  const item = randomItem();

  return {
    id: `p-${randomInt(1, 999)}`,
    refNo: purchaseNo,
    itemId: item.sku,
    itemName: item.name,
    qty: randomInt(1, 50),
    rate: randomFloat(100, 5000),
    note: `Purchase note for ${item.name}`,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a random payment
 */
function randomPayment(parties: Party[]): Payment {
  const paymentNo = `${PAYMENT_PREFIX}-${randomInt(100, 999)}`;
  const party = parties[randomInt(0, parties.length - 1)];
  const amount = randomFloat(1000, 50000);

  return {
    id: `pc-${randomInt(1, 999)}`,
    refNo: paymentNo,
    partyId: party.id,
    invoiceId: undefined,
    amount,
    paymentMode: PAYMENT_MODES[randomInt(0, PAYMENT_MODES.length - 1)],
    paymentRef: `Ref-${randomInt(1000, 9999)}`,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a random return
 */
function randomReturn(parties: Party[]): Return {
  const returnNo = `${RETURN_PREFIX}-${randomInt(100, 999)}`;
  const party = parties[randomInt(0, parties.length - 1)];
  const amount = randomFloat(500, 20000);

  return {
    id: `r-${randomInt(1, 999)}`,
    refNo: returnNo,
    partyId: party.id,
    invoiceId: undefined,
    amount,
    reason: `Return reason for ${party.name}`,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a stock movement
 */
function randomStockMovement(item: Item): StockMovement {
  const type = STOCK_MOVEMENT_TYPES[randomInt(0, STOCK_MOVEMENT_TYPES.length - 1)];
  const qty = randomInt(1, 100);

  return {
    id: `sm-${randomInt(1, 999)}`,
    itemId: item.sku,
    type,
    qty,
    refId: undefined,
    date: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    balance: randomInt(1, 500),
  };
}

/**
 * Generate 10 random items
 */
export function generateTempItems(): Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[] {
  return Array.from({ length: 10 }, () => randomItem());
}

/**
 * Generate 10 random parties
 */
export function generateTempParties(): Omit<Party, 'id' | 'createdAt' | 'updatedAt'>[] {
  return Array.from({ length: 10 }, () => randomParty());
}

/**
 * Generate 5 random invoices with items
 */
export function generateTempInvoices(
  parties: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>[]
): Invoice[] {
  const invoiceItems = Array.from({ length: 3 }, () => randomInvoiceItem());
  return Array.from({ length: 5 }, () =>
    randomInvoice(invoiceItems, parties as Party[]) as unknown as Invoice
  );
}

/**
 * Generate 5 random purchases
 */
export function generateTempPurchases(): Purchase[] {
  return Array.from({ length: 5 }, () => randomPurchase() as unknown as Purchase);
}

/**
 * Generate 5 random payments
 */
export function generateTempPayments(parties: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>[]): Payment[] {
  return Array.from({ length: 5 }, () => randomPayment(parties as Party[]) as unknown as Payment);
}

/**
 * Generate 3 random returns
 */
export function generateTempReturns(parties: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>[]): Return[] {
  return Array.from({ length: 3 }, () => randomReturn(parties as Party[]) as unknown as Return);
}

/**
 * Generate 5 random stock movements
 */
export function generateTempStockMovements(
  items: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]
): StockMovement[] {
  return Array.from({ length: 5 }, () =>
    randomStockMovement(items[0] as Item) as unknown as StockMovement
  );
}