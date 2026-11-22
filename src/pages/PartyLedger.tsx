import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function PartyLedger() {
  const { id } = useParams<{ id: string }>();
  const { parties } = useParties();
  const { invoices } = useInvoices();
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

  // Get party's invoices sorted by date (newest first for display)
  const partyInvoices = useMemo(
    () => invoices.filter((inv) => inv.partyId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [invoices, id]
  );

  // Get invoices sorted chronologically (oldest first) for running balance calculation
  const partyInvoicesChronological = useMemo(
    () => invoices.filter((inv) => inv.partyId === id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [invoices, id]
  );

  const totalBilled = partyInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalReceived = partyInvoices.reduce((sum, inv) => sum + inv.amountReceived, 0);

  // Calculate running outstanding balance based on actual transaction history
  // This ensures ledger accuracy even if party.currentOutstanding is stale
  const calculatedOutstanding = useMemo(() => {
    return party.openingOutstanding + totalBilled - totalReceived;
  }, [party.openingOutstanding, totalBilled, totalReceived]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/parties" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back to Parties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Party Ledger</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{party.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">{party.phone}</p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Opening Balance
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {party.openingOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Total Added (Invoices)
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  +{totalBilled.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Total Outstanding
                </p>
                <p className={`text-lg font-bold mt-1 ${calculatedOutstanding < 0 ? 'text-green-600' : calculatedOutstanding > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {calculatedOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Received (Payments):</span>
              <span className="font-medium text-green-600">-{totalReceived.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead className="text-right w-24">Total</TableHead>
                  <TableHead className="text-right w-24">Received</TableHead>
                  <TableHead className="text-right w-24">Balance</TableHead>
                  <TableHead className="text-center w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partyInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  // Display in reverse chronological order (newest first) but calculate balance chronologically
                  partyInvoices.map((inv) => {
                    // Find position in chronological order to get correct running balance
                    const chronoIndex = partyInvoicesChronological.findIndex(i => i.id === inv.id);
                    const runningBalance = partyInvoicesChronological
                      .slice(0, chronoIndex + 1)
                      .reduce((sum, x) => sum + x.total - x.amountReceived, 0) + party.openingOutstanding;
                    
                    const statusColor: Record<string, string> = {
                      Paid: 'bg-green-100 text-green-700',
                      'Partially Paid': 'bg-amber-100 text-amber-700',
                      Unpaid: 'bg-red-100 text-red-700',
                    };
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          <Link to={`/sales/invoices/${inv.id}`}>{inv.invoiceNo}</Link>
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.amountReceived.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {runningBalance.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(statusColor[inv.status], 'px-2 py-1')}>
                            {inv.status}
                          </Badge>
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


