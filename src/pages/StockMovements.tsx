import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import { useMemo } from 'react';

export default function StockMovementsPage() {
  const { items } = useItems();
  const { movements } = useInvoices();

  const itemById = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((it) => map.set(it.id, it.name));
    return map;
  }, [items]);

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

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-medium text-gray-600">Date</th>
                <th className="p-4 font-medium text-gray-600">Item</th>
                <th className="p-4 font-medium text-gray-600">Type</th>
                <th className="p-4 font-medium text-gray-600">Qty</th>
                <th className="p-4 font-medium text-gray-600">Reference</th>
                <th className="p-4 font-medium text-gray-600">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                sorted.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-gray-700">
                      {new Date(m.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-700">{itemById.get(m.itemId) || m.itemId}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor[m.type]}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      {m.qty >= 0 ? `+${m.qty}` : m.qty}
                    </td>
                    <td className="p-4 text-gray-700">{m.refId || '-'}</td>
                    <td className="p-4 font-medium text-gray-900">{m.balance}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
