# Implementation Plan: Inventory Management System

**Project:** Inventory App (React 19 + Tailwind 4 + TypeScript + Vite)
**Data Storage:** localStorage only — no API, no backend, no auth
**UI Reference:** `docs/` folder — 5 mockup images
**Architecture:** Module-wise file system with `createBrowserRouter` (React Router v7)

---

## 1. Tech Stack (confirmed in package.json)

| Layer | Version |
|-------|---------|
| React | 19.3.0 |
| Tailwind CSS | 4.1.0 |
| TypeScript | ~5.8.2 |
| Router | react-router-dom ^7.5.0 |
| State | localStorage + React useState/useEffect |
| Styling | Tailwind utility classes |
| Build | Vite ^6.2.0 |

---

## 2. Module-wise File Structure (flat)

```
src/
├── main.tsx              # createBrowserRouter + RouterProvider
├── App.tsx               # Outlet shell (no Routes)
├── routes.tsx            # Central route registry — all routes listed here
├── index.css
│
├── shared/               # Only what is truly cross-module
│   ├── components/
│   │   ├── Layout.tsx            # Shell + navigation loading spinner
│   │   ├── Sidebar.tsx           # Navigation
│   │   ├── Header.tsx            # Top bar
│   │   ├── Loading.tsx           # Simple spinner for route transitions
│   │   ├── NotFound.tsx          # 404 page (Tailwind + shadcn)
│   │   ├── ErrorPage.tsx         # Generic error page
│   │   └── RouteError.tsx        # React Router errorElement UI
│   │   └── ui/                   # shadcn primitives (button, input, dialog, table, …)
│   ├── lib/                      # utils, storage, constants
│   └── types.ts                  # Shared types
│
├── modules/              # One flat folder per business feature
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   └── types.ts
│   │
│   ├── inventory/              # Items + Stock
│   │   ├── Items.tsx
│   │   ├── ItemsStock.tsx
│   │   ├── LowStock.tsx
│   │   ├── StockMovements.tsx
│   │   ├── ItemModal.tsx
│   │   ├── ItemSelector.tsx
│   │   ├── useItems.ts
│   │   └── types.ts
│   │
│   ├── parties/
│   │   ├── Parties.tsx
│   │   ├── PartyLedger.tsx
│   │   ├── PartyModal.tsx
│   │   ├── useParties.ts
│   │   ├── partyCalc.ts
│   │   └── types.ts
│   │
│   ├── sales/                  # Invoices
│   │   ├── Invoices.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceView.tsx
│   │   ├── useInvoices.ts
│   │   ├── invoiceCalc.ts
│   │   └── types.ts
│   │
│   ├── purchases/
│   │   ├── Purchases.tsx
│   │   ├── PurchaseModal.tsx
│   │   ├── usePurchases.ts
│   │   └── types.ts
│   │
│   └── payments/
│       └── usePayments.ts
│
└── assets/               # Images, icons (optional)
```

### Module rules
- **No subfolders** — every file for a feature lives directly in its module folder.
- **No barrel files (`index.ts`)** — import directly from the file you need.
- **No per-module `routes.tsx`** — all routes live in `src/routes.tsx`.
- **`shared/` only for cross-module code** — Layout, Sidebar, shadcn UI primitives, storage, utils.
- **Path aliases** — `@/modules`, `@/shared` added to `vite.config.ts` and `tsconfig.json`.

---

## 3. Routes

| Route | Module | Page |
|-------|--------|------|
| `/` | dashboard | Dashboard |
| `/items-stock` | inventory | ItemsStock (tabs: Items / Stock Movements) |
| `/items` | inventory | Items |
| `/stock-movements` | inventory | StockMovements |
| `/low-stock` | inventory | LowStock |
| `/parties` | parties | Parties |
| `/parties/:id/ledger` | parties | PartyLedger |
| `/sales/new` | sales | InvoiceForm (create) |
| `/sales/invoices` | sales | Invoices |
| `/sales/invoices/:id` | sales | InvoiceView |
| `/sales/invoices/:id/edit` | sales | InvoiceForm (edit) |
| `/purchases` | purchases | Purchases |
| `*` | shared | NotFound (404) |

---

## 4. Loading & Error Handling

- **Route transitions:** `Layout.tsx` uses `useNavigation()` from React Router v7. When `navigation.state === 'loading'`, the simple `Loading.tsx` spinner is shown instead of page content.
- **404:** `NotFound.tsx` (rebuilt with Tailwind + shadcn Card) is the catch-all `*` route, registered last in `routes.ts`.
- **Route errors:** Root route sets `errorElement: <RouteError />` to catch unexpected errors in any module.

---

## 5. Data Model — localStorage Schema

All data persisted in `browser localStorage` as JSON.

### 5.1 Items (`items` key)
```ts
interface Item {
  id: string;
  sku: string;
  name: string;
  category?: string;
  sellingPrice: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  unit: 'PCS' | 'BOX' | 'KG' | 'etc.';
  openingStock: number;
  currentStock: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5.2 Parties (`parties` key)
```ts
interface Party {
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
```

### 5.3 Invoices (`invoices` key)
```ts
interface InvoiceItem {
  itemId: string;
  sku: string;
  name: string;
  qty: number;
  rate: number;
  discountPercent: number;
  discount: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate?: string;
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gst: number;
  total: number;
  paymentMode: 'None' | 'Cash' | 'Bank' | 'UPI' | 'etc.';
  amountReceived: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentRef?: string;
  createdAt: string;
}
```

### 5.4 Stock Movements (`stockMovements` key)
```ts
interface StockMovement {
  id: string;
  itemId: string;
  type: 'Opening Stock' | 'Sales' | 'Purchase' | 'Adjustment';
  qty: number;
  refId?: string;
  date: string;
  balance: number;
}
```

### 5.5 Purchases, Payments, Returns
- **Purchase:** id, refNo, itemId, itemName, qty, rate?, note, date, createdAt
- **Payment:** id, refNo, partyId, invoiceId?, amount, paymentMode, paymentRef?, date, createdAt
- **Return:** id, refNo, partyId, invoiceId?, amount, reason?, date, createdAt

---

## 6. Key Validations

- Duplicate SKU blocked on item save
- Item deletion blocked if referenced by any invoice
- Party deletion blocked if referenced by any invoice
- Invoice line qty ≤ available stock (else Stock Validation Error)
- Payment amount: not negative, not > invoice amount
- GST rates restricted to 0/5/12/18/28%
- Units restricted to PCS/BOX/KG/etc.

---

## 7. Definition of Done

- [ ] Module-wise file structure implemented (src/modules/ per feature)
- [ ] `createBrowserRouter` replaces `<Routes>` in main.tsx
- [ ] Loading spinner shown on route transitions (useNavigation)
- [ ] 404 page (NotFound.tsx, Tailwind + shadcn) as catch-all `*` route
- [ ] Route error boundary (RouteError.tsx) on root route
- [ ] Path aliases `@/modules`, `@/shared` configured in vite + tsconfig
- [ ] No `axios`, no API calls, no backend dependency
- [ ] All data persists in `localStorage` and survives page refresh
- [ ] Build passes: `npm run build` (tsc + vite build)
- [ ] UI matches mockups in `docs/` folder
