import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';

export default function PartyLedger() {
  const { id } = useParams<{ id: string }>();
  const { parties } = useParties();
  const { invoices } = useInvoices();
  const party = parties.find((p) => p.id === id);

  if (!party) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Party Not Found</h1>
        <Link to="/parties" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Back to Parties
        </Link>
      </div>
    );
  }

  const partyInvoices = useMemo(
    () => invoices.filter((inv) => inv.partyId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [invoices, id]
  );

  const totalBilled = partyInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalReceived = partyInvoices.reduce((sum, inv) => sum + inv.amountReceived, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/parties" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">← Back to Parties</Link>
        <h1 className="text-2xl font-bold text-gray-900">Party Ledger</h1>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{party.name}</h2>
        <p className="text-gray-600 text-sm">{party.phone}</p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Billed</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {totalBilled.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Total Received</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {totalReceived.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Current Outstanding</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {party.currentOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <h3 className="px-6 py-4 border-b border-gray-200 text-lg font-semibold text-gray-900">
          Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-medium text-gray-600">Date</th>
                <th className="p-4 font-medium text-gray-600">Invoice No.</th>
                <th className="p-4 font-medium text-gray-600 text-right">Total</th>
                <th className="p-4 font-medium text-gray-600 text-right">Received</th>
                <th className="p-4 font-medium text-gray-600 text-right">Balance</th>
                <th className="p-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {partyInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                partyInvoices.map((inv) => {
                  const runningBalance =
                    partyInvoices.slice(0, partyInvoices.indexOf(inv) + 1).reduce(
                      (sum, x) => sum + x.total - x.amountReceived,
                      0
                    );
                  const statusColor: Record<string, string> = {
                    Paid: 'bg-green-100 text-green-700',
                    'Partially Paid': 'bg-amber-100 text-amber-700',
                    Unpaid: 'bg-red-100 text-red-700',
                  };
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 text-gray-700">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        <Link to={`/invoices/${inv.id}`}>{inv.invoiceNo}</Link>
                      </td>
                      <td className="p-4 text-right text-gray-700">
                        {inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                      </td>
                      <td className="p-4 text-right text-gray-700">
                        {inv.amountReceived.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        {runningBalance.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor[inv.status]}`}>
                          {inv.status}
                        </span>
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
