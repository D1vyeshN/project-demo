import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { calcInvoice, calcLine, statusFrom } from '../lib/invoiceCalc';
import type { GSTRate, InvoiceItem, Party, InvoiceStatus } from '../lib/types';
import { GST_RATES } from '../lib/constants';

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
  const { parties } = useParties();
  const { addInvoice, addMovement } = useInvoices();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [party, setParty] = useState<Party | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceItem[]>([EMPTY_ITEM]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'UPI' | 'etc.'>(
    'Cash'
  );
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');

  const { subtotal, discount, taxableAmount, gst, total } = calcInvoice(
    invoiceLines
  );

  const handlePartySelect = useCallback((p: Party) => {
    setParty(p);
    setStep(2);
  }, []);

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
    if (
      invoiceLines.some((l) => !l.itemId || l.qty <= 0 || !l.itemId)
    ) {
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
      paymentRef: paymentRef || undefined,
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
    paymentRef,
    addInvoice,
    addMovement,
    navigate,
  ]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <a href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          &larr; Back
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Create Sales Invoice</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition ${
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

      {step === 1 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 1 — Select Party
          </h2>
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search party by name or phone..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span>🔍</span>
            </div>
          </div>
          <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
            <ul>
              {parties.map((p) => (
                <li key={p.id} className="border-b border-gray-50 last:border-0">
                  <button
                    onClick={() => handlePartySelect(p)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 transition flex justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">
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
              ))}
            </ul>
          </div>
        </div>
      )}

      {step === 2 && party && (
        <>
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Step 2 — Select Items
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Party: <span className="font-medium">{party.name}</span>
              {' | '} Outstanding:
              {party.currentOutstanding.toLocaleString(undefined, {
                style: 'currency',
                currency: 'INR',
              })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                placeholder="Search items..."
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">All items</option>
                {items.map((i) => (
                  <option key={i.id} value={i.sku}>
                    {i.sku} — {i.name} ({i.currentStock} available)
                  </option>
                ))}
              </select>
              <button
                onClick={addLine}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Add Line
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-3 font-medium text-gray-600">Item</th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      Available
                    </th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      Rate
                    </th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      Qty
                    </th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      Discount
                    </th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      GST %
                    </th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      Amount
                    </th>
                    <th className="p-3 font-medium text-gray-600 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceLines.map((line, idx) => {
                    const item = items.find((i) => i.id === line.itemId);
                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3">
                          {item ? (
                            <span className="font-medium text-gray-900">
                              {item.sku}
                            </span>
                          ) : (
                            <span className="text-red-500">Select item</span>
                          )}
                          <div className="text-xs text-gray-500">
                            {line.name || ''}
                          </div>
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {item ? item.currentStock : '—'}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {item ? item.sellingPrice.toFixed(2) : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                'qty',
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={line.discount}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                'discount',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                          />
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
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            {GST_RATES.map((r) => (
                              <option key={r} value={r}>
                                {r}%
                              </option>
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
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 3 && party && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 3 — Invoice Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Discount</span>
                <span>-{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Taxable Amount</span>
                <span>{taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">GST</span>
                <span>{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2">
                <span>Invoice Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {invoiceLines.length} line item(s). GST calculated on taxable amount after discount.
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Payment Details →
            </button>
          </div>
        </div>
      )}

      {step === 4 && party && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 4 — Payment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Invoice Amount
              </label>
              <p className="text-lg font-bold text-gray-900">{total.toFixed(2)}</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Previous Outstanding
              </label>
              <p className="text-lg font-bold text-gray-900">
                {party.currentOutstanding.toFixed(2)}
              </p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(e.target.value as 'Cash' | 'Bank' | 'UPI' | 'etc.')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {['Cash', 'Bank', 'UPI', 'etc.'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Amount Received
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={amountReceived}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Payment Reference (optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <p className={`text-lg font-bold ${getStatusColorClass(statusFrom(amountReceived, total))}`}>
                {statusFrom(amountReceived, total)}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              &larr; Back
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Save Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColorClass(status: string) {
  if (status === 'Paid') return 'text-green-700';
  if (status === 'Partially Paid') return 'text-amber-700';
  return 'text-red-700';
}
