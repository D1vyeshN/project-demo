import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function StockMovementsPage() {
  const { items } = useItems();
  const { movements } = useInvoices();

  const itemById = new Map<string, string>();
  items.forEach((it) => itemById.set(it.id, it.name));

  const sorted = [...movements].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  const typeColor: Record<string, string> = {
    'Opening Stock': 'bg-blue-100 text-blue-700',
    Sales: 'bg-red-100 text-red-700',
    Purchase: 'bg-green-100 text-green-700',
    Adjustment: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="text-gray-600">Audit log of all stock in/out transactions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-center">Reference</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      No stock movements recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.date).toLocaleDateString()}</TableCell>
                      <TableCell>{itemById.get(m.itemId) || m.itemId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor[m.type]}`}>
                          {m.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {m.qty >= 0 ? `+${m.qty}` : m.qty}
                      </TableCell>
                      <TableCell className="text-center text-gray-700">{m.refId || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-gray-900">{m.balance}</TableCell>
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
