import { useParties } from '../hooks/useParties';
import { useInvoices } from '../hooks/useInvoices';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
          <Link to="/parties" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Back to Parties
          </Link>
        </CardContent>
      </Card>
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
        <Link to="/parties" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
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
                  Total Billed
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {totalBilled.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Total Received
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {totalReceived.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Current Outstanding
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {party.currentOutstanding.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                </p>
              </CardContent>
            </Card>
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
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
                      <TableRow key={inv.id}>
                        <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          <Link to={`/invoices/${inv.id}`}>{inv.invoiceNo}</Link>
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
                          <Badge className={statusColor[inv.status]}>{inv.status}</Badge>
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
