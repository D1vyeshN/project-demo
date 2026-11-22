import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit2, Trash2, Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UNITS } from '../lib/constants';
import ItemModal from '../components/ItemModal';

const PAGE_SIZE = 5;

const FILTER_SELECT_CLASS =
  'h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ItemsPage() {
  const { items, loading, deleteItem } = useItems();
  const { invoices } = useInvoices();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [unitFilter, setUnitFilter] = useState('All Units');
  const [page, setPage] = useState(1);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | undefined>(undefined);

  const categories = [...new Set(items.map((it) => it.category).filter(Boolean))] as string[];

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    const matchesSearch =
      it.name.toLowerCase().includes(q) ||
      it.sku.toLowerCase().includes(q) ||
      (it.category || '').toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === 'All Categories' || it.category === categoryFilter;
    const matchesUnit = unitFilter === 'All Units' || it.unit === unitFilter;
    return matchesSearch && matchesCategory && matchesUnit;
  });

  // Real client-side pagination (mockup: "Showing 1 to 5 of 5 items" + ‹ 1 2 3 ›)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const startNum = filtered.length === 0 ? 0 : startIdx + 1;
  const endNum = Math.min(startIdx + PAGE_SIZE, filtered.length);

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

  const handleAddItem = () => {
    setEditingItemId(undefined);
    setItemModalOpen(true);
  };

  const handleEditItem = (id: string) => {
    setEditingItemId(id);
    setItemModalOpen(true);
  };

  if (loading) return <div className="p-4 text-gray-500">Loading items...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <Card className="border-gray-200 max-h-[70vh] flex flex-col">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-full max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className='pl-9'
              placeholder="Search by item name, SKU or category..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className={FILTER_SELECT_CLASS}
          >
            <option>All Categories</option>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            aria-label="Filter by unit"
            className={FILTER_SELECT_CLASS}
          >
            <option>All Units</option>
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">SKU</TableHead>
                  <TableHead className="w-32">Item Name</TableHead>
                  <TableHead className="w-24">Category</TableHead>
                  <TableHead className="w-16">Unit</TableHead>
                  <TableHead className="text-right w-24">Selling Price</TableHead>
                  <TableHead className="text-center w-16">GST %</TableHead>
                  <TableHead className="text-right w-24">Current Stock</TableHead>
                  <TableHead className="text-center w-20">Status</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border-x border-gray-200'>
                {pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                      No items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((it) => {
                    const reorder = 5;
                    const outOfStock = it.currentStock === 0;
                    const low = !outOfStock && it.currentStock <= reorder;
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium text-gray-900">{it.sku}</TableCell>
                        <TableCell className="text-gray-900">{it.name}</TableCell>
                        <TableCell className="text-gray-600">{it.category || '—'}</TableCell>
                        <TableCell className="text-gray-600">{it.unit}</TableCell>
                        <TableCell className="text-right font-medium text-gray-900">
                          ₹{Math.round(it.sellingPrice).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-center text-gray-600">{it.gstRate}%</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            outOfStock || low ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {it.currentStock}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              outOfStock
                                ? 'border-red-200 bg-red-100 text-red-700'
                                : 'border-green-200 bg-green-100 text-green-700',
                              'px-2 py-1'
                            )}
                          >
                            {outOfStock ? 'Out of Stock' : 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditItem(it.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(it.id)}
                              disabled={isUsedInInvoice(it.id)}
                              className={`p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {startNum} to {endNum} of {filtered.length} items
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-8 w-8 rounded-md border text-sm font-medium transition',
                    p === safePage
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <ItemModal
        key={editingItemId || 'new'}
        open={itemModalOpen}
        onOpenChange={(open) => setItemModalOpen(open)}
        itemId={editingItemId}
      />
    </div>
  );
}
