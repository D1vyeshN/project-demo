import { useState } from 'react';
import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import { usePurchases } from '../hooks/usePurchases';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Label } from '../components/ui/label';

export default function StockMovementsPanel() {
  const { items } = useItems();
  const { movements } = useInvoices();
  const { purchases } = usePurchases();

  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const itemById = new Map<string, string>();
  items.forEach((it) => itemById.set(it.id, it.name));

  const saleMovements = movements.filter((m) => m.type === 'Sales');
  const purchaseMovements = purchases.map((p) => ({
    id: p.id,
    itemId: p.itemId,
    type: 'Purchase' as const,
    qty: p.qty,
    refId: p.refNo,
    date: p.date,
  }));

  const scopeItem = selectedItemId ? items.find((i) => i.id === selectedItemId) : undefined;

  // Build per-item chronological movements for the selected item
  const itemMovements =
    scopeItem &&
    [...saleMovements, ...purchaseMovements]
      .filter((m) => m.itemId === scopeItem.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Derive opening balance: currentStock minus net of all recorded movements
  let openingBalance = 0;
  let totalsInQty = 0;
  let totalsOutQty = 0;
  if (scopeItem && itemMovements) {
    const net = itemMovements.reduce(
      (acc, m) => acc + (m.type === 'Purchase' ? m.qty : -m.qty),
      0
    );
    openingBalance = scopeItem.currentStock - net;
    totalsInQty = itemMovements.reduce(
      (acc, m) => acc + (m.type === 'Purchase' ? m.qty : 0),
      0
    );
    totalsOutQty = itemMovements.reduce(
      (acc, m) => acc + (m.type === 'Sales' ? m.qty : 0),
      0
    );
  }

  const typeColor: Record<string, string> = {
    'Opening Stock': 'bg-blue-100 text-blue-700',
    Sales: 'bg-red-100 text-red-700',
    Purchase: 'bg-green-100 text-green-700',
    Adjustment: 'bg-amber-100 text-amber-700',
  };

  // Build table rows with running balance computed once (not during render mutation)
  const rows: Array<{
    date: string;
    type: string;
    refId: string;
    inQty: string;
    outQty: string;
    balance: number;
  }> = [];
  if (scopeItem && itemMovements) {
    let running = openingBalance;
    for (const m of itemMovements) {
      running += m.type === 'Purchase' ? m.qty : -m.qty;
      rows.push({
        date: new Date(m.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        type: m.type,
        refId: m.refId || '—',
        inQty: m.type === 'Purchase' ? `+${m.qty}` : '—',
        outQty: m.type === 'Sales' ? String(m.qty) : '—',
        balance: running,
      });
    }
  }

  return (
    <div className="pb-10 space-y-6">
      {/* Item scope selector */}
      <Card>
        <CardHeader>
          <CardTitle>
            Stock Movements{' '}
            {scopeItem ? `— ${scopeItem.name} (${scopeItem.sku})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="itemScope" className="mb-1.5 block text-sm">
            View movements for item
          </Label>
          <select
            id="itemScope"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full md:w-80 h-10 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.sku})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* KPI row */}
      {scopeItem && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Opening Stock
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">{openingBalance}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                In Qty
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">{totalsInQty}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                Out Qty
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">{totalsOutQty}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Current Stock
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {scopeItem.currentStock}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movements table */}
      <Card>
        <CardHeader>
          <CardTitle>Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-24">Ref No</TableHead>
                  <TableHead className="text-center w-16">In Qty</TableHead>
                  <TableHead className="text-center w-16">Out Qty</TableHead>
                  <TableHead className="text-right w-24">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopeItem && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      No stock movements recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={`${r.date}-${r.type}-${r.refId}`}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor[r.type]}`}
                        >
                          {r.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-700 text-sm">
                        {r.refId}
                      </TableCell>
                      <TableCell className="text-center text-green-600">
                        {r.inQty}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {r.outQty}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900">
                        {r.balance}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!scopeItem && (
        <div className="text-xs text-gray-500">
          Select an item above to view its per-item stock movements (In Qty / Out Qty).
        </div>
      )}
    </div>
  );
}
