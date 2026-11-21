import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

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
          <p className="text-gray-600">
            Manage customers and suppliers with outstanding balances.
          </p>
        </div>
        <Button asChild>
          <Link to="/parties/new">+ Add Party</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <Input
              type="text"
              className='pl-10'
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">GSTIN</TableHead>
                  <TableHead className="text-right">Outstanding Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No parties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const used = isUsedInInvoice(p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.phone}</TableCell>
                        <TableCell className="text-center">{p.gstin || '—'}</TableCell>
                        <TableCell className={`text-right font-medium ${p.currentOutstanding > 0 ? 'text-red-600' : p.currentOutstanding < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {p.currentOutstanding.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'INR',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
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
                            className={`px-3 py-1.5 text-sm rounded border transition ${
                              used
                                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-800'
                            }`}
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
