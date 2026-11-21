import { useItems } from '../hooks/useItems';

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

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-medium text-gray-600">SKU</th>
                <th className="p-4 font-medium text-gray-600">Item Name</th>
                <th className="p-4 font-medium text-gray-600">Unit</th>
                <th className="p-4 font-medium text-gray-600">Current Stock</th>
                <th className="p-4 font-medium text-gray-600">Selling Price</th>
                <th className="p-4 font-medium text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-green-600 font-medium">
                    ✅ All items are well stocked. No low-stock alerts.
                  </td>
                </tr>
              ) : (
                lowStock.map((it) => (
                  <tr key={it.id} className="border-b border-gray-100 hover:bg-amber-50">
                    <td className="p-4 font-medium text-gray-900">{it.sku}</td>
                    <td className="p-4 text-gray-700">{it.name}</td>
                    <td className="p-4 text-gray-700">{it.unit}</td>
                    <td className="p-4 font-semibold text-red-700">{it.currentStock}</td>
                    <td className="p-4 text-gray-700">
                      {it.sellingPrice.toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'INR',
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={`/items/${it.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Restock
                      </a>
                    </td>
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
