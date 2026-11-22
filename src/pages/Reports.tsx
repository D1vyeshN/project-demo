import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sales Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-2xl font-bold text-gray-900">₹2,45,000</p>
            <p className="text-sm text-gray-500 mt-2">Total sales this month</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Party Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-500 mt-2">Active parties</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-2xl font-bold text-gray-900">150</p>
            <p className="text-sm text-gray-500 mt-2">Total items in stock</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

