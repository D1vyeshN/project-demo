import { Link, useParams } from 'react-router-dom';
import { Edit2, Printer, Share2 } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { useParties } from '../hooks/useParties';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '../lib/types';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => currency.format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'border-green-200 bg-green-100 text-green-700',
  'Partially Paid': 'border-amber-200 bg-amber-100 text-amber-700',
  Unpaid: 'border-red-200 bg-red-100 text-red-700',
};

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { invoices } = useInvoices();
  const { parties } = useParties();
  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            to="/sales/new"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Create New Invoice
          </Link>
        </CardContent>
      </Card>
    );
  }

  const party = parties.find((p) => p.id === invoice.partyId);
  const balanceDue = Math.max(0, invoice.total - invoice.amountReceived);
  const dueDate = invoice.dueDate ?? invoice.date;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Invoice ${invoice.invoiceNo}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        window.alert('Invoice link copied to clipboard.');
      }
    } catch {
      // user dismissed the share sheet or clipboard unavailable — ignore
    }
  };

  return (
    <div className="pb-10">
      {/* Header: title + status + actions */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Sales Invoice - {invoice.invoiceNo}
          </h1>
          <Badge className={cn(statusStyles[invoice.status], 'px-3 py-1')}>
            {invoice.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" />
            Share
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link to={`/sales/invoices/${invoice.id}/edit`}>
              <Edit2 className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Party details + invoice meta */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Party Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="font-semibold text-gray-900">
              {party?.name ?? invoice.partyName}
            </p>
            <div className="space-y-1 text-gray-600">
              <p>
                <span className="font-medium text-gray-500">GSTIN: </span>
                {party?.gstin || '—'}
              </p>
              <p className="whitespace-pre-line">
                <span className="font-medium text-gray-500">Address: </span>
                {party?.address || '—'}
              </p>
            </div>

            <dl className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <dt className="text-gray-500">Invoice Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(invoice.date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Due Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(dueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment Mode</dt>
                <dd className="font-medium text-gray-900">{invoice.paymentMode}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment Status</dt>
                <dd className="font-medium text-gray-900">{invoice.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Invoice Amount</dt>
                <dd className="font-medium text-gray-900">{formatINR(invoice.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Amount Received</dt>
                <dd className="font-medium text-green-700">{formatINR(invoice.amountReceived)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Amount Outstanding</dt>
                <dd className="font-medium text-red-700">{formatINR(balanceDue)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Items + final summary */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-center">Discount %</TableHead>
                      <TableHead className="text-center">GST %</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, idx) => (
                      <TableRow key={`${item.itemId}-${idx}`}>
                        <TableCell className="text-gray-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                        <TableCell className="text-gray-600">{item.sku}</TableCell>
                        <TableCell className="text-center">{item.qty}</TableCell>
                        <TableCell className="text-right">{formatINR(item.rate)}</TableCell>
                        <TableCell className="text-center">{item.discountPercent ?? 0}%</TableCell>
                        <TableCell className="text-center">{item.gstRate}%</TableCell>
                        <TableCell className="text-right font-medium text-gray-900">
                          {formatINR(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Final Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Final Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatINR(invoice.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
                <span className="text-gray-600">Discount (−)</span>
                <span className="font-medium text-gray-900">−{formatINR(invoice.discount)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
                <span className="text-gray-600">Taxable Amount</span>
                <span className="font-medium text-gray-900">{formatINR(invoice.taxableAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm">
                <span className="text-gray-600">GST</span>
                <span className="font-medium text-gray-900">{formatINR(invoice.gst)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md bg-blue-100 px-3 py-3">
                <span className="text-base font-semibold text-gray-900">Invoice Total</span>
                <span className="text-xl font-bold text-blue-800">{formatINR(invoice.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}