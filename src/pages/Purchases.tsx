import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          + Add Purchase Order
        </Button>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    PO No.
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right p-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center p-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right p-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-4 text-gray-900 font-medium">PO-001</td>
                  <td className="p-4 text-gray-600">ABC Technologies</td>
                  <td className="p-4 text-gray-600">18 Jun 2024</td>
                  <td className="text-right p-4 font-medium text-gray-900">₹50,000</td>
                  <td className="text-center p-4">
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                      Received
                    </span>
                  </td>
                  <td className="text-right p-4">
                    <Link to="#" className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

