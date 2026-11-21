import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import KPICard from '../components/KPICard';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { items } = useItems();
  const { invoices } = useInvoices();

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalReceivables = invoices
    .filter((inv) => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + (inv.total - inv.amountReceived), 0);
  const stockValue = items.reduce((sum, it) => sum + it.currentStock * it.sellingPrice, 0);
  const lowStockCount = items.filter((it) => it.currentStock <= 5).length;

  const recentSales = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your inventory and sales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sales" value={totalSales.toLocaleString(undefined, { style: 'currency', currency: 'INR' })} color="blue" />
        <KPICard title="Receivables" value={totalReceivables.toLocaleString(undefined, { style: 'currency', currency: 'INR' })} color="amber" subtitle="Outstanding from unpaid invoices" />
        <KPICard title="Stock Value" value={stockValue.toLocaleString(undefined, { style: 'currency', currency: 'INR' })} color="green" />
        <KPICard title="Low Stock Items" value={lowStockCount} color="red" subtitle="Items at or below reorder level" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 font-medium text-gray-600">Invoice No.</th>
                <th className="pb-3 font-medium text-gray-600">Party</th>
                <th className="pb-3 font-medium text-gray-600">Date</th>
                <th className="pb-3 font-medium text-gray-600">Total</th>
                <th className="pb-3 font-medium text-gray-600">Status</th>
                <th className="pb-3 font-medium text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No sales yet. Create your first invoice.
                  </td>
                </tr>
              ) : (
                recentSales.map((inv) => {
                  const statusColor: Record<string, string> = {
                    Paid: 'bg-green-100 text-green-700',
                    'Partially Paid': 'bg-amber-100 text-amber-700',
                    Unpaid: 'bg-red-100 text-red-700',
                  };
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{inv.invoiceNo}</td>
                      <td className="p-3 text-gray-700">{inv.partyName}</td>
                      <td className="p-3 text-gray-700">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-gray-900">
                        {inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link to={`/invoices/${inv.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm">View</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/items/new" className="block w-full text-left px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Add New Item
            </Link>
            <Link to="/parties/new" className="block w-full text-left px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Add New Party
            </Link>
            <Link to="/invoices/new" className="block w-full text-left px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Create Sales Invoice
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Overview</h3>
          <p className="text-gray-600 text-sm">{items.length} items in master. {lowStockCount} need restocking.</p>
        </div>
      </div>
    </div>
  );
}
