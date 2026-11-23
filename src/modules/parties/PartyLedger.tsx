import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useParties } from './useParties';
import { useInvoices } from '@/modules/sales/useInvoices';
import { usePayments } from '@/modules/payments/usePayments';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { DataTable } from '@/shared/ui/data-table';
import PaymentModal from '@/modules/payments/PaymentModal';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => currency.format(value);

type LedgerRow = {
  date: string;
  type: 'Opening Ledger' | 'Sale' | 'Return' | 'Payment';
  refNo: string;
  amount: number; // positive = added to outstanding, negative = reduced
  balance: number;
};

export default function PartyLedger() {
  const { id } = useParams<{ id: string }>();
  const { parties } = useParties();
  const { invoices } = useInvoices();
  const { payments } = usePayments();

  const party = parties.find((p) => p.id === id);

  // All hooks must run before any conditional return — React rules
  // Party's invoices (Sale rows) — oldest first for running balance
  const partyInvoices = useMemo(
    () =>
      invoices
        .filter((inv) => inv.partyId === id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [invoices, id]
  );

  // Party's payments — oldest first
  const partyPayments = useMemo(
    () =>
      payments
        .filter((p) => p.partyId === id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [payments, id]
  );

  // Build the unified ledger chronologically
  const ledger: LedgerRow[] = useMemo(() => {
    if (!party) return [];

    const rows: LedgerRow[] = [];

    // Opening Ledger
    if (party.openingOutstanding !== 0) {
      rows.push({
        date: party.createdAt,
        type: 'Opening Ledger',
        refNo: '—',
        amount: party.openingOutstanding,
        balance: party.openingOutstanding,
      });
    }

    let running = party.openingOutstanding;

    // Merge all transactions by date
    const allEvents: Array<{
      date: string;
      type: LedgerRow['type'];
      refNo: string;
      amount: number;
    }> = [];

    for (const inv of partyInvoices) {
      allEvents.push({
        date: inv.date,
        type: 'Sale',
        refNo: inv.invoiceNo,
        amount: inv.total,
      });
    }
    for (const pay of partyPayments) {
      allEvents.push({
        date: pay.date,
        type: 'Payment',
        refNo: pay.refNo,
        amount: -Math.abs(pay.amount),
      });
    }

    allEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const ev of allEvents) {
      running += ev.amount;
      rows.push({
        date: ev.date,
        type: ev.type,
        refNo: ev.refNo,
        amount: ev.amount,
        balance: running,
      });
    }

    return rows;
  }, [party?.id, party?.openingOutstanding, party?.createdAt, partyInvoices, partyPayments]);

  const totalSales = partyInvoices.reduce((s, inv) => s + inv.total, 0);
  const currentOutstanding = ledger.length > 0 ? ledger[ledger.length - 1].balance : party?.openingOutstanding ?? 0;

  const typeColor: Record<string, string> = {
    'Opening Ledger': 'bg-blue-100 text-blue-700',
    Sale: 'bg-green-100 text-green-700',
    Payment: 'bg-amber-100 text-amber-700',
  };

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Conditional render AFTER all hooks — party may not exist yet
  if (!party) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Party Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/parties" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Back to Parties
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/parties" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Parties
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Party Ledger</h1>
          <p className="mt-1 text-sm text-gray-600">
            View party transaction history with running balance.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              Total Sales
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              +{formatINR(totalSales)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Current Outstanding
            </p>
            <p className={`text-lg font-bold mt-1 ${currentOutstanding > 0 ? 'text-red-600' : currentOutstanding < 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {formatINR(currentOutstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Party info + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
            {party.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{party.name}</p>
            <p className="text-sm text-gray-500">{party.phone}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPaymentModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'date',
                label: 'Date',
                headerClassName: 'w-24',
                cellClassName: '',
                render: (row: LedgerRow) =>
                  new Date(row.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
              },
              {
                key: 'type',
                label: 'Type',
                headerClassName: 'w-24',
                cellClassName: '',
                render: (row: LedgerRow) => (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor[row.type]}`}
                  >
                    {row.type}
                  </span>
                ),
              },
              {
                key: 'refNo',
                label: 'Ref No',
                headerClassName: 'w-24',
                cellClassName: 'text-gray-600 text-sm',
              },
              {
                key: 'amount',
                label: 'Amount (₹)',
                headerClassName: 'text-right w-24',
                cellClassName: 'text-right font-medium',
                render: (row: LedgerRow) =>
                  row.amount >= 0
                    ? `+${formatINR(row.amount)}`
                    : `-${formatINR(Math.abs(row.amount))}`,
              },
              {
                key: 'balance',
                label: 'Balance (₹)',
                headerClassName: 'text-right w-24',
                cellClassName: 'text-right font-medium',
                render: (row: LedgerRow) => formatINR(row.balance),
              },
            ]}
            data={ledger}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {id && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          partyId={id}
          balanceDue={Math.max(0, currentOutstanding)}
          onSaved={() => {
            setPaymentModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
