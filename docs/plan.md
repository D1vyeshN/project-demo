# Implementation Plan: Inventory Management System

**Project:** Inventory App (Next.js 16 + React 19 + Tailwind 4 + TypeScript)
**Data Storage:** localStorage only — no API, no backend, no auth
**UI Reference:** `docs/` folder — 5 mockup images

---

## 1. Docs / Mockup Reference

All 5 WhatsApp screenshots renamed and moved into `docs/`:

| File | Mockup Section | Content |
|------|---------------|---------|
| `docs/01-item-master-stock-management.jpeg` | 01–02 | Item Master & Stock Management, Party Master |
| `docs/03-sales-invoice-creation.jpeg` | 03 | Sales Invoice Creation (party selection, item selection, calculations) |
| `docs/04-payment-details.jpeg` | 04 | Payment Details (amount received, status, remaining due) |
| `docs/05-sample-data.jpeg` | 05 | Sample Inventory Data & Expected Invoice Calculation |
| `docs/ui-dashboard-mockup.jpeg` | 01–14 | Full UI dashboard mockup (14 screens) |

---

## 2. Tech Stack (confirmed in package.json)

| Layer | Version |
|-------|---------|
| Next.js | 16.4.6 (App Router) |
| React | 19.3.0 |
| Tailwind CSS | 4.3.3 |
| TypeScript | ^5 |
| State | localStorage + React useState/useEffect |
| Styling | Tailwind utility classes |

---

## 3. Data Model — localStorage Schema

All data persisted in `browser localStorage` as JSON.

### 3.1 Items (`items` key)
```ts
interface Item {
  id: string;              // uuid
  sku: string;             // unique, e.g. "ITM001"
  name: string;            // e.g. "Laptop"
  sellingPrice: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  unit: 'PCS' | 'BOX' | 'KG' | 'etc.';
  openingStock: number;
  currentStock: number;    // derived from openingStock - sold + received
  createdAt: string;       // ISO
  updatedAt: string;
}
```

### 3.2 Parties (`parties` key)
```ts
interface Party {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  openingOutstanding: number;   // starting balance
  currentOutstanding: number;   // derived
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Invoices (`invoices` key)
```ts
interface InvoiceItem {
  itemId: string;
  sku: string;
  name: string;
  qty: number;
  rate: number;
  discount: number;       // percent or fixed
  gstRate: 0 | 5 | 12 | 18 | 28;
  amount: number;         // line total after discount + GST
}

