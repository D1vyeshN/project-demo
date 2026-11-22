import { useItems } from '../hooks/useItems';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function LowStockPage() {
  const { items } = useItems();
  const lowStock = items.filter((it) => it.currentStock <= 5);

  return (
    <div className="pb-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Low Stock Alert</h1>
        <p className="text-gray-600">
          Items at or below reorder level (&lt;= 5 units) that need restocking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">⚠</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right w-24">Current Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-green-600 font-medium">
                      ✅ All items are well stocked. No low-stock alerts.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStock.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-center text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {it.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-700">
                        {it.currentStock}
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