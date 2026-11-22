import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { input as Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import PartyModal from '../components/PartyModal';

const PAGE_SIZE = 5;

const FILTER_SELECT_CLASS =
  'h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Party status is derived from the outstanding balance (mockup screen 4) */
const partyStatus = (outstanding: number) =>
  outstanding > 0 ? 'Active' : 'Inactive';

const PARTY_STATUSES = ['Active', 'Inactive'] as const;

export default function PartiesPage() {
  const { parties, loading, deleteParty } = useParties();
  const { invoices } = useInvoices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | undefined>(undefined);

  const filtered = parties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(search) ||
      (p.gstin || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'All Status' || partyStatus(p.currentOutstanding) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Real client-side pagination (mockup: "Showing 1 to 5 of 10 parties" + ‹ 1 2 3 ›)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const startNum = filtered.length === 0 ? 0 : startIdx + 1;
  const endNum = Math.min(startIdx + PAGE_SIZE, filtered.length);

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

  const handleAddParty = () => {
    setEditingPartyId(undefined);
    setPartyModalOpen(true);
  };

  const handleEditParty = (id: string) => {
    setEditingPartyId(id);
    setPartyModalOpen(true);
  };

  if (loading) return <div className="p-4 text-gray-500">Loading parties...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
        <Button onClick={handleAddParty} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Party
        </Button>
      </div>

      <Card className="border-gray-200 max-h-[70vh] flex flex-col">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-full max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className='pl-9'
              placeholder="Search by name, phone or GSTIN..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className={FILTER_SELECT_CLASS}
          >
            <option>All Status</option>
            {PARTY_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-44">GSTIN</TableHead>
                <TableHead className="text-right w-32">Outstanding Balance</TableHead>
                <TableHead className="text-center w-16">Status</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      No parties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((p) => {
                    const used = isUsedInInvoice(p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            to={`/parties/${p.id}/ledger`}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-gray-600">{p.phone}</TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {p.gstin || '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-700">
                          ₹{Math.abs(Math.round(p.currentOutstanding)).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              partyStatus(p.currentOutstanding) === 'Active'
                                ? 'border-green-200 bg-green-100 text-green-700'
                                : 'border-gray-200 bg-gray-100 text-gray-700',
                              'px-2 py-1'
                            )}
                          >
                            {partyStatus(p.currentOutstanding)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditParty(p.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={used}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {startNum} to {endNum} of {filtered.length} parties
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-8 w-8 rounded-md border text-sm font-medium transition',
                    p === safePage
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <PartyModal
        key={editingPartyId || 'new'}
        open={partyModalOpen}
        onOpenChange={(open) => setPartyModalOpen(open)}
        partyId={editingPartyId}
      />
    </div>
  );
}