interface Invoice {
  id: string;
  invoiceNo: string;      // e.g. "INV-005"
  date: string;
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gst: number;
  total: number;
  paymentMode: 'Cash' | 'Bank' | 'UPI' | 'etc.';
  amountReceived: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentRef?: string;
  createdAt: string;
}
```

### 3.4 Stock Movements (`stockMovements` key) — audit log
```ts
interface StockMovement {
  id: string;
  itemId: string;
  type: 'Opening Stock' | 'Sales' | 'Purchase' | 'Adjustment';
  qty: number;            // positive for in, negative for out
  refId?: string;         // invoice id if sales
  date: string;
  balance: number;        // running stock balance after this movement
}
```

---

## 4. Page Structure (Next.js App Router)

| Route | Page | Mockup Ref | Purpose |
|-------|------|------------|---------|
| `/` | Dashboard | 01 | KPI cards (sales, receivables, stock value, low stock), recent sales, chart |
| `/items` | Item Master List | 02 | Table of items, search, low-stock badges, add/edit/delete |
| `/items/new` | Item Master Add/Edit | 03 | Form: name, SKU, selling price, GST rate, opening stock, unit |
| `/parties` | Party Master List | 04 | Table of parties, outstanding balance, search |
| `/parties/new` | Party Master Add/Edit | 05 | Form: name, phone, GSTIN, address, opening outstanding |
| `/invoices/new` | Sales Invoice Creation | 06–10 | Party select → item select → calculations → payment details → save |
| `/invoices/[id]` | Saved Invoice View | 11 | View saved invoice, print/share/delete |
| `/parties/[id]/ledger` | Party Ledger / Outstanding | 12 | Per-party transaction history with running balance |
| `/stock-movements` | Stock Movements | 13 | Item-wise stock in/out log |
| `/low-stock` | Low Stock Alert | 14 | Items below reorder level |

---

## 5. Feature Specifications

### 5.1 Item Master (sections 01–02)
- **Fields:** Item Name, SKU/Item Code, Selling Price, GST Rate (0/5/12/18/28%), Opening Stock Qty, Unit of Measurement
- **Validations:**
  - Prevent duplicate SKUs
  - Prevent invalid/negative stock quantities
  - **Do not allow deleting an item already used in a sales transaction**
- **Actions:** Add, Edit, Delete, display in table with current available stock

### 5.2 Party Master (sections 01–02)
- **Fields:** Party Name, Phone Number, GSTIN (optional), Billing Address, Opening Outstanding Balance
- **Validations:**
  - Prevent deleting parties associated with existing invoices
- **Auto-update:** outstanding balance updates when invoices/payments saved

### 5.3 Sales Invoice Creation (section 03)
**Step 1 — Party Selection:**
- Search and select existing party
- Auto-display: current outstanding balance, GSTIN, address

**Step 2 — Item Selection:**
- Item search dropdown (while adding)
- Show available stock, selling price, GST rate per item
- Allow multiple items per invoice
- Edit qty, price, discount, GST rate per line
- Show projected stock remaining after proposed sale
- **Block** selling more than available stock (Stock Validation Error)

**Step 3 — Invoice Calculations (auto):**
- Line subtotal, discount (percentage or fixed), taxable amount, GST, final total
- GST calculated on taxable amount (after discount)
- Handle rounding consistently; reject negative/invalid qty, price, discount

**Step 4 — Payment Details (section 04):**
- Invoice Amount, Previous Outstanding Balance, Amount Received, Payment Mode (Cash/Bank/UPI/etc.), optional Payment Reference, Remaining Amount Due
- Status: Paid / Partially Paid / Unpaid
- Reject negative payments and payments exceeding invoice amount

**Step 5 — Final Summary (section 10):**
- Subtotal, Discount, Taxable Amount, GST (18%), Invoice Total

**On Save:**
- Deduct sold quantities from item stock
- Update party outstanding balance (add invoice total, subtract amount received)
- Save invoice + payment to localStorage
- Create stock movement records
- Display payment status badge

### 5.4 Payment (embedded in invoice flow)
- Modes: Cash, Bank, UPI, etc.
- Status logic:
  - **Paid:** amount received == invoice amount
  - **Partially Paid:** amount received > 0 but < invoice amount
  - **Unpaid:** no payment received
- Previous outstanding shown separately and included in party's total outstanding

---

## 6. Reporting / Secondary Screens

| Screen | Mockup | Purpose |
|--------|--------|---------|
| Dashboard Overview | 01 | KPI cards + Recent Sales table + Sales Overview chart |
| Saved Invoice View | 11 | View saved invoice; Print/Share/Delete |
| Party Ledger / Outstanding | 12 | Per-party transaction history with running balance |
| Stock Movements | 13 | Item-wise stock in/out log with dates and references |
| Low Stock Alert | 14 | Items below reorder level |

---

## 7. Implementation Phases

| Phase | Work | Status |
|-------|------|--------|
| **Phase 0** | Remove auth/API/backend; rename project; Next.js setup | ✅ Complete |
| **Phase 1** | Set up localStorage helpers + constants + types | Pending |
| **Phase 2** | Item Master: types, CRUD, list page, add/edit page, validations | Pending |
| **Phase 3** | Party Master: types, CRUD, list page, add/edit page, outstanding balance | Pending |
| **Phase 4** | Sales Invoice: party select, item select, calculations, payment details, save (stock + party update) | Pending |
| **Phase 5** | Saved Invoice View + Party Ledger + Stock Movements + Low Stock Alert + Dashboard | Pending |

---

## 8. Key Validations

- Duplicate SKU blocked on item save
- Item deletion blocked if referenced by any invoice
- Party deletion blocked if referenced by any invoice
- Invoice line qty ≤ available stock (else Stock Validation Error)
- Payment amount: not negative, not > invoice amount
- GST rates restricted to 0/5/12/18/28%
- Units restricted to PCS/BOX/KG/etc.

---

## 9. Files to Create (Phase 1–5)

```
src/
  lib/
    storage.ts          # localStorage get/set helpers
    constants.ts        # GST rates, units, payment modes
    types.ts            # TypeScript interfaces
  app/
    items/
      page.tsx          # Item Master List
      new/
        page.tsx        # Item Master Add/Edit
    parties/
      page.tsx          # Party Master List
      new/
        page.tsx        # Party Master Add/Edit
      [id]/
        ledger/
          page.tsx      # Party Ledger
    invoices/
      new/
        page.tsx        # Sales Invoice Creation
      [id]/
        page.tsx        # Saved Invoice View
    stock-movements/
      page.tsx
    low-stock/
      page.tsx
    page.tsx            # Dashboard
```

---

## 10. Definition of Done

- [ ] No `axios`, no API calls, no backend dependency
- [ ] All data persists in `localStorage` and survives page refresh
- [ ] Item Master: CRUD + duplicate SKU block + no-delete-if-used
- [ ] Party Master: CRUD + outstanding balance + no-delete-if-used
- [ ] Sales Invoice: party/item selection, auto calculations, payment details, stock deduction
- [ ] Payment status: Paid / Partially Paid / Unpaid
- [ ] Reports: Dashboard, Saved Invoice, Party Ledger, Stock Movements, Low Stock Alert
- [ ] UI matches mockups in `docs/` folder
