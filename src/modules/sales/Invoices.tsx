import { useMemo, useState } from 'react';
import { useInvoices } from './useInvoices';
import { useParties } from '@/modules/parties/useParties';
import { Link } from 'react-router-dom';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Search as SearchIcon,
  Edit2,
  Eye,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { input as Input } from '@/shared/ui/input';
import { DataTable } from '@/shared/ui/data-table';
import type { Invoice } from '@/lib/types';

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

  const sorted = filtered.slice().sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formatINR = (value: number) => currency.format(value);

  const columns = [
    {
      key: 'invoiceNo',
      label: 'Invoice No.',
      headerClassName: 'w-24',
      cellClassName: 'font-medium text-gray-900',
      render: (inv: Invoice) => inv.invoiceNo,
    },
    {
      key: 'date',
      label: 'Date',
      headerClassName: 'w-20',
      cellClassName: 'text-gray-600',
      render: (inv: Invoice) => new Date(inv.date).toLocaleDateString(),
    },
    {
      key: 'partyName',
      label: 'Party',
      headerClassName: 'w-24',
      cellClassName: 'text-gray-600',
      render: (inv: Invoice) => partyMap.get(inv.partyId) || inv.partyName,
    },
    {
      key: 'total',
      label: 'Total',
      headerClassName: 'text-right w-24',
      cellClassName: 'text-right font-medium text-gray-900',
      render: (inv: Invoice) => formatINR(inv.total),
    },
    {
      key: 'amountReceived',
      label: 'Received',
      headerClassName: 'text-right w-24',
      cellClassName: 'text-right text-gray-600',
      render: (inv: Invoice) => formatINR(inv.amountReceived),
    },
    {
      key: 'balanceDue',
      label: 'Balance Due',
      headerClassName: 'text-right w-24',
      cellClassName: 'text-right font-medium text-gray-900',
      render: (inv: Invoice) => formatINR(inv.total - inv.amountReceived),
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'text-center w-20',
      cellClassName: 'text-center',
      render: (inv: Invoice) => (
        <Badge className={cn(statusColor[inv.status], 'px-2 py-1')}>
          {inv.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      headerClassName: 'text-right w-20',
      cellClassName: 'text-right',
      render: (inv: Invoice) => (
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            View all sales invoices with payment status and balance due.
          </p>
        </div>
        <Link to="/sales/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Invoice
        </Link>
      </div>

      <div className="max-h-[70vh] flex flex-col gap-4">
        <div className="flex w-full flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-3/5 max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search by invoice no. or party..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
          <div className="w-2/5 flex gap-3">
            <div className="w-1/2">
              <Select
                value={statusFilter}
                onValueChange={(value: string) => setStatusFilter(value)}
                aria-label="Filter by status"
              >
                <SelectTrigger className={FILTER_SELECT_CLASS}>
                  <SelectValue placeholder="All Status">
                    {statusFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DataTable columns={columns as any} data={sorted} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
