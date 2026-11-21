import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PartiesPage() {
  const { parties, loading, deleteParty } = useParties();
  const { invoices } = useInvoices();
  const [search, setSearch] = useState('');

  const filtered = parties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const isUsedInInvoice = (partyId: string) =>
    invoices.some((inv) => inv.partyId === partyId);

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this party?')) return;
    if (isUsedInInvoice(id)) {
      alert('Cannot delete this party: it is associated with existing invoices.');
      return;
    }
    deleteParty(id);
  };

  if (loading) return <div className="p-4 text-gray-500">Loading parties...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Party Master</h1>
          <p className="text-gray-600">Manage customers and suppliers with outstanding balances.</p>
        </div>
        <Link to="/parties/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + Add Party
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by name or phone..."
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
                <th className="p-4 font-medium text-gray-600">Party Name</th>
                <th className="p-4 font-medium text-gray-600">Phone</th>
                <th className="p-4 font-medium text-gray-600">GSTIN</th>
                <th className="p-4 font-medium text-gray-600">Outstanding</th>
                <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No parties found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const used = isUsedInInvoice(p.id);
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{p.name}</td>
                      <td className="p-4 text-gray-700">{p.phone}</td>
                      <td className="p-4 text-gray-700">{p.gstin || '—'}</td>
                      <td className={`p-4 font-medium ${p.currentOutstanding > 0 ? 'text-red-600' : p.currentOutstanding < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {p.currentOutstanding.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'INR',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/parties/${p.id}/ledger`}
                          className="text-indigo-600 hover:text-indigo-800 mr-3 text-sm"
                        >
                          Ledger
                        </Link>
                        <Link
                          to={`/parties/${p.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-800 mr-3 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
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
