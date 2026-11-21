import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { calcInvoice, calcLine, statusFrom } from '../lib/invoiceCalc';
import type { GSTRate, InvoiceItem, Party, InvoiceStatus } from '../lib/types';
import { GST_RATES } from '../lib/constants';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const EMPTY_ITEM: InvoiceItem = {
  itemId: '',
  sku: '',
  name: '',
  qty: 1,
  rate: 0,
  discount: 0,
  gstRate: 18,
  amount: 0,
};

export default function InvoiceForm() {
  const { items } = useItems();
  const { parties, addParty } = useParties();
  const { addInvoice, addMovement } = useInvoices();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [party, setParty] = useState<Party | null>(null);
  const [newPartyName, setNewPartyName] = useState('');
  const [invoiceLines, setInvoiceLines] = useState<InvoiceItem[]>([EMPTY_ITEM]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'UPI' | 'etc.'>(
    'Cash'
  );
  const [amountReceived, setAmountReceived] = useState(0);
  const [error, setError] = useState('');

  const { subtotal, discount, taxableAmount, gst, total } = calcInvoice(
    invoiceLines
  );

  const handlePartySelect = useCallback((p: Party) => {
    setParty(p);
    setStep(2);
  }, []);

  const handleAddNewParty = useCallback(() => {
    if (!newPartyName.trim()) return;
    const existing = parties.find((p) => p.name === newPartyName);
    if (existing) {
      setParty(existing);
      setStep(2);
      setNewPartyName('');
      return;
    }
    const newParty: Omit<Party, 'id' | 'createdAt' | 'updatedAt' | 'currentOutstanding'> = {
      name: newPartyName,
      phone: '',
      gstin: '',
      address: '',
      openingOutstanding: 0,
    };
    const created = addParty(newParty as any);
    setParty(created as Party);
    setStep(2);
    setNewPartyName('');
  }, [parties, newPartyName, addParty]);

  const addLine = useCallback(() => {
    setInvoiceLines([...invoiceLines, { ...EMPTY_ITEM }]);
  }, [invoiceLines]);

  const removeLine = useCallback((index: number) => {
    setInvoiceLines(invoiceLines.filter((_, i) => i !== index));
  }, []);

  const updateLine = useCallback(
    (index: number, field: keyof InvoiceItem, value: any) => {
      const next = [...invoiceLines];
      next[index] = { ...next[index], [field]: value };
      const line = calcLine(
        next[index].qty,
        next[index].rate,
        next[index].discount,
        next[index].gstRate
      );
      next[index].amount = line.amount;
      setInvoiceLines(next);
    },
    [invoiceLines]
  );

  const handleSave = useCallback(() => {
    setError('');
    if (!party) {
      setError('Please select a party.');
      return;
    }
    if (invoiceLines.some((l) => !l.itemId || l.qty <= 0)) {
      setError('All invoice lines must have a valid item and quantity.');
      return;
    }
    for (const line of invoiceLines) {
      const item = items.find((i) => i.id === line.itemId);
      if (item && line.qty > item.currentStock) {
        setError(
          `Stock validation error: "${item.name}" has only ${item.currentStock} available, but ${line.qty} requested.`
        );
        return;
      }
    }
    if (amountReceived < 0 || amountReceived > total) {
      setError('Amount received cannot be negative or exceed invoice total.');
      return;
    }

    const invoiceNo = `INV-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const now = new Date().toISOString();

    const status: InvoiceStatus = statusFrom(amountReceived, total) as InvoiceStatus;

    const invoice = {
      invoiceNo,
      date: now,
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
    };

    const saved = addInvoice(invoice);

    const nextItems = [...items];
    for (const line of invoiceLines) {
      const idx = nextItems.findIndex((i) => i.id === line.itemId);
      if (idx >= 0) {
        nextItems[idx].currentStock -= line.qty;
        addMovement({
          itemId: line.itemId,
          type: 'Sales',
          qty: -line.qty,
          refId: saved.id,
          date: now,
          balance: nextItems[idx].currentStock,
        });
      }
    }

    navigate(`/invoices/${saved.id}`);
  }, [
    party,
    invoiceLines,
    items,
    subtotal,
    discount,
    taxableAmount,
    gst,
    total,
    paymentMode,
    amountReceived,
    addInvoice,
    addMovement,
    navigate,
  ]);

  const statusColor: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    'Partially Paid': 'bg-amber-100 text-amber-700',
    Unpaid: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Sales Invoice</h1>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition ${
                step <= s ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Party Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Select Party</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search party by name or phone..."
                  className="pl-10"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">+ New Party</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Add New Party</DialogTitle>
                    <DialogDescription>
                      Enter party details to create a new customer/supplier.
                    </DialogDescription>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Party Name *</Label>
                        <Input
                          autoFocus
                          value={newPartyName}
                          onChange={(e) => setNewPartyName(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddNewParty}
                          disabled={!newPartyName.trim()}
                        >
                          Create & Select
                        </Button>
                        <Button variant="outline" onClick={() => setNewPartyName('')}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="max-h-60 overflow-y-auto border border-input rounded-lg bg-background">
                <ul>
                  {parties.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 text-sm">
                      No parties found. Click "+ New Party" to add one.
                    </p>
                  ) : (
                    parties.map((p) => (
                      <li key={p.id} className="border-b border-border last:border-0">
                        <button
                          onClick={() => handlePartySelect(p)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition flex justify-between"
                        >
                          <div>
                            <div className="font-medium text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.phone} • Outstanding:
                              {p.currentOutstanding.toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'INR',
                              })}
                            </div>
                          </div>
                          <span className="text-indigo-600 text-sm font-medium">
                            Select
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Item Selection */}
      {step === 2 && party && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <CardTitle>Step 2 — Select Items</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Party: <span className="font-medium">{party.name}</span>
                    {' | '} Previous Outstanding:
                    {party.currentOutstanding.toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'INR',
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <Input
                  type="text"
                  placeholder="Search items..."
                  className="col-span-2"
                />
                <Select defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="All items" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.sku}>
                        {i.sku} — {i.name} ({i.currentStock} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addLine}>Add Item</Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">SKU</TableHead>
                      <TableHead className="text-right">Available Stock</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-center">GST %</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead className="text-right">Remaining Stock</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceLines.map((line, idx) => {
                      const item = items.find((i) => i.id === line.itemId);
                      const remainingStock = item
                        ? item.currentStock - line.qty
                        : 0;
                      const lowStock = remainingStock <= 5;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            {item ? (
                              <span className="font-medium">{item.name}</span>
                            ) : (
                              <span className="text-destructive">Select item</span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {line.name || ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item ? item.sku : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item ? item.currentStock : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              className="w-full h-8 text-right"
                              value={line.qty}
                              onChange={(e) =>
                                updateLine(
                                  idx,
                                  'qty',
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-full h-8 text-right"
                              value={line.rate}
                              onChange={(e) =>
                                updateLine(
                                  idx,
                                  'rate',
                                  Math.max(0, parseFloat(e.target.value) || 0)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-full h-8 text-right"
                              value={line.discount}
                              onChange={(e) =>
                                updateLine(
                                  idx,
                                  'discount',
                                  Math.max(0, parseFloat(e.target.value) || 0)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Select
                              value={String(line.gstRate)}
                              onValueChange={(v: string) =>
                                updateLine(idx, 'gstRate', parseInt(v) as GSTRate)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GST_RATES.map((r) => (
                                  <SelectItem key={r} value={String(r)}>
                                    {r}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {line.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              lowStock
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {remainingStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => removeLine(idx)}
                              className="text-destructive hover:text-destructive/90 text-sm"
                            >
                              Remove
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Continue →
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Invoice Calculations */}
      {step === 3 && party && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3 — Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span>{taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">GST</span>
                  <span>{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2">
                  <span>Invoice Total</span>
                  <span>{total.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {invoiceLines.length} line item(s). GST calculated on taxable amount after discount.
                </p>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Payment Details →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Payment Details */}
      {step === 4 && party && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4 — Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Invoice Amount</Label>
                <p className="text-lg font-bold">{total.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label>Previous Outstanding</Label>
                <p className="text-lg font-bold">
                  {party.currentOutstanding.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Total Outstanding After Invoice</Label>
                <p className="text-lg font-bold text-destructive">
                  {(party.currentOutstanding + total).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(v: 'Cash' | 'Bank' | 'UPI' | 'etc.') =>
                    setPaymentMode(v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Cash', 'Bank', 'UPI', 'etc.'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <p className={`text-lg font-bold ${statusColor[statusFrom(amountReceived, total)]}`}>
                  {statusFrom(amountReceived, total)}
                </p>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(3)}>
                ← Back
              </Button>
              <Button onClick={handleSave}>
                Save Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Final Summary */}
      {step === 5 && party && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5 — Final Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Party: {party.name}</h3>
                <p className="text-sm text-gray-600">
                  Previous Outstanding:
                  <span className="font-medium">{party.currentOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-medium text-green-700 mb-2">Invoice Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{subtotal.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount (−)</span>
                    <span>-{discount.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxable Amount</span>
                    <span>{taxableAmount.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (18%)</span>
                    <span>{gst.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-green-200">
                    <span>Invoice Total</span>
                    <span>{total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setStep(4)}>
                  ← Back
                </Button>
                <Button onClick={handleSave}>
                  Save Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
