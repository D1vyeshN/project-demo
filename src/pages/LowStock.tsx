import { useItems } from '../hooks/useItems';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function LowStockPage() {
  const { items } = useItems();
  const lowStock = items.filter((it) => it.currentStock <= 5);

  return (
    <div className="space-y-6">
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-center w-16">Unit</TableHead>
                  <TableHead className="text-right w-24">Current Stock</TableHead>
                  <TableHead className="text-right w-24">Selling Price</TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-green-600 font-medium">
                      ✅ All items are well stocked. No low-stock alerts.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStock.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.sku}</TableCell>
                      <TableCell>{it.name}</TableCell>
                      <TableCell className="text-center">{it.unit}</TableCell>
                      <TableCell className="text-right font-semibold text-red-700">
                        {it.currentStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {it.sellingPrice.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'INR',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/items/${it.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Restock
                        </Link>
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

