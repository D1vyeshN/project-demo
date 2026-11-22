import { useInvoices } from '../hooks/useInvoices';
import { useParties } from '../hooks/useParties';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  Paid: 'border-green-200 bg-green-100 text-green-700',
  'Partially Paid': 'border-amber-200 bg-amber-100 text-amber-700',
  Unpaid: 'border-red-200 bg-red-100 text-red-700',
};

export default function Invoices() {
  const { invoices } = useInvoices();
  const { parties } = useParties();

  const partyMap = new Map(parties.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Invoices</CardTitle>
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
                  <TableHead className="text-right w-20">Action</TableHead>
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
                          <TableCell className="font-medium text-gray-900">{inv.invoiceNo}</TableCell>
                          <TableCell className="text-gray-600">{new Date(inv.date).toLocaleDateString()}</TableCell>
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
                            <Link
                              to={`/sales/invoices/${inv.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
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

