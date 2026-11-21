import { useInvoices } from '../hooks/useInvoices';
import { useParties } from '../hooks/useParties';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const statusColor: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Unpaid: 'bg-red-100 text-red-700',
};

export default function Invoices() {
  const { invoices } = useInvoices();
  const { parties } = useParties();

  const partyMap = new Map(parties.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices
                    .slice()
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((inv) => {
                      const balanceDue = inv.total - inv.amountReceived;
                      const partyName = partyMap.get(inv.partyId) || inv.partyName;
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">
                            <Link to={`/invoices/${inv.id}`}>{inv.invoiceNo}</Link>
                          </TableCell>
                          <TableCell>
                            {new Date(inv.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{partyName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {inv.total.toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {inv.amountReceived.toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {balanceDue.toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'INR',
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusColor[inv.status]}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              to={`/invoices/${inv.id}/edit`}
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Edit
                            </Link>
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
