import { useInvoices } from '../hooks/useInvoices';
import { useParams, Link } from 'react-router-dom';

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const { invoices } = useInvoices();
  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Not Found</h1>
        <Link to="/invoices/new" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Create New Invoice
        </Link>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    'Partially Paid': 'bg-amber-100 text-amber-700',
    Unpaid: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">← Back</Link>
        <div className="flex gap-2">
          <Link
            to={`/invoices/${invoice.id}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Edit
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Print
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-4xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Invoice</h2>
            <p className="text-gray-600">Invoice No: <span className="font-mono font-bold">{invoice.invoiceNo}</span></p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-md text-xs font-bold ${statusColor[invoice.status]}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Date</h3>
            <p className="text-gray-900">{new Date(invoice.date).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Payment Mode</h3>
            <p className="text-gray-900">{invoice.paymentMode}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Party</h3>
          <p className="text-gray-900 font-medium">{invoice.partyName}</p>
          {invoice.paymentRef && (
            <p className="text-sm text-gray-600 mt-1">Ref: {invoice.paymentRef}</p>
          )}
        </div>

        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-3 text-left text-xs font-semibold text-gray-600">Item</th>
              <th className="p-3 text-right text-xs font-semibold text-gray-600">Qty</th>
              <th className="p-3 text-right text-xs font-semibold text-gray-600">Rate</th>
              <th className="p-3 text-right text-xs font-semibold text-gray-600">Discount</th>
              <th className="p-3 text-right text-xs font-semibold text-gray-600">GST</th>
              <th className="p-3 text-right text-xs font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.itemId} className="border-b border-gray-100">
                <td className="p-3 text-gray-700">{item.name}</td>
                <td className="p-3 text-right text-gray-700">{item.qty}</td>
                <td className="p-3 text-right text-gray-700">{item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right text-gray-700">{item.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right text-gray-700">{item.gstRate}%</td>
                <td className="p-3 text-right font-medium text-gray-900">
                  {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between border-t border-gray-200 pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="text-gray-900">-{invoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxable Amount</span>
              <span className="text-gray-900">{invoice.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST</span>
              <span className="text-gray-900">{invoice.gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Invoice Total</div>
            <div className="text-xl font-bold text-gray-900">
              {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between text-sm">
          <div>
            <div className="text-gray-600">Amount Received</div>
            <div className="font-medium text-gray-900">
              {invoice.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Balance Due</div>
            <div className="font-medium text-gray-900">
              {(invoice.total - invoice.amountReceived).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
