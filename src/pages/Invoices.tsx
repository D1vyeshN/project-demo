import { useMemo, useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useParties } from '../hooks/useParties';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Edit2, Search as SearchIcon, Eye, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { input as Input } from '../components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 5;

const FILTER_SELECT_CLASS =
  'h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const statusColor: Record<string, string> = {
  Paid: 'border-green-200 bg-green-100 text-green-700',
  'Partially Paid': 'border-amber-200 bg-amber-100 text-amber-700',
  Unpaid: 'border-red-200 bg-red-100 text-red-700',
};

const INVOICE_STATUSES = ['Paid', 'Partially Paid', 'Unpaid'] as const;

export default function Invoices() {
  const { invoices } = useInvoices();
  const { parties } = useParties();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);

  const partyMap = new Map(parties.map((p) => [p.id, p.name]));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(q) ||
        (partyMap.get(inv.partyId) || inv.partyName)
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        statusFilter === 'All Status' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter, partyMap]);

  // Sort newest first
  const sorted = filtered.slice().sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(startIdx, startIdx + PAGE_SIZE);
  const startNum = sorted.length === 0 ? 0 : startIdx + 1;
  const endNum = Math.min(startIdx + PAGE_SIZE, sorted.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
        <Link to="/sales/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Invoice
        </Link>
      </div>

      <Card className="border-gray-200">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-full max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search by invoice no. or party..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className={FILTER_SELECT_CLASS}
          >
            <option>All Status</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-24'>Invoice No.</TableHead>
                  <TableHead className='w-20'>Date</TableHead>
                  <TableHead className='w-24'>Party</TableHead>
                  <TableHead className="text-right w-24">Total</TableHead>
                  <TableHead className="text-right w-24">Received</TableHead>
                  <TableHead className="text-right w-24">Balance Due</TableHead>
                  <TableHead className="text-center w-20">Status</TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border-x border-gray-200'>
                {pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((inv) => {
                    const balanceDue = inv.total - inv.amountReceived;
                    const partyName = partyMap.get(inv.partyId) || inv.partyName;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-gray-900">
                          {inv.invoiceNo}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(inv.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-600">{partyName}</TableCell>
                        <TableCell className="text-right font-medium text-gray-900">
                          ₹{inv.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          ₹{inv.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-900">
                          ₹{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(statusColor[inv.status], 'px-2 py-1')}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/sales/invoices/${inv.id}`}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/sales/invoices/${inv.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
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
              Showing {startNum} to {endNum} of {sorted.length} invoices
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
    </div>
  );
}
