import { useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { calcInvoice, calcLine, statusFrom } from '../lib/invoiceCalc';
import type { GSTRate, InvoiceItem, Party, InvoiceStatus, PaymentMode } from '../lib/types';
import { DISCOUNT_PERCENTS, GST_RATES, PAYMENT_MODES } from '../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const EMPTY_ITEM: InvoiceItem = {
  itemId: '',
  sku: '',
  name: '',
  qty: 1,
  rate: 0,
  discountPercent: 0,
  discount: 0,
  gstRate: 18,
  amount: 0,
};

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const { items, setItems } = useItems();
  const { parties, updateParty } = useParties();
  const { invoices, updateInvoice } = useInvoices();
  const navigate = useNavigate();

  const invoice = invoices.find((inv) => inv.id === id);

  // All hooks must run unconditionally — initialize with invoice data if available
  const [party, setParty] = useState<Party | null>(
    invoice ? parties.find((p) => p.id === invoice.partyId) || null : null
  );
  const [invoiceLines, setInvoiceLines] = useState<InvoiceItem[]>(
    invoice ? [...invoice.items] : [EMPTY_ITEM]
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    invoice ? invoice.paymentMode : 'None'
  );
  const [amountReceived, setAmountReceived] = useState(
    invoice ? invoice.amountReceived : 0
  );
  const [error, setError] = useState('');

  const { subtotal, discount, taxableAmount, gst, total } = calcInvoice(
    invoiceLines
  );

  const addLine = useCallback(() => {
    setInvoiceLines([...invoiceLines, { ...EMPTY_ITEM }]);
  }, [invoiceLines]);

  const removeLine = useCallback((index: number) => {
    setInvoiceLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLine = useCallback(
    (index: number, field: keyof InvoiceItem, value: any) => {
      const next = [...invoiceLines];
      next[index] = { ...next[index], [field]: value };
      const line = calcLine(
        next[index].qty,
        next[index].rate,
        next[index].discountPercent,
        next[index].gstRate
      );
      next[index].discount = line.discountAmount;
      next[index].amount = line.amount;
      setInvoiceLines(next);
    },
    [invoiceLines]
  );

  const handleSave = useCallback(() => {
    setError('');
    if (!invoice) return;
    if (!party) {
      setError('Please select a party.');
      return;
    }
    if (invoiceLines.some((l) => !l.itemId || l.qty <= 0)) {
      setError('All invoice lines must have a valid item and quantity.');
      return;
    }
    if (amountReceived < 0 || amountReceived > total) {
      setError('Amount received cannot be negative or exceed invoice total.');
      return;
    }

    const now = new Date().toISOString();

    const status: InvoiceStatus = statusFrom(amountReceived, total) as InvoiceStatus;

    const updates = {
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

    // --- Stock re-adjustment: reverse old, apply new ---
    const nextItems = [...items];

    // Reverse old stock deduction (add back old quantities)
    for (const oldLine of invoice.items) {
      const idx = nextItems.findIndex((i) => i.id === oldLine.itemId);
      if (idx >= 0) {
        nextItems[idx].currentStock += oldLine.qty;
      }
    }

    // Apply new stock deduction (subtract new quantities)
    for (const newLine of invoiceLines) {
      const idx = nextItems.findIndex((i) => i.id === newLine.itemId);
      if (idx >= 0) {
        nextItems[idx].currentStock -= newLine.qty;
      }
    }

    // Save updated items to localStorage
    setItems(nextItems);

    // --- Party outstanding adjustment ---
    // Calculate the change in invoice total and received amount
    const oldTotal = invoice.total;
    const oldReceived = invoice.amountReceived;
    const newTotal = total;
    const newReceived = amountReceived;

    // Calculate the net change in outstanding
    // Old outstanding contribution: oldTotal - oldReceived
    // New outstanding contribution: newTotal - newReceived
    // Change = (newTotal - newReceived) - (oldTotal - oldReceived)
    const deltaOutstanding = (newTotal - newReceived) - (oldTotal - oldReceived);

    // Apply the adjustment to the party
    const newOutstanding = party.currentOutstanding + deltaOutstanding;
    updateParty(party.id, { currentOutstanding: newOutstanding });

    updateInvoice(invoice.id, updates);
    navigate(`/sales/invoices/${invoice.id}`);
  }, [
    invoice,
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
    updateInvoice,
    updateParty,
    setItems,
    navigate,
  ]);

  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/sales/invoices" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Back to Invoices
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Link to={`/sales/invoices/${id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          &larr; Back to Invoice
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice #{invoice.invoiceNo}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Party</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Party</label>
              <select
                value={party?.id || ''}
                onChange={(e) => {
                  const p = parties.find((party) => party.id === e.target.value);
                  setParty(p || null);
                }}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>
              {party && (
                <p className="text-xs text-gray-500 mt-1">
                  Outstanding: {party.currentOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={paymentMode}
              onChange={(e) =>
                setPaymentMode(e.target.value as PaymentMode)
              }
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({invoiceLines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 font-medium text-gray-600">#</th>
                  <th className="p-3 font-medium text-gray-600">Item</th>
                  <th className="p-3 font-medium text-gray-600 text-right">SKU</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Available Stock</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Qty</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Rate (₹)</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Discount %</th>
                  <th className="p-3 font-medium text-gray-600 text-right">GST %</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Amount (₹)</th>
                  <th className="p-3 font-medium text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceLines.map((line, idx) => {
                  const item = items.find((i) => i.id === line.itemId);
                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-gray-900">{idx + 1}</td>
                      <td className="p-3">
                        {item ? (
                          <span className="font-medium text-gray-900">{item.name}</span>
                        ) : (
                          <span className="text-red-500">Select item</span>
                        )}
                        <div className="text-xs text-gray-500">{line.name || ''}</div>
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {item ? item.sku : '—'}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {item ? item.currentStock : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          className="w-full px-2 py-1 border border-input rounded text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                          value={line.qty}
                          onChange={(e) =>
                            updateLine(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))
                          }
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1 border border-input rounded text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                          value={line.rate}
                          onChange={(e) =>
                            updateLine(idx, 'rate', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                        />
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={line.discountPercent}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              'discountPercent',
                              Number(e.target.value)
                            )
                          }
                          className="px-2 py-1 border border-input rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {(DISCOUNT_PERCENTS.includes(line.discountPercent)
                            ? DISCOUNT_PERCENTS
                            : [...DISCOUNT_PERCENTS, line.discountPercent].sort(
                                (a, b) => a - b
                              )
                          ).map((percent) => (
                            <option key={percent} value={percent}>
                              {percent}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={line.gstRate}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              'gstRate',
                              e.target.value as unknown as GSTRate
                            )
                          }
                          className="px-2 py-1 border border-input rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {GST_RATES.map((r) => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        {line.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeLine(idx)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={addLine}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Item
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
              <p className="text-lg font-bold text-gray-900">{total.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Amount Received</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={amountReceived}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Balance Due</label>
              <p className={`text-lg font-bold ${(total - amountReceived) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {(total - amountReceived).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => navigate(`/sales/invoices/${id}`)}
          className="px-4 py-2 border border-input text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
