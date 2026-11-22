import { useItems } from './useItems';
import { AlertTriangle } from 'lucide-react';
import { DataTable } from '@/shared/ui/data-table';

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

      <div className='flex flex-col gap-4'>
        <div>
          <h2 className='text-xl'>Low Stock Items</h2>
        </div>
        <div>
          <DataTable
            columns={[
              {
                key: 'alert',
                label: '⚠',
                headerClassName: 'w-20',
                cellClassName: 'text-center text-red-600',
                render: () => <AlertTriangle className="h-4 w-4" />,
              },
              {
                key: 'name',
                label: 'Item',
                headerClassName: 'w-42',
                cellClassName: 'font-medium text-gray-900',
              },
              {
                key: 'currentStock',
                label: 'Current Stock',
                headerClassName: 'text-left w-42',
                cellClassName: 'text-left font-semibold text-red-700',
              },
            ]}
            data={lowStock}
            pageSize={10}
            emptyMessage="✅ All items are well stocked. No low-stock alerts."
            emptyColSpan={3}
          />
        </div>
      </div>
    </div>
  );
}
