import { useInvoices } from '../hooks/useInvoices';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { invoices } = useInvoices();
  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/invoices/new" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Create New Invoice
          </Link>
        </CardContent>
      </Card>
    );
  }

  const balanceDue = invoice.total - invoice.amountReceived;

  const statusColor: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    'Partially Paid': 'bg-amber-100 text-amber-700',
    Unpaid: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-background text-foreground rounded-lg text-sm font-medium hover:bg-accent transition"
          >
            Print
          </button>
        </div>
      </div>

      <Card className="p-8 max-w-4xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Invoice</h2>
            <p className="text-gray-600">
              Invoice No: <span className="font-mono font-bold">{invoice.invoiceNo}</span>
            </p>
          </div>
          <div className="text-right">
            <Badge className={statusColor[invoice.status]}>{invoice.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Date
            </h3>
            <p className="text-gray-900">
              {new Date(invoice.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Payment Mode
            </h3>
            <p className="text-gray-900">{invoice.paymentMode}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Party
          </h3>
          <p className="text-gray-900 font-medium">{invoice.partyName}</p>
          {invoice.paymentRef && (
            <p className="text-sm text-gray-600 mt-1">Ref: {invoice.paymentRef}</p>
          )}
        </div>

        <Table className="mb-8">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-center">GST</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.itemId}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
                <TableCell className="text-right">
                  {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  {item.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-center">{item.gstRate}%</TableCell>
                <TableCell className="text-right font-medium">
                  {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between border-t border-input pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">
                {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="text-gray-900">
                -{invoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxable Amount</span>
              <span className="text-gray-900">
                {invoice.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST</span>
              <span className="text-gray-900">
                {invoice.gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Invoice Total</div>
            <div className="text-xl font-bold text-gray-900">
              {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-input flex justify-between text-sm">
          <div>
            <div className="text-gray-600">Amount Received</div>
            <div className="font-medium text-gray-900">
              {invoice.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Balance Due</div>
            <div className="font-medium text-gray-900">
              {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
