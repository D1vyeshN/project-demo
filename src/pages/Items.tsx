import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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
        <Link to="/items/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + Add Item
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-medium text-gray-600">SKU</th>
                <th className="p-4 font-medium text-gray-600">Item Name</th>
                <th className="p-4 font-medium text-gray-600">Selling Price</th>
                <th className="p-4 font-medium text-gray-600">GST</th>
                <th className="p-4 font-medium text-gray-600">Unit</th>
                <th className="p-4 font-medium text-gray-600">Current Stock</th>
                <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => {
                  const used = isUsedInInvoice(it.id);
                  const low = it.currentStock <= 5;
                  return (
                    <tr
                      key={it.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium text-gray-900">{it.sku}</td>
                      <td className="p-4 text-gray-700">{it.name}</td>
                      <td className="p-4 text-gray-700">
                        {it.sellingPrice.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                      </td>
                      <td className="p-4 text-gray-700">{it.gstRate}%</td>
                      <td className="p-4 text-gray-700">{it.unit}</td>
                      <td className="p-4 font-medium">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          low ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {it.currentStock} {low ? '⚠ Low' : ''}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/items/${it.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-800 mr-3 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(it.id)}
                          disabled={used}
                          className={`px-3 py-1.5 text-sm rounded border rounded-md transition ${
                            used
                              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                              : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
