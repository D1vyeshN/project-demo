import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useItems } from '../hooks/useItems';
import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import {
  calcInvoice,
  calcLine,
  nextInvoiceNo,
  statusFrom,
} from '../lib/invoiceCalc';
import type {
  GSTRate,
  InvoiceItem,
  InvoiceStatus,
  Item,
  Party,
  PaymentMode,
  StockMovement,
} from '../lib/types';
import { generateId } from '../lib/storage';
import { DISCOUNT_PERCENTS, GST_RATES, PAYMENT_MODES } from '../lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import PartyModal from '../components/PartyModal';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => currency.format(value);

const toDateInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'border-green-200 bg-green-100 text-green-700',
  'Partially Paid': 'border-amber-200 bg-amber-100 text-amber-700',
  Unpaid: 'border-red-200 bg-red-100 text-red-700',
};

export default function InvoiceForm() {
  const { items, setItems } = useItems();
  const { parties, getParty, updateParty } = useParties();
  const { invoices, movements, addInvoice, setMovements } = useInvoices();
  const navigate = useNavigate();

  const [party, setParty] = useState<Party | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(() =>
    toDateInputValue(new Date())
  );
  const [invoiceLines, setInvoiceLines] = useState<InvoiceItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('None');
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');

  const [partySearch, setPartySearch] = useState('');
  const [partyOpen, setPartyOpen] = useState(false);
  const [partyModalOpen, setPartyModalOpen] = useState(false);

  const [itemSearch, setItemSearch] = useState('');
  const [itemOpen, setItemOpen] = useState(false);

  const partyBoxRef = useRef<HTMLDivElement>(null);
  const itemBoxRef = useRef<HTMLDivElement>(null);
  const itemSearchRef = useRef<HTMLInputElement>(null);

  const invoiceNo = useMemo(() => nextInvoiceNo(invoices), [invoices]);
  const { subtotal, discount, taxableAmount, gst, total } =
    calcInvoice(invoiceLines);

  const previousOutstanding = party?.currentOutstanding ?? 0;
  const balanceDue = Math.max(0, total - amountReceived);
  const outstandingAfter = previousOutstanding + total - amountReceived;
  const status = statusFrom(amountReceived, total) as InvoiceStatus;

  // Close dropdowns when clicking outside their wrappers
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (partyBoxRef.current && !partyBoxRef.current.contains(target)) {
        setPartyOpen(false);
      }
      if (itemBoxRef.current && !itemBoxRef.current.contains(target)) {
        setItemOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const partyQuery = partySearch.trim().toLowerCase();
  const filteredParties = useMemo(
    () =>
      parties.filter(
        (p) =>
          !partyQuery ||
          p.name.toLowerCase().includes(partyQuery) ||
          p.phone.toLowerCase().includes(partyQuery) ||
          (p.gstin ?? '').toLowerCase().includes(partyQuery)
      ),
    [parties, partyQuery]
  );

  const itemQuery = itemSearch.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      items.filter(
        (i) =>
          !itemQuery ||
          i.name.toLowerCase().includes(itemQuery) ||
          i.sku.toLowerCase().includes(itemQuery)
      ),
    [items, itemQuery]
  );

  // Aggregate qty per item so the same item in two rows cannot exceed stock
  const stockUsage = useMemo(() => {
    const usage = new Map<string, number>();
    for (const line of invoiceLines) {
      if (!line.itemId) continue;
      usage.set(line.itemId, (usage.get(line.itemId) ?? 0) + line.qty);
    }
    return usage;
  }, [invoiceLines]);

  const stockErrors = useMemo(() => {
    const errors: { item: Item; entered: number }[] = [];
    for (const [itemId, entered] of stockUsage) {
      const item = items.find((i) => i.id === itemId);
      if (item && entered > item.currentStock) {
        errors.push({ item, entered });
      }
    }
    return errors;
  }, [stockUsage, items]);

  const selectParty = (selected: Party) => {
    setParty(selected);
    setPartyOpen(false);
    setPartySearch('');
    setError('');
  };

  const addItemToLines = (item: Item) => {
    const line = calcLine(1, item.sellingPrice, 0, item.gstRate);
    setInvoiceLines((prev) => [
      ...prev,
      {
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        qty: 1,
        rate: item.sellingPrice,
        discountPercent: 0,
        discount: line.discountAmount,
        gstRate: item.gstRate,
        amount: line.amount,
      },
    ]);
    setItemSearch('');
    setItemOpen(false);
    setError('');
  };

  const removeLine = (index: number) => {
    setInvoiceLines((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const updateLine = (
    index: number,
    field: keyof InvoiceItem,
    value: InvoiceItem[keyof InvoiceItem]
  ) => {
    setInvoiceLines((prev) => {
      const next = [...prev];
      const line = { ...next[index], [field]: value };
      const calculated = calcLine(
        line.qty,
        line.rate,
        line.discountPercent,
        line.gstRate
      );
      line.discount = calculated.discountAmount;
      line.amount = calculated.amount;
      next[index] = line;
      return next;
    });
    setError('');
  };

  const openItemSearch = () => {
    setItemOpen(true);
    itemSearchRef.current?.focus();
  };

  const isDirty =
    Boolean(party) ||
    invoiceLines.length > 0 ||
    amountReceived > 0 ||
    paymentRef.trim() !== '';

  const handleCancel = () => {
    if (isDirty && !window.confirm('Discard this invoice?')) return;
    navigate('/sales/invoices');
  };

  const handleSave = () => {
    setError('');

    if (!party) {
      setError('Please select a party.');
      return;
    }
    if (invoiceLines.length === 0) {
      setError('Please add at least one item to the invoice.');
      return;
    }
    if (invoiceLines.some((l) => !l.itemId || l.qty <= 0)) {
      setError('All invoice lines must have a valid item and quantity.');
      return;
    }
    if (stockErrors.length > 0) {
      setError(
        stockErrors
          .map(
            ({ item, entered }) =>
              `Insufficient Stock: "${item.name}" — you have entered ${entered} units, but only ${item.currentStock} are available.`
          )
          .join(' ')
      );
      return;
    }
    if (amountReceived < 0 || amountReceived > total) {
      setError('Amount received cannot be negative or exceed the invoice total.');
      return;
    }

    const dateISO = new Date(`${invoiceDate}T12:00:00`).toISOString();
    const now = new Date().toISOString();

    const saved = addInvoice({
      invoiceNo,
      date: dateISO,
      partyId: party.id,
      partyName: party.name,
      items: invoiceLines,
      subtotal,
      discount,
      taxableAmount,
      gst,
      total,
      paymentMode,
      amountReceived,
      status,
      paymentRef: paymentRef.trim() || undefined,
    });

    // Deduct stock and record movements
    const nextItems = items.map((i) => ({ ...i }));
    const newMovements: StockMovement[] = [];

    for (const line of invoiceLines) {
      const item = nextItems.find((i) => i.id === line.itemId);
      if (!item) continue;
      item.currentStock -= line.qty;
      newMovements.push({
        id: generateId(),
        itemId: line.itemId,
        type: 'Sales',
        qty: -line.qty,
        refId: saved.id,
        date: now,
        balance: item.currentStock,
      });
    }

    setItems(nextItems);
    if (newMovements.length > 0) {
      setMovements([...movements, ...newMovements]);
    }

    const latestParty = getParty(party.id) ?? party;
    updateParty(party.id, {
      currentOutstanding:
        latestParty.currentOutstanding + total - amountReceived,
    });

    navigate(`/sales/invoices/${saved.id}`);
  };

  return (
    <div className="pb-10">
      {/* Page heading + actions */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Sales Invoice
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a party, add items and record the payment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
          >
            Save Invoice
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Party + invoice meta */}
      <Card className="mb-5">
        <CardContent className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Label className="mb-1.5 block">
              Select Party <span className="text-red-500">*</span>
            </Label>

            <div className="flex items-start gap-2">
              <div className="relative flex-1" ref={partyBoxRef}>
                <button
                  type="button"
                  onClick={() => setPartyOpen((open) => !open)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span
                    className={cn(
                      'truncate',
                      party ? 'text-gray-900' : 'text-muted-foreground'
                    )}
                  >
                    {party ? party.name : 'Select party'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>

                {partyOpen && (
                  <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-input bg-popover shadow-lg">
                    <div className="border-b border-gray-100 p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          autoFocus
                          value={partySearch}
                          onChange={(e) => setPartySearch(e.target.value)}
                          placeholder="Search party by name, phone or GSTIN..."
                          className="h-9 pl-8"
                        />
                      </div>
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                      {filteredParties.length === 0 ? (
                        <li className="px-3 py-3 text-center text-sm text-gray-500">
                          No parties found.
                        </li>
                      ) : (
                        filteredParties.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => selectParty(p)}
                              className="w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gray-900">
                                  {p.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatINR(p.currentOutstanding)}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-gray-500">
                                {p.phone || 'No phone'}
                                {p.gstin ? ` · ${p.gstin}` : ''}
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setPartyModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                New Party
              </Button>
            </div>

            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
              <p>
                <span className="font-medium text-gray-600">GSTIN:</span>{' '}
                {party?.gstin || '—'}
              </p>
              <p className="truncate">
                <span className="font-medium text-gray-600">Address:</span>{' '}
                {party?.address || '—'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex h-full flex-col justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-700">
                Previous Outstanding
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatINR(previousOutstanding)}
              </p>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="invoiceDate" className="mb-1.5 block">
                  Invoice Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invoiceNo" className="mb-1.5 block">
                  Invoice No
                </Label>
                <Input
                  id="invoiceNo"
                  readOnly
                  value={invoiceNo}
                  className="bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice items */}
      <Card className="mb-5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Invoice Items</CardTitle>
            <span className="text-sm text-gray-500">
              {invoiceLines.length} item{invoiceLines.length === 1 ? '' : 's'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1" ref={itemBoxRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={itemSearchRef}
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  setItemOpen(true);
                }}
                onFocus={() => setItemOpen(true)}
                placeholder="Search by item name or SKU..."
                className="pl-9"
              />

              {itemOpen && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-input bg-popover shadow-lg">
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {filteredItems.length === 0 ? (
                      <li className="px-4 py-4 text-center text-sm text-gray-500">
                        No items found. Add items in Items &amp; Stock first.
                      </li>
                    ) : (
                      filteredItems.map((i) => (
                        <li key={i.id}>
                          <button
                            type="button"
                            onClick={() => addItemToLines(i)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-blue-50"
                          >
                            {i.imageUrl ? (
                              <img
                                src={i.imageUrl}
                                alt={i.name}
                                className="h-10 w-10 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100">
                                <Package className="h-5 w-5 text-gray-400" />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-gray-900">
                                {i.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                SKU: {i.sku} · Stock: {i.currentStock} ·{' '}
                                {formatINR(i.sellingPrice)} · GST: {i.gstRate}%
                              </span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            <Button
              type="button"
              className="shrink-0 bg-blue-600 hover:bg-blue-700"
              onClick={openItemSearch}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {stockErrors.length > 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Insufficient Stock</p>
                {stockErrors.map(({ item, entered }) => (
                  <p key={item.id} className="mt-0.5">
                    You have entered {entered} units of &quot;{item.name}
                    &quot;, but only {item.currentStock} units are available in
                    stock.
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <Table className="min-w-[1100px] [&_th]:normal-case [&_th]:tracking-normal">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Available Stock</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Rate (₹)</TableHead>
                  <TableHead className="text-center">Discount %</TableHead>
                  <TableHead className="text-center">GST %</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead className="text-right">Remaining Stock</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceLines.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No items added yet. Search above or click &quot;Add Item&quot;
                      to add items to the invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoiceLines.map((line, idx) => {
                    const item = items.find((i) => i.id === line.itemId);
                    const usedToHere = invoiceLines
                      .slice(0, idx + 1)
                      .reduce(
                        (sum, l) =>
                          l.itemId === line.itemId ? sum + l.qty : sum,
                        0
                      );
                    const remaining = item ? item.currentStock - usedToHere : 0;
                    const isOver = stockErrors.some(
                      (e) => e.item.id === line.itemId
                    );
                    const discountOptions = DISCOUNT_PERCENTS.includes(
                      line.discountPercent
                    )
                      ? DISCOUNT_PERCENTS
                      : [...DISCOUNT_PERCENTS, line.discountPercent].sort(
                          (a, b) => a - b
                        );

                    return (
                      <TableRow key={`${line.itemId}-${idx}`}>
                        <TableCell className="px-3 py-2 text-gray-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="px-3 py-2 font-medium text-gray-900">
                          {line.name || item?.name || '—'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-gray-600">
                          {line.sku || item?.sku || '—'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-medium text-amber-600">
                          {item ? item.currentStock : '—'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                'qty',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className={cn(
                              'mx-auto h-9 w-20 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                              isOver &&
                                'border-red-400 focus-visible:ring-red-400'
                            )}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.rate}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                'rate',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="ml-auto h-9 w-24 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
                          <Select
                            value={String(line.discountPercent)}
                            onValueChange={(value) =>
                              updateLine(idx, 'discountPercent', Number(value))
                            }
                          >
                            <SelectTrigger className="mx-auto h-9 w-24">
                              <SelectValue>{line.discountPercent}%</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {discountOptions.map((percent) => (
                                <SelectItem
                                  key={percent}
                                  value={String(percent)}
                                >
                                  {percent}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
                          <Select
                            value={String(line.gstRate)}
                            onValueChange={(value) =>
                              updateLine(
                                idx,
                                'gstRate',
                                parseInt(value, 10) as GSTRate
                              )
                            }
                          >
                            <SelectTrigger className="mx-auto h-9 w-20">
                              <SelectValue>{line.gstRate}%</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {GST_RATES.map((rate) => (
                                <SelectItem key={rate} value={String(rate)}>
                                  {rate}%
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-medium text-gray-900">
                          {formatINR(line.amount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'px-3 py-2 text-right font-semibold',
                            remaining < 0 ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {item ? remaining : '—'}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            aria-label={`Remove ${line.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment + summary */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Invoice Amount
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {formatINR(total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Discount
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  −{formatINR(discount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amountReceived" className="mb-1.5 block">
                  Amount Received <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amountReceived"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(parseFloat(e.target.value) || 0);
                    setError('');
                  }}
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Payment Mode</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(value) =>
                    setPaymentMode(value as PaymentMode)
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{paymentMode}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentRef" className="mb-1.5 block">
                Reference No (Optional)
              </Label>
              <Input
                id="paymentRef"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. UPI / cheque reference"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={statusStyles[status]}>{status}</Badge>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-right">
                <p className="text-xs font-medium text-blue-700">Balance Due</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatINR(balanceDue)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Total Outstanding After Balance
                </p>
                <p className="text-xs text-green-700">
                  Previous outstanding + Invoice total − Amount received
                </p>
              </div>
              <p className="text-xl font-bold text-green-700">
                {formatINR(outstandingAfter)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatINR(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
              <span className="text-gray-600">Discount (−)</span>
              <span className="font-medium text-gray-900">
                {formatINR(discount)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
              <span className="text-gray-600">Taxable Amount</span>
              <span className="font-medium text-gray-900">
                {formatINR(taxableAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
              <span className="text-gray-600">GST</span>
              <span className="font-medium text-gray-900">
                {formatINR(gst)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md bg-blue-100 px-3 py-3">
              <span className="text-base font-semibold text-gray-900">
                Invoice Total
              </span>
              <span className="text-xl font-bold text-blue-800">
                {formatINR(total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
          Save Invoice
        </Button>
      </div>

      <PartyModal
        open={partyModalOpen}
        onOpenChange={setPartyModalOpen}
        onSaved={(created) => {
          selectParty(created);
        }}
      />
    </div>
  );
}
