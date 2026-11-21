import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function ItemsPage() {
  const { items, loading, deleteItem } = useItems();
  const { invoices } = useInvoices();
  const [search, setSearch] = useState('');

  const filtered = items.filter(
    (it) =>
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.sku.toLowerCase().includes(search.toLowerCase())
  );

  const isUsedInInvoice = (itemId: string) =>
    invoices.some((inv) => inv.items.some((ii) => ii.itemId === itemId));

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    if (isUsedInInvoice(id)) {
      alert('Cannot delete this item: it is used in one or more sales invoices.');
      return;
    }
    deleteItem(id);
  };

  if (loading) return <div className="p-4 text-gray-500">Loading items...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-gray-600">Manage your product catalogue and stock.</p>
        </div>
        <Button asChild>
          <Link to="/items/new">+ Add Item</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <Input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-center">GST</TableHead>
                  <TableHead className="text-center">Unit</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                      No items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((it) => {
                    const used = isUsedInInvoice(it.id);
                    const low = it.currentStock <= 5 && it.currentStock > 0;
                    const outOfStock = it.currentStock === 0;
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.sku}</TableCell>
                        <TableCell>{it.name}</TableCell>
                        <TableCell>{it.category || '—'}</TableCell>
                        <TableCell className="text-right">
                          {it.sellingPrice.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                        </TableCell>
                        <TableCell className="text-center">{it.gstRate}%</TableCell>
                        <TableCell className="text-center">{it.unit}</TableCell>
                        <TableCell className="text-right font-medium">
                          {it.currentStock}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={outOfStock ? 'destructive' : low ? 'secondary' : 'default'}
                            className={outOfStock || low ? 'px-2 py-1' : 'px-2 py-1 bg-green-100 text-green-700'}
                          >
                            {outOfStock ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={`/items/${it.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-800 mr-3 text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(it.id)}
                            disabled={used}
                            className={`px-3 py-1.5 text-sm rounded border transition ${
                              used
                                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-800'
                            }`}
                          >
                            Delete
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
        <CardFooter>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>Showing {filtered.length} of {items.length} items</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
