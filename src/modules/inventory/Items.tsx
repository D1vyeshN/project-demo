import { useItems } from './useItems';
import { useInvoices } from '@/modules/sales/useInvoices';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { input as Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Search as SearchIcon,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ItemModal from './ItemModal';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable } from '@/shared/ui/data-table';
import { toast } from 'sonner';
import type { Item } from '@/lib/types';

const PAGE_SIZE = 5;

const FILTER_SELECT_CLASS =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const STOCK_STATUSES = ["In Stock", "Out of Stock"] as const;

export default function ItemsPage() {
  const { items, loading, deleteItem } = useItems();
  const { invoices } = useInvoices();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | undefined>(
    undefined,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const categories = [
    ...new Set(items.map((it) => it.category).filter(Boolean)),
  ] as string[];

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    const matchesSearch =
      it.name.toLowerCase().includes(q) ||
      it.sku.toLowerCase().includes(q) ||
      (it.category || "").toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === "All Categories" || it.category === categoryFilter;
    const stockStatus = it.currentStock === 0 ? "Out of Stock" : "In Stock";
    const matchesStatus =
      statusFilter === "All Status" || stockStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const isUsedInInvoice = (itemId: string) =>
    invoices.some((inv) => inv.items.some((ii) => ii.itemId === itemId));

  const handleDelete = (id: string) => {
    if (isUsedInInvoice(id)) {
      toast.error(
        "Cannot delete this item: it is used in one or more sales invoices.",
      );
      return;
    }
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete);
      setItemToDelete(null);
    }
    setDeleteConfirmOpen(false);
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

  const columns = [
    {
      key: "sku",
      label: "SKU",
      headerClassName: "w-24",
      cellClassName: "font-medium text-gray-900",
    },
    {
      key: "name",
      label: "Item Name",
      headerClassName: "w-32",
      cellClassName: "text-gray-900",
    },
    {
      key: "category",
      label: "Category",
      headerClassName: "w-24",
      cellClassName: "text-gray-600",
    },
    {
      key: "unit",
      label: "Unit",
      headerClassName: "w-16",
      cellClassName: "text-gray-600",
    },
    {
      key: "sellingPrice",
      label: "Selling Price",
      headerClassName: "text-center w-24",
      cellClassName: "text-center font-medium text-gray-900",
      render: (it: Item) =>
        `₹${Math.round(it.sellingPrice).toLocaleString("en-IN")}`,
    },
    {
      key: "gstRate",
      label: "GST %",
      headerClassName: "text-center w-16",
      cellClassName: "text-center text-gray-600",
      render: (it: Item) => `${it.gstRate}%`,
    },
    {
      key: "currentStock",
      label: "Current Stock",
      headerClassName: "text-right w-24",
      cellClassName: "text-center font-medium",
      render: (it: Item) => {
        const outOfStock = it.currentStock === 0;
        const low = !outOfStock && it.currentStock <= 5;
        return (
          <span
            className={`text-center font-medium ${
              outOfStock || low ? "text-red-600" : "text-green-600"
            }`}
          >
            {it.currentStock}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      headerClassName: "text-center w-20",
      cellClassName: "text-center",
      render: (it: Item) => {
        const outOfStock = it.currentStock === 0;
        return (
          <Badge
            className={cn(
              outOfStock
                ? "border-red-200 bg-red-100 text-red-700"
                : "border-green-200 bg-green-100 text-green-700",
              "px-2 py-1",
            )}
          >
            {outOfStock ? "Out of Stock" : "In Stock"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "text-center w-20",
      cellClassName: "text-center",
      render: (it: Item) => {
        return (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => handleEditItem(it.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSearchParams({ item: it.id });
                navigate(`/stock-movements?item=${it.id}`);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="View Stock Movements"
            >
              <BarChart3 className="w-4 h-4" />
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
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define items with SKU, selling price, GST rate, and opening stock.
            Track current available stock.
          </p>
        </div>
        <Button
          onClick={handleAddItem}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="max-h-[70vh] flex flex-col gap-4">
        <div className="flex w-full flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-3/5 max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search by item name, SKU or category..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
            />
          </div>
          <div className="w-2/5 flex gap-3">
            <div className="w-1/2">
              <Select
                value={categoryFilter}
                onValueChange={(value: string) => setCategoryFilter(value)}
                aria-label="Filter by category"
              >
                <SelectTrigger className={FILTER_SELECT_CLASS}>
                  <SelectValue placeholder="All Categories">
                    {categoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <Select
                value={statusFilter}
                onValueChange={(value: string) => setStatusFilter(value)}
                aria-label="Filter by stock status"
              >
                <SelectTrigger className={FILTER_SELECT_CLASS}>
                  <SelectValue placeholder="All Status">
                    {statusFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  {STOCK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DataTable
          columns={columns as any}
          data={filtered}
          pageSize={PAGE_SIZE}
        />
      </div>

      <ItemModal
        key={editingItemId || "new"}
        open={itemModalOpen}
        onOpenChange={(open) => setItemModalOpen(open)}
        itemId={editingItemId}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete item?"
        description="Are you sure you want to delete this item?"
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  );
}
