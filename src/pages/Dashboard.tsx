import { useItems } from '../hooks/useItems';
import { useInvoices } from '../hooks/useInvoices';
import KPICard from '../components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function Dashboard() {
  const { items } = useItems();
  const { invoices } = useInvoices();

  const lowStockCount = items.filter((it) => it.currentStock <= 5).length;

  const recentSales = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const statusColor: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    'Partially Paid': 'bg-amber-100 text-amber-700',
    Unpaid: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your inventory and sales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sales" value="₹2,45,000" change="12%" changeType="up" color="blue" />
        <KPICard title="Total Receivables" value="₹1,20,000" change="5%" changeType="up" color="amber" />
        <KPICard title="Total Stock Value" value="₹8,75,000" change="8%" changeType="up" color="green" />
        <KPICard title="Items Low in Stock" value={lowStockCount} change="3" changeType="down" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="flex items-end gap-1 h-full w-full px-4 py-2" style={{ height: '200px' }}>
              {[10000, 15000, 12000, 18000, 14000, 22000].map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-600 rounded-t-sm"
                  style={{ height: `${(val / 22000) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockCount === 0 ? (
              <p className="text-center text-green-600 font-medium py-4">
                ✅ All items are well stocked. No low-stock alerts.
              </p>
            ) : (
              <div className="space-y-2">
                {items
                  .filter((it) => it.currentStock <= 5)
                  .slice(0, 5)
                  .map((it) => (
                    <div key={it.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                          📦
                        </div>
                        <div>
                          <div className="text-sm font-medium">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.sku}</div>
                        </div>
                      </div>
                      <Badge variant="destructive" className="px-2 py-1">
                        {it.currentStock}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                      No sales yet. Create your first invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentSales.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                      <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                      <TableCell>{inv.partyName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {inv.total.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[inv.status]}>{inv.status}</Badge>
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
