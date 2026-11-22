import { useParties } from './useParties';
import { useInvoices } from '@/modules/sales/useInvoices';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { input as Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Search as SearchIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import PartyModal from './PartyModal';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable } from '@/shared/ui/data-table';
import { toast } from "sonner";
import type { Party } from '@/lib/types';

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
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<string | null>(null);

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

  const isUsedInInvoice = (partyId: string) =>
    invoices.some((inv) => inv.partyId === partyId);

  const handleDelete = (id: string) => {
    if (isUsedInInvoice(id)) {
      toast.error(
        'Cannot delete this party: it is associated with existing invoices.',
      );
      return;
    }
    setPartyToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (partyToDelete) {
      deleteParty(partyToDelete);
      setPartyToDelete(null);
    }
    setDeleteConfirmOpen(false);
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

  const columns = [
    {
      key: 'name',
      label: 'Name',
      headerClassName: 'w-44',
      cellClassName: '',
      render: (p: Party) => (
        <Link
          to={`/parties/${p.id}/ledger`}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          {p.name}
        </Link>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      headerClassName: 'w-44',
      cellClassName: 'text-gray-600',
      render: (p: Party) => p.phone,
    },
    {
      key: 'gstin',
      label: 'GSTIN',
      headerClassName: 'w-32',
      cellClassName: 'text-gray-600 whitespace-nowrap',
      render: (p: Party) => p.gstin || '—',
    },
    {
      key: 'outstandingBalance',
      label: 'Outstanding Balance',
      headerClassName: 'text-center w-44',
      cellClassName: 'text-center font-medium text-gray-700',
      render: (p: Party) => `₹${Math.abs(Math.round(p.currentOutstanding)).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'text-center w-16',
      cellClassName: 'text-center',
      render: (p: Party) => {
        const status = partyStatus(p.currentOutstanding);
        return (
          <Badge
            className={cn(
              status === 'Active'
                ? 'border-green-200 bg-green-100 text-green-700'
                : 'border-gray-200 bg-gray-100 text-gray-700',
              'px-2 py-1'
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-center w-24',
      cellClassName: 'text-center',
      render: (p: Party) => {
        const used = isUsedInInvoice(p.id);
        return (
          <div className="flex items-center justify-center gap-1">
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
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage customers and suppliers with name, phone, GSTIN, address, and outstanding balance.
          </p>
        </div>
        <Button onClick={handleAddParty} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Party
        </Button>
      </div>

      <div className="max-h-[70vh] flex flex-col gap-4">
        <div className="flex w-full flex-row flex-wrap items-center gap-3 space-y-0">
          <div className="relative w-3/5 max-w-md flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search by name, phone or GSTIN..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
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
                  {PARTY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DataTable columns={columns as any} data={filtered} pageSize={PAGE_SIZE} />
      </div>

      <PartyModal
        key={editingPartyId || 'new'}
        open={partyModalOpen}
        onOpenChange={(open) => setPartyModalOpen(open)}
        partyId={editingPartyId}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete party?"
        description="Are you sure you want to delete this party?"
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
    </div>
  );
}
