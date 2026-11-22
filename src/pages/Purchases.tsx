import { useMemo, useState } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { input as Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Plus, Search as SearchIcon, Trash2 } from 'lucide-react';
import PurchaseModal from '../components/PurchaseModal';
import { DataTable } from '../components/ui/data-table';
import type { Purchase } from '../lib/types';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => currency.format(value);

const PAGE_SIZE = 5;

export default function PurchasesPage() {
  const { purchases, deletePurchase } = usePurchases();

  const [search, setSearch] = useState('');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...purchases]
      .filter(
        (p) =>
          p.refNo.toLowerCase().includes(q) ||
          p.itemName.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [purchases, search]);

  const columns = [
    {
      key: 'refNo',
      label: 'Ref No',
      headerClassName: 'w-24',
      cellClassName: 'font-medium text-gray-900',
    },
    {
      key: 'itemName',
      label: 'Item',
      headerClassName: 'w-32',
      cellClassName: 'text-gray-600',
    },
    {
      key: 'qty',
      label: 'Qty',
      headerClassName: 'text-center w-16',
      cellClassName: 'text-center',
    },
    {
      key: 'rate',
      label: 'Rate (₹)',
      headerClassName: 'text-right w-24',
      cellClassName: 'text-right',
      render: (p: Purchase) =>
        p.rate !== undefined ? formatINR(p.rate) : '—',
    },
    {
      key: 'total',
      label: 'Total (₹)',
      headerClassName: 'text-right w-24',
      cellClassName: 'text-right font-medium',
      render: (p: Purchase) => formatINR(p.qty * (p.rate || 0)),
    },
    {
      key: 'date',
      label: 'Date',
      headerClassName: 'text-sm',
      cellClassName: 'text-gray-600 text-sm',
      render: (p: Purchase) =>
        new Date(p.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right w-20',
      cellClassName: 'text-right',
      render: (p: Purchase) => (
        <button
          onClick={() => deletePurchase(p.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Button
          onClick={() => setPurchaseModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 inline-flex items-center gap-1"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Purchase
        </Button>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Record stock coming in. Add purchases to update item availability.
      </p>

      {/* Purchase list */}
      <div className="max-h-[70vh] flex flex-col gap-4">
        <div className="flex w-full flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-3/5 max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search by ref no. or item..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
        <DataTable columns={columns as any} data={sorted} pageSize={PAGE_SIZE} />
      </div>

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={(open) => setPurchaseModalOpen(open)}
      />
    </div>
  );
}
