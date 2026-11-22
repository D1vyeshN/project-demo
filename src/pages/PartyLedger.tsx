import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { usePayments } from '../hooks/usePayments';
import { useReturns } from '../hooks/useReturns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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
  const { returns } = useReturns();

  const party = parties.find((p) => p.id === id);

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

  // Party's returns — oldest first
  const partyReturns = useMemo(
    () =>
      returns
        .filter((r) => r.partyId === id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [returns, id]
  );

  // Build the unified ledger chronologically
  const ledger: LedgerRow[] = useMemo(() => {
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
    for (const ret of partyReturns) {
      allEvents.push({
        date: ret.date,
        type: 'Return',
        refNo: ret.refNo,
        amount: -Math.abs(ret.amount),
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
  }, [party.openingOutstanding, party.createdAt, partyInvoices, partyPayments, partyReturns]);

  const totalSales = partyInvoices.reduce((s, inv) => s + inv.total, 0);
  const totalReturns = partyReturns.reduce((s, r) => s + Math.abs(r.amount), 0);
  const currentOutstanding = ledger.length > 0 ? ledger[ledger.length - 1].balance : party.openingOutstanding;

  const typeColor: Record<string, string> = {
    'Opening Ledger': 'bg-blue-100 text-blue-700',
    Sale: 'bg-green-100 text-green-700',
    Return: 'bg-red-100 text-red-700',
    Payment: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/parties" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back to Parties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Party Ledger</h1>
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
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Total Returns
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              −{formatINR(totalReturns)}
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
          <Button variant="outline" onClick={() => { /* open record payment */ }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Record Payment
          </Button>
          <Button variant="outline" onClick={() => { /* open add return */ }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Return
          </Button>
        </div>
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-24">Ref No</TableHead>
                  <TableHead className="text-right w-24">Amount (₹)</TableHead>
                  <TableHead className="text-right w-24">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map((row) => (
                    <TableRow key={`${row.date}-${row.refNo}-${row.balance}`}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${typeColor[row.type]}`}
                        >
                          {row.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{row.refNo}</TableCell>
                      <TableCell className={`text-right font-medium ${row.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {row.amount >= 0 ? `+${formatINR(row.amount)}` : `-${formatINR(Math.abs(row.amount))}`}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${row.balance > 0 ? 'text-red-600' : row.balance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {formatINR(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
