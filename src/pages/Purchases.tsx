import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useItems } from '../hooks/useItems';
import { usePurchases } from '../hooks/usePurchases';
import { useInvoices } from '../hooks/useInvoices';
import { generateId } from '../lib/storage';
import { nextPurchaseNo } from '../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => currency.format(value);

export default function PurchasesPage() {
  const { items, setItems } = useItems();
  const { purchases, addPurchase, deletePurchase } = usePurchases();
  const { movements, setMovements } = useInvoices();

  const [refNo, setRefNo] = useState(() => nextPurchaseNo(purchases));
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0);
  const [note, setNote] = useState('');

  const sorted = [...purchases].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSave = () => {
    if (!itemId || qty <= 0) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newRefNo = nextPurchaseNo(purchases);

    // Persist purchase record
    addPurchase({
      refNo: newRefNo,
      itemId,
      itemName: item.name,
      qty,
      rate: rate || undefined,
      note: note || undefined,
      date: new Date().toISOString(),
    });

    // Increase stock
    const nextItems = items.map((i) =>
      i.id === itemId ? { ...i, currentStock: i.currentStock + qty } : i
    );
    setItems(nextItems);

    // Record Purchase movement — balance = item's current stock after this purchase
    const updatedItem = nextItems.find((i) => i.id === itemId);
    const newMovement = {
      id: generateId(),
      itemId,
      type: 'Purchase' as const,
      qty,
      refId: newRefNo,
      date: new Date().toISOString(),
      balance: updatedItem ? updatedItem.currentStock : item.currentStock + qty,
    };
    setMovements([...movements, newMovement]);

    // Reset form (ref no advances)
    setRefNo(nextPurchaseNo([...purchases, { id: '', refNo: newRefNo, itemId, itemName: item.name, qty, rate: rate || undefined, note: note || undefined, date: new Date().toISOString(), createdAt: new Date().toISOString() }]));
    setItemId('');
    setQty(0);
    setRate(0);
    setNote('');
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
      </div>

      {/* Stock-in form */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Stock In — Add Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="mb-1.5 block text-sm">Reference No</Label>
              <Input
                readOnly
                value={refNo}
                className="bg-gray-50 text-gray-600 font-mono"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Item *</Label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select item</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku}) — Stock: {i.currentStock}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Qty (units in)</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={qty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQty(parseInt(e.target.value) || 0)
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Rate / unit (optional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRate(parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>
            <Button
              type="submit"
              disabled={!itemId || qty <= 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-medium"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Stock In
            </Button>
          </form>

          {note && (
            <p className="mt-3 text-xs text-gray-500">Note: {note}</p>
          )}
        </CardContent>
      </Card>

      {/* Purchase list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Ref No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center w-16">Qty</TableHead>
                  <TableHead className="text-right w-24">Rate (₹)</TableHead>
                  <TableHead className="text-right w-24">Total (₹)</TableHead>
                  <TableHead className="text-sm">Date</TableHead>
                  <TableHead className="text-right w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                      No purchases recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-gray-900">{p.refNo}</TableCell>
                      <TableCell className="text-gray-600">{p.itemName}</TableCell>
                      <TableCell className="text-center">{p.qty}</TableCell>
                      <TableCell className="text-right">
                        {p.rate !== undefined ? formatINR(p.rate) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(p.qty * (p.rate || 0))}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => deletePurchase(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
